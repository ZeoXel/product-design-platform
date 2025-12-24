#!/usr/bin/env python3
"""
重新构建图库系统
分析所有图片，生成元数据和向量
"""
import asyncio
import base64
import sys
from pathlib import Path
import json
from datetime import datetime

# 添加 backend 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.claude_service import claude_service
from services.embedding_service import embedding_service
from services.search_utils import generate_multimodal_search_description
import numpy as np


async def rebuild_gallery():
    """重新构建图库"""
    print("\n" + "="*60)
    print("🔨 重新构建图库系统")
    print("="*60)

    # 路径设置
    base_dir = Path(__file__).parent.parent / "data" / "gallery"
    images_dir = base_dir / "images"
    embeddings_dir = base_dir / "embeddings"
    metadata_file = base_dir / "metadata.json"

    # 清空 embeddings 目录
    print("\n🗑️  清空向量目录...")
    for emb_file in embeddings_dir.glob("*.npy"):
        emb_file.unlink()

    # 获取所有图片文件（支持 jpg 和 png）
    image_files = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png"))
    total = len(image_files)

    print(f"\n📸 找到 {total} 个图片文件")

    if total == 0:
        print("❌ 没有图片文件")
        return

    # 初始化元数据
    metadata = {"items": []}

    # 统计
    success_count = 0
    error_count = 0

    # 处理每个图片
    for idx, img_path in enumerate(image_files, 1):
        file_id = img_path.stem
        print(f"\n[{idx}/{total}] 处理: {img_path.name}")

        try:
            # 读取图片
            with open(img_path, 'rb') as f:
                image_data = f.read()

            image_base64 = base64.b64encode(image_data).decode('utf-8')
            print(f"  📦 大小: {len(image_data) / 1024:.1f} KB")

            # 分析图片
            print(f"  🔍 分析中...")
            analysis = await claude_service.analyze_image(
                image_base64=image_base64,
                prompt="分析这个产品设计的元素、风格和结构"
            )

            print(f"  ✅ 分析完成")
            print(f"     主要元素: {', '.join([e.type for e in analysis.elements.primary[:3]])}")
            print(f"     风格: {', '.join(analysis.style.tags[:3])}")

            # 生成检索描述
            search_desc = generate_multimodal_search_description(analysis)
            print(f"  📝 检索描述: {search_desc[:60]}...")

            # 生成嵌入向量
            print(f"  🧮 生成向量...")
            embedding = await embedding_service.generate_embedding(
                image_base64="",
                text=search_desc
            )

            if embedding is not None:
                # 保存向量
                embedding_path = embeddings_dir / f"{file_id}.npy"
                np.save(embedding_path, embedding)
                print(f"  ✅ 向量已保存")
            else:
                print(f"  ⚠️  向量生成失败")

            # 添加到元数据
            item = {
                "id": file_id,
                "filename": img_path.name,
                "uploadTime": datetime.now().isoformat(),
                "analysis": analysis.model_dump(),
                "salesTier": "B"
            }
            metadata["items"].append(item)

            success_count += 1

            # 避免请求过快
            if idx < total:
                await asyncio.sleep(0.5)

        except Exception as e:
            print(f"  ❌ 处理失败: {e}")
            error_count += 1
            import traceback
            traceback.print_exc()

    # 保存元数据
    print(f"\n💾 保存元数据...")
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # 统计
    print("\n" + "="*60)
    print("📊 重建完成")
    print("="*60)
    print(f"✅ 成功: {success_count}")
    print(f"❌ 失败: {error_count}")
    print(f"📊 总计: {total}")
    print()

    if success_count > 0:
        print(f"🎉 图库已重建！共 {success_count} 个产品")
    else:
        print("⚠️  没有成功处理任何图片")


if __name__ == "__main__":
    asyncio.run(rebuild_gallery())
