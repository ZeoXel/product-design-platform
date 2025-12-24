#!/usr/bin/env python3
"""
基础图库设置脚本（不含向量嵌入）
- 压缩并转换图片
- 创建基本元数据
- 后续可通过前端逐步完善分析数据
"""
import os
import sys
import uuid
import json
from pathlib import Path
from datetime import datetime
from PIL import Image
import io

sys.path.insert(0, str(Path(__file__).parent.parent))


def compress_image(image_path: Path, max_size_kb: int = 400) -> bytes:
    """压缩图片"""
    img = Image.open(image_path)

    if img.mode in ('RGBA', 'P', 'LA'):
        img = img.convert('RGB')

    max_dimension = 1024
    if max(img.size) > max_dimension:
        ratio = max_dimension / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

    quality = 85
    while True:
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        data = buffer.getvalue()

        if len(data) <= max_size_kb * 1024 or quality <= 30:
            return data

        quality -= 10


def setup_gallery():
    """设置图库"""
    base_dir = Path(__file__).parent.parent / "data" / "gallery"
    images_dir = base_dir / "images"
    metadata_file = base_dir / "metadata.json"

    # 加载或创建元数据
    metadata = {"items": []}

    # 获取所有 PNG 截图
    png_files = [
        f for f in images_dir.iterdir()
        if f.is_file() and f.suffix.lower() == '.png' and f.name.startswith('截屏')
    ]

    print(f"📁 找到 {len(png_files)} 张图片")
    print("=" * 60)

    for i, png_file in enumerate(png_files, 1):
        print(f"\n[{i}/{len(png_files)}] {png_file.name}")

        try:
            # 压缩图片
            print(f"  🗜️  压缩...")
            compressed = compress_image(png_file, max_size_kb=400)
            print(f"  ✓ 完成: {len(compressed) / 1024:.1f} KB")

            # 生成 ID
            ref_id = str(uuid.uuid4())
            jpg_filename = f"{ref_id}.jpg"
            jpg_path = images_dir / jpg_filename

            # 保存
            with open(jpg_path, 'wb') as f:
                f.write(compressed)

            # 创建元数据（简化版，无详细分析）
            item = {
                "id": ref_id,
                "filename": jpg_filename,
                "uploadTime": datetime.now().isoformat(),
                "analysis": {
                    "elements": {
                        "primary": [{"type": "待分析"}],
                        "secondary": [],
                        "hardware": []
                    },
                    "style": {
                        "tags": ["手工饰品"],
                        "mood": "待分析"
                    },
                    "physicalSpecs": {
                        "lengthCm": 0,
                        "weightG": 0
                    },
                    "suggestions": []
                },
                "salesTier": "B"
            }

            metadata["items"].append(item)
            print(f"  ✅ {ref_id}")

        except Exception as e:
            print(f"  ❌ 失败: {e}")

    # 保存元数据
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print(f"✅ 完成！共处理 {len(metadata['items'])} 张图片")
    print(f"📄 元数据已保存到: {metadata_file}")
    print("\n💡 后续步骤：")
    print("  1. 通过前端界面访问图库")
    print("  2. 使用 '重新分析' 功能逐步完善图片分析数据")
    print("  3. 向量检索功能需要网关支持图像嵌入 API")


if __name__ == "__main__":
    print("🚀 开始设置基础图库...")
    setup_gallery()
