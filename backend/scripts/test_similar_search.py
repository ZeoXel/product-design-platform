#!/usr/bin/env python3
"""
测试相似产品检索的完整流程
"""
import asyncio
import base64
import sys
from pathlib import Path

# 添加 backend 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.claude_service import claude_service
from services.embedding_service import embedding_service
from services.gallery_service import gallery_service
from services.search_utils import generate_multimodal_search_description


async def test_complete_workflow():
    """测试完整的相似产品检索工作流"""
    print("\n" + "="*60)
    print("🧪 测试相似产品检索完整流程")
    print("="*60)

    # 1. 选择一张测试图片
    gallery_dir = Path(__file__).parent.parent / "data" / "gallery"
    images_dir = gallery_dir / "images"

    test_images = list(images_dir.glob("*.jpg"))
    if not test_images:
        print("❌ 图库中没有测试图片")
        return

    test_image = test_images[0]
    print(f"\n📸 测试图片: {test_image.name}")

    # 2. 读取图片并转换为 base64
    with open(test_image, 'rb') as f:
        image_data = f.read()
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    print(f"   大小: {len(image_data)} bytes")

    # 3. 使用 Claude 分析图片
    print("\n🔍 步骤 1: Claude 图像分析")
    try:
        analysis = await claude_service.analyze_image(
            image_base64=image_base64,
            prompt="分析这个挂饰设计的元素、风格和结构"
        )
        print(f"   ✅ 分析成功")
        print(f"   主要元素: {', '.join([e.type for e in analysis.elements.primary])}")
        print(f"   风格标签: {', '.join(analysis.style.tags[:3])}")
    except Exception as e:
        print(f"   ❌ 分析失败: {e}")
        return

    # 4. 生成标准化检索描述
    print("\n📝 步骤 2: 生成标准化检索描述")
    search_desc = generate_multimodal_search_description(analysis)
    print(f"   描述: {search_desc}")

    # 5. 生成嵌入向量
    print("\n🧮 步骤 3: 生成嵌入向量")
    try:
        query_embedding = await embedding_service.generate_embedding(
            image_base64="",  # 不使用图像，只用文本
            text=search_desc
        )
        print(f"   ✅ 向量生成成功")
        print(f"   维度: {query_embedding.shape}")
        print(f"   归一化: {query_embedding.dot(query_embedding):.4f}")
    except Exception as e:
        print(f"   ❌ 向量生成失败: {e}")
        return

    # 6. 执行相似度检索
    print("\n🔎 步骤 4: 相似度检索")
    try:
        similar_items = await gallery_service.find_similar(
            query_embedding=query_embedding,
            top_k=5,
            threshold=0.3
        )
        print(f"   ✅ 找到 {len(similar_items)} 个相似产品\n")

        for i, item in enumerate(similar_items, 1):
            item_analysis = item["item"].get("analysis", {})
            style = item_analysis.get("style", {})
            similarity = item["similarity"]

            print(f"   {i}. ID: {item['id'][:8]}...")
            print(f"      相似度: {similarity:.2%}")
            print(f"      风格: {', '.join(style.get('tags', [])[:3])}")
            print(f"      URL: {item['imageUrl']}")
            print()

    except Exception as e:
        print(f"   ❌ 检索失败: {e}")
        import traceback
        traceback.print_exc()
        return

    # 7. 模拟前端 API 响应
    print("📦 步骤 5: 模拟 API 响应格式")
    api_response = {
        "elements": analysis.elements.model_dump(),
        "style": analysis.style.model_dump(),
        "physicalSpecs": analysis.physicalSpecs.model_dump(),
        "suggestions": analysis.suggestions,
        "similarItems": [
            {
                "id": item["id"],
                "imageUrl": item["imageUrl"],
                "similarity": item["similarity"]
            }
            for item in similar_items[:3]
        ]
    }

    print(f"   ✅ API 响应格式:")
    print(f"   - 元素: {len(api_response['elements']['primary'])} 主要, {len(api_response['elements']['secondary'])} 辅助")
    print(f"   - 风格: {len(api_response['style']['tags'])} 个标签")
    print(f"   - 相似产品: {len(api_response['similarItems'])} 个")

    # 8. 验证数据完整性
    print("\n✅ 步骤 6: 验证数据完整性")
    checks = [
        ("分析结果存在", analysis is not None),
        ("主要元素非空", len(analysis.elements.primary) > 0),
        ("风格标签非空", len(analysis.style.tags) > 0),
        ("嵌入向量有效", query_embedding is not None and len(query_embedding) > 0),
        ("找到相似产品", len(similar_items) > 0),
        ("相似度在范围内", all(0 <= item["similarity"] <= 1 for item in similar_items)),
    ]

    all_passed = True
    for check_name, passed in checks:
        status = "✅" if passed else "❌"
        print(f"   {status} {check_name}")
        if not passed:
            all_passed = False

    # 总结
    print("\n" + "="*60)
    if all_passed:
        print("🎉 所有测试通过！相似产品检索功能正常工作")
    else:
        print("⚠️  部分测试失败，请检查上述错误")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(test_complete_workflow())
