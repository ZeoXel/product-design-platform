#!/usr/bin/env python3
"""测试相似图片搜索"""
import requests
import base64
import json
from pathlib import Path

# 使用图库中已有的图片
metadata = json.load(open('data/gallery/metadata.json'))
first_item = metadata['items'][0]
image_path = Path('data/gallery/images') / first_item['filename']

print(f"测试图片: {first_item['filename']}")
print(f"风格标签: {first_item['analysis']['style']['tags']}")

with open(image_path, 'rb') as f:
    image_data = f.read()

image_base64 = base64.b64encode(image_data).decode('utf-8')

# 测试相似搜索
print("\n=== 测试相似图片搜索（阈值=0.3）===")
response = requests.post(
    "http://localhost:8001/api/v1/gallery/similar",
    json={
        "image": image_base64,
        "text": " ".join(first_item['analysis']['style']['tags']) + " " + first_item['analysis']['style']['mood'],
        "top_k": 5,
        "threshold": 0.3  # 降低阈值
    }
)

print(f"状态码: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    if result['success'] and result['similar']:
        print(f"\n✓ 找到 {len(result['similar'])} 个相似图片:")
        for item in result['similar']:
            print(f"  - ID: {item['id'][:8]}..., 相似度: {item['similarity']:.3f}")
    else:
        print(f"\n✗ 未找到相似图片")
else:
    print(f"\n✗ 失败: {response.text}")
