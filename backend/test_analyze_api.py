#!/usr/bin/env python3
"""测试图像分析 API"""
import requests
import base64
from pathlib import Path

# 读取一张测试图片
test_image = list(Path("data/gallery/images").glob("*.jpg"))[0]
print(f"测试图片: {test_image.name}")

with open(test_image, 'rb') as f:
    image_data = f.read()

image_base64 = base64.b64encode(image_data).decode('utf-8')

# 测试分析 API
print("\n=== 测试图像分析 API ===")
response = requests.post(
    "http://localhost:8001/api/v1/analyze",
    json={
        "image": image_base64,
        "prompt": "分析这个挂饰的元素和风格"
    },
    params={"include_similar": True}
)

print(f"状态码: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    print(f"\n✓ 分析成功!")
    print(f"  风格标签: {result['style']['tags']}")
    print(f"  情绪: {result['style']['mood']}")
    print(f"  主要元素: {[e['type'] for e in result['elements']['primary']]}")

    if result.get('similarItems'):
        print(f"\n  相似产品: {len(result['similarItems'])} 个")
        for item in result['similarItems']:
            print(f"    - ID: {item['id']}, 相似度: {item['similarity']:.3f}")
    else:
        print(f"\n  无相似产品")
else:
    print(f"\n✗ 失败")
    print(response.text)
