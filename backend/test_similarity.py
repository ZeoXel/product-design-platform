#!/usr/bin/env python3
"""测试文本嵌入的相似度检索效果"""
import asyncio
import json
from pathlib import Path
from services.embedding_service import embedding_service
import numpy as np

async def test_similarity():
    # 模拟几个不同的查询场景
    test_cases = [
        {
            "name": "场景1：查找流苏耳环",
            "query": "珍珠 流苏 优雅 三层 粉色",
            "references": [
                ("参考A", "珍珠 流苏 简约 温柔"),
                ("参考B", "水晶 流苏 可爱 粉色"),
                ("参考C", "珍珠 圆形耳钉 百搭"),
                ("参考D", "金属 编织 手工"),
            ]
        },
        {
            "name": "场景2：查找简约风格",
            "query": "极简 线条 金属 现代感",
            "references": [
                ("参考A", "简约 金属 几何 冷淡风"),
                ("参考B", "复杂 华丽 宫廷风 珍珠"),
                ("参考C", "手工 编织 温暖 自然"),
                ("参考D", "极简主义 黑白 线性"),
            ]
        },
        {
            "name": "场景3：查找夏日清爽款",
            "query": "夏天 海洋 清爽 蓝色 贝壳",
            "references": [
                ("参考A", "贝壳 天然 海边 度假风"),
                ("参考B", "金属 厚重 复古 秋冬"),
                ("参考C", "水晶 透明 清凉 冰蓝"),
                ("参考D", "编织 棉麻 温暖 大地色"),
            ]
        }
    ]

    for case in test_cases:
        print(f"\n{'='*60}")
        print(f"📌 {case['name']}")
        print(f"{'='*60}")
        print(f"🔍 查询描述: {case['query']}\n")

        # 生成查询向量
        query_emb = await embedding_service.generate_embedding("", case['query'])

        # 计算每个参考的相似度
        results = []
        for ref_name, ref_desc in case['references']:
            ref_emb = await embedding_service.generate_embedding("", ref_desc)
            if query_emb is not None and ref_emb is not None:
                similarity = embedding_service.compute_similarity(query_emb, ref_emb)
                results.append((ref_name, ref_desc, similarity))

        # 按相似度排序
        results.sort(key=lambda x: x[2], reverse=True)

        # 显示结果
        print("📊 检索结果（按相似度排序）:\n")
        for i, (name, desc, sim) in enumerate(results, 1):
            bar = "█" * int(sim * 20)
            emoji = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
            print(f"{emoji} {i}. {name} - 相似度 {sim:.3f} {bar}")
            print(f"      描述: {desc}\n")

    print(f"\n{'='*60}")
    print("💡 分析：")
    print("- 相似度 > 0.85: 高度相关（用户很可能满意）")
    print("- 相似度 0.70-0.85: 中度相关（可能有用）")
    print("- 相似度 < 0.70: 弱相关（可能不符合期望）")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test_similarity())
