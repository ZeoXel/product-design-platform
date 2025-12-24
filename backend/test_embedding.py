#!/usr/bin/env python3
"""测试嵌入生成"""
import asyncio
import base64
from pathlib import Path
from services.embedding_service import embedding_service

async def test():
    # 读取一张测试图片
    image_path = Path("data/gallery/images").glob("*.png").__next__()
    print(f"测试图片: {image_path.name}")

    with open(image_path, 'rb') as f:
        image_data = f.read()

    image_base64 = base64.b64encode(image_data).decode('utf-8')
    print(f"图片大小: {len(image_base64)} 字符")

    # 测试1: 仅图像
    print("\n=== 测试1: 仅图像 ===")
    result1 = await embedding_service.generate_embedding(image_base64)
    print(f"结果: {result1 is not None}")

    # 测试2: 图像+文本
    print("\n=== 测试2: 图像+文本 ===")
    result2 = await embedding_service.generate_embedding(
        image_base64,
        text="手工 自然 简约 清新自然"
    )
    print(f"结果: {result2 is not None}")

    # 测试3: 仅文本
    print("\n=== 测试3: 仅文本 ===")
    result3 = await embedding_service.generate_embedding(
        "",
        text="手工 自然 简约 清新自然"
    )
    print(f"结果: {result3 is not None}")

if __name__ == "__main__":
    asyncio.run(test())
