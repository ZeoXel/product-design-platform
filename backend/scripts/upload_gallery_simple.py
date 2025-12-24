#!/usr/bin/env python3
"""
简化版图库上传脚本
- 自动压缩图片
- 使用模拟分析数据
- 生成嵌入向量用于相似度检索
"""
import os
import sys
import asyncio
import base64
import uuid
import json
from pathlib import Path
from datetime import datetime
from PIL import Image
import io

# 添加 backend 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.embedding_service import embedding_service
from models import ImageAnalysis, ElementsGroup, StyleInfo, PhysicalSpecs
import numpy as np


def compress_image(image_path: Path, max_size_kb: int = 500) -> bytes:
    """压缩图片到指定大小"""
    img = Image.open(image_path)

    # 转换为 RGB
    if img.mode in ('RGBA', 'P', 'LA'):
        img = img.convert('RGB')

    # 计算缩放比例
    max_dimension = 1024
    if max(img.size) > max_dimension:
        ratio = max_dimension / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    # 压缩为 JPEG
    quality = 85
    while True:
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        data = buffer.getvalue()

        if len(data) <= max_size_kb * 1024 or quality <= 30:
            return data

        quality -= 10


def create_mock_analysis(filename: str) -> ImageAnalysis:
    """创建模拟分析数据"""
    # 根据文件名生成不同的元素
    elements = {
        "primary": [
            {"type": "贝壳", "color": "米白色"},
            {"type": "珍珠", "color": "白色"}
        ],
        "secondary": [
            {"type": "小珠子", "count": 8}
        ],
        "hardware": [
            {"type": "金属扣", "material": "合金"}
        ]
    }

    return ImageAnalysis(
        elements=ElementsGroup(**elements),
        style=StyleInfo(
            tags=["手工", "自然", "简约"],
            mood="清新自然"
        ),
        physicalSpecs=PhysicalSpecs(
            lengthCm=15.0,
            weightG=12.0
        ),
        suggestions=["可以尝试不同的配色方案"]
    )


async def upload_images():
    """批量上传图片"""
    images_dir = Path(__file__).parent.parent / "data" / "gallery" / "images"
    embeddings_dir = Path(__file__).parent.parent / "data" / "gallery" / "embeddings"
    metadata_file = Path(__file__).parent.parent / "data" / "gallery" / "metadata.json"

    # 加载现有元数据
    if metadata_file.exists():
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    else:
        metadata = {"items": []}

    # 获取所有 PNG 图片
    image_files = [
        f for f in images_dir.iterdir()
        if f.is_file() and f.suffix.lower() == '.png'
        and f.name.startswith('截屏')
    ]

    print(f"📁 找到 {len(image_files)} 张图片")
    print("=" * 60)

    success_count = 0
    failed_count = 0

    for i, image_file in enumerate(image_files, 1):
        print(f"\n[{i}/{len(image_files)}] {image_file.name}")

        try:
            # 压缩图片
            print(f"  🗜️  压缩图片...")
            compressed_data = compress_image(image_file, max_size_kb=400)
            print(f"  ✓ 压缩完成: {len(compressed_data) / 1024:.1f} KB")

            # 转换为 base64
            image_base64 = base64.b64encode(compressed_data).decode('utf-8')

            # 生成新 ID
            ref_id = str(uuid.uuid4())

            # 保存压缩后的图片（覆盖原图）
            jpg_filename = f"{ref_id}.jpg"
            jpg_path = images_dir / jpg_filename

            with open(jpg_path, 'wb') as f:
                f.write(compressed_data)

            print(f"  💾 保存为: {jpg_filename}")

            # 创建模拟分析
            analysis = create_mock_analysis(image_file.name)

            # 生成文本描述用于嵌入
            text_description = f"{' '.join(analysis.style.tags)} {analysis.style.mood}"

            # 生成嵌入向量（基于文本描述）
            print(f"  🧮 生成嵌入向量...")
            try:
                embedding = await embedding_service.generate_embedding(
                    image_base64=image_base64,
                    text=text_description
                )

                # 只有成功生成嵌入时才保存
                if embedding is not None:
                    embedding_path = embeddings_dir / f"{ref_id}.npy"
                    np.save(embedding_path, embedding)
                    print(f"  ✓ 嵌入向量已保存")
                else:
                    print(f"  ⚠️  跳过嵌入向量生成（稍后可通过前端重新生成）")
            except Exception as emb_error:
                print(f"  ⚠️  嵌入向量生成失败: {emb_error}")
                print(f"  ⚠️  跳过嵌入向量，继续处理...")

            # 添加到元数据
            item = {
                "id": ref_id,
                "filename": jpg_filename,
                "uploadTime": datetime.now().isoformat(),
                "analysis": analysis.model_dump(),
                "salesTier": "B"
            }

            metadata["items"].append(item)

            # 保存元数据
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

            print(f"  ✅ 成功: {ref_id}")
            success_count += 1

            # 删除原始 PNG 文件
            # image_file.unlink()

        except Exception as e:
            print(f"  ❌ 失败: {str(e)}")
            failed_count += 1
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print(f"📊 上传完成")
    print(f"  ✅ 成功: {success_count}")
    print(f"  ❌ 失败: {failed_count}")
    print(f"  📁 总计: {len(image_files)}")


if __name__ == "__main__":
    print("🚀 开始批量上传图库素材（简化版）...")
    asyncio.run(upload_images())
