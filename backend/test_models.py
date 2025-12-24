#!/usr/bin/env python3
"""测试不同嵌入模型"""
import asyncio
import base64
import httpx
import json
from pathlib import Path
from config import get_settings

settings = get_settings()

async def test_model(model_name: str, use_image: bool = False):
    """测试指定模型"""
    print(f"\n{'='*60}")
    print(f"测试模型: {model_name}")
    print(f"使用图像: {use_image}")
    print('='*60)

    # 读取测试图片（压缩后的）
    jpg_files = list(Path("data/gallery/images").glob("*.jpg"))
    if not jpg_files:
        print("❌ 没有找到测试图片")
        return

    with open(jpg_files[0], 'rb') as f:
        image_data = f.read()

    image_base64 = base64.b64encode(image_data).decode('utf-8')
    text_desc = "手工 自然 简约 清新自然"

    print(f"图片大小: {len(image_base64)} 字符")

    # 构建 payload
    if use_image:
        # 尝试使用图像+文本格式
        payload = {
            "model": model_name,
            "input": [{"image": image_base64, "text": text_desc}],
            "normalized": True,
            "embedding_type": "multimodal"
        }
        print("格式: 图像+文本（多模态）")
    else:
        # 纯文本格式
        payload = {
            "model": model_name,
            "input": text_desc
        }
        print("格式: 纯文本")

    # 发送请求
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{settings.OPENAI_API_BASE}/embeddings",
                headers=headers,
                json=payload
            )

            if response.status_code == 200:
                data = response.json()
                if "data" in data and len(data["data"]) > 0:
                    embedding = data["data"][0].get("embedding", [])
                    print(f"✅ 成功！")
                    print(f"   向量维度: {len(embedding)}")
                    print(f"   前5个值: {embedding[:5]}")
                else:
                    print(f"❌ 响应格式错误")
                    print(f"   响应: {data}")
            else:
                print(f"❌ 失败 - HTTP {response.status_code}")
                print(f"   响应: {response.text}")

        except Exception as e:
            print(f"❌ 异常: {e}")

async def main():
    """主测试流程"""
    models = [
        "text-embedding-ada-002",
        "text-embedding-3-large",
        "text-embedding-3-small"  # 作为对比
    ]

    print("🚀 开始测试嵌入模型...")

    # 测试1: 所有模型的纯文本模式
    print("\n" + "="*60)
    print("阶段1: 测试纯文本模式")
    print("="*60)
    for model in models:
        await test_model(model, use_image=False)

    # 测试2: 所有模型的图像+文本模式
    print("\n" + "="*60)
    print("阶段2: 测试图像+文本模式（多模态）")
    print("="*60)
    for model in models:
        await test_model(model, use_image=True)

    print("\n" + "="*60)
    print("测试完成")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
