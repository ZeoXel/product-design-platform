#!/usr/bin/env python3
"""
批量上传图库素材脚本
自动分析图片并生成嵌入向量
"""
import os
import sys
import asyncio
from pathlib import Path

# 添加 backend 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from services import claude_service, gallery_service


async def upload_images():
    """批量上传图片到图库"""
    images_dir = Path(__file__).parent.parent / "data" / "gallery" / "images"

    # 获取所有图片文件
    image_files = [
        f for f in images_dir.iterdir()
        if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']
        and not f.name.startswith('.')  # 排除隐藏文件
    ]

    print(f"📁 找到 {len(image_files)} 张图片")
    print("=" * 60)

    success_count = 0
    failed_count = 0

    for i, image_file in enumerate(image_files, 1):
        print(f"\n[{i}/{len(image_files)}] 正在处理: {image_file.name}")

        try:
            # 读取图片
            with open(image_file, 'rb') as f:
                image_data = f.read()

            # 转换为 base64
            import base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            print(f"  📊 大小: {len(image_data) / 1024:.1f} KB")
            print(f"  🔍 分析中...")

            # 调用 Claude 分析
            analysis = await claude_service.analyze_image(
                image_base64=image_base64,
                prompt="详细分析这个挂饰设计的元素、风格和结构"
            )

            print(f"  ✓ 分析完成")
            print(f"    - 主元素: {', '.join([e.type for e in analysis.elements.primary])}")
            print(f"    - 风格: {', '.join(analysis.style.tags)}")

            # 添加到图库（会自动生成嵌入向量）
            print(f"  🧮 生成嵌入向量...")

            item = await gallery_service.add_reference(
                image_base64=image_base64,
                analysis=analysis,
                sales_tier="B"  # 默认 B 级
            )

            print(f"  ✅ 成功上传: {item['id']}")
            success_count += 1

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
    print("🚀 开始批量上传图库素材...")
    asyncio.run(upload_images())
