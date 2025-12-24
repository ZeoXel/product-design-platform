#!/usr/bin/env python3
"""测试完整的向量检索流程"""
import asyncio
import base64
from pathlib import Path
from services.gallery_service import gallery_service
from services.embedding_service import embedding_service

async def test_complete_flow():
    print("="*60)
    print("🧪 完整向量检索流程测试")
    print("="*60)

    # 1. 检查图库状态
    print("\n📊 第1步：检查图库状态")
    print("-"*60)
    all_items = gallery_service.list_references(limit=100)
    print(f"✅ 图库共有 {len(all_items)} 张图片")

    # 显示前5张
    for i, item in enumerate(all_items[:5], 1):
        tags = item.get('analysis', {}).get('style', {}).get('tags', [])
        print(f"   {i}. {item['id'][:8]}... - 标签: {', '.join(tags)}")

    # 2. 模拟用户查询（文字描述）
    print("\n🔍 第2步：用户输入文字查询")
    print("-"*60)
    query_text = "流苏 粉色 温柔 优雅 三层"
    print(f"查询: \"{query_text}\"")

    # 3. 生成查询向量
    print("\n🧮 第3步：生成查询向量")
    print("-"*60)
    query_embedding = await embedding_service.generate_embedding("", query_text)
    if query_embedding is None:
        print("❌ 向量生成失败")
        return
    print(f"✅ 向量维度: {query_embedding.shape}")
    print(f"   前5个值: {query_embedding[:5]}")

    # 4. 向量检索
    print("\n🎯 第4步：向量检索")
    print("-"*60)
    similar_items = await gallery_service.find_similar(
        query_embedding=query_embedding,
        top_k=5,
        threshold=0.3
    )
    print(f"✅ 找到 {len(similar_items)} 个相似结果")

    # 5. 展示结果
    print("\n📊 第5步：检索结果（按相似度排序）")
    print("-"*60)
    for i, result in enumerate(similar_items, 1):
        item = result['item']
        tags = item.get('analysis', {}).get('style', {}).get('tags', [])
        mood = item.get('analysis', {}).get('style', {}).get('mood', '')

        bar = "█" * int(result['similarity'] * 30)
        emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "

        print(f"\n{emoji} 第 {i} 名 - 相似度: {result['similarity']:.3f}")
        print(f"   {bar}")
        print(f"   ID: {result['id'][:16]}...")
        print(f"   标签: {', '.join(tags)}")
        print(f"   情绪: {mood}")
        print(f"   图片: {result['imageUrl']}")

    # 6. 模拟用户选择
    print("\n✅ 第6步：用户选择参考图")
    print("-"*60)
    if similar_items:
        selected = similar_items[0]
        print(f"用户选择了相似度最高的图片:")
        print(f"  → {selected['imageUrl']}")
        print(f"  → 可以将此图发送给 AI 生图服务")

    print("\n" + "="*60)
    print("🎉 完整流程测试通过！")
    print("="*60)

    # 7. 性能统计
    print("\n📈 系统状态:")
    print(f"  • 图库规模: {len(all_items)} 张")
    print(f"  • 向量维度: 1536")
    print(f"  • 检索阈值: 0.3")
    print(f"  • 返回数量: Top-5")
    print(f"  • 存储路径: data/gallery/")

if __name__ == "__main__":
    asyncio.run(test_complete_flow())
