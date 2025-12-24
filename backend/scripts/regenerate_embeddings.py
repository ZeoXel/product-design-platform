#!/usr/bin/env python3
"""
重新生成图库中所有图片的嵌入向量
使用改进的标准化描述方法
"""
import asyncio
import json
import sys
from pathlib import Path
import numpy as np

# 添加 backend 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import ImageAnalysis
from services.embedding_service import embedding_service
from services.search_utils import generate_multimodal_search_description


async def regenerate_embeddings():
    """重新生成所有嵌入向量"""
    # 路径设置
    base_dir = Path(__file__).parent.parent / "data" / "gallery"
    embeddings_dir = base_dir / "embeddings"
    metadata_file = base_dir / "metadata.json"

    if not metadata_file.exists():
        print("❌ 元数据文件不存在")
        return

    # 加载元数据
    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    items = metadata.get("items", [])
    total = len(items)

    if total == 0:
        print("⚠️  图库中没有图片")
        return

    print("\n" + "="*60)
    print(f"📊 图库嵌入向量重新生成")
    print("="*60)
    print(f"\n总共需要处理 {total} 张图片")
    print(f"使用改进的标准化描述方法\n")

    # 统计
    success_count = 0
    skipped_count = 0
    error_count = 0

    # 处理每个项目
    for idx, item in enumerate(items, 1):
        ref_id = item["id"]
        print(f"\n[{idx}/{total}] 处理 {ref_id}...")

        try:
            # 从元数据中获取分析结果
            analysis_dict = item.get("analysis")
            if not analysis_dict:
                print(f"  ⚠️  跳过：无分析数据")
                skipped_count += 1
                continue

            # 转换为 ImageAnalysis 对象
            try:
                analysis = ImageAnalysis(**analysis_dict)
            except Exception as e:
                print(f"  ⚠️  跳过：分析数据格式错误 - {e}")
                skipped_count += 1
                continue

            # 生成标准化描述
            text_desc = generate_multimodal_search_description(analysis)
            print(f"  📝 描述: {text_desc[:80]}...")

            # 生成嵌入向量
            # 注意：这里我们只使用文本，因为图片文件可能不存在或太大
            embedding = await embedding_service.generate_embedding(
                image_base64="",  # 不使用图像
                text=text_desc
            )

            if embedding is not None:
                # 保存向量
                embedding_path = embeddings_dir / f"{ref_id}.npy"
                np.save(embedding_path, embedding)
                print(f"  ✅ 向量已生成并保存 ({embedding.shape})")
                success_count += 1
            else:
                print(f"  ❌ 向量生成失败")
                error_count += 1

        except Exception as e:
            print(f"  ❌ 处理失败: {e}")
            error_count += 1
            import traceback
            traceback.print_exc()

        # 避免请求过快
        if idx < total:
            await asyncio.sleep(0.5)

    # 打印统计
    print("\n" + "="*60)
    print("📊 处理完成")
    print("="*60)
    print(f"✅ 成功: {success_count}")
    print(f"⚠️  跳过: {skipped_count}")
    print(f"❌ 失败: {error_count}")
    print(f"📊 总计: {total}")
    print()

    if success_count > 0:
        print(f"🎉 已成功重新生成 {success_count} 个嵌入向量")
        print("   使用新的标准化描述方法，检索准确度将得到提升")
    else:
        print("⚠️  没有成功生成任何向量，请检查错误信息")


async def verify_embeddings():
    """验证嵌入向量是否正确生成"""
    base_dir = Path(__file__).parent.parent / "data" / "gallery"
    embeddings_dir = base_dir / "embeddings"
    metadata_file = base_dir / "metadata.json"

    if not metadata_file.exists():
        print("❌ 元数据文件不存在")
        return

    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    items = metadata.get("items", [])

    print("\n" + "="*60)
    print("🔍 验证嵌入向量")
    print("="*60)

    total = len(items)
    has_embedding = 0
    missing_embedding = []

    for item in items:
        ref_id = item["id"]
        embedding_path = embeddings_dir / f"{ref_id}.npy"

        if embedding_path.exists():
            # 验证向量可以被加载
            try:
                emb = np.load(embedding_path)
                print(f"✅ {ref_id}: shape={emb.shape}, norm={np.linalg.norm(emb):.4f}")
                has_embedding += 1
            except Exception as e:
                print(f"❌ {ref_id}: 无法加载 - {e}")
                missing_embedding.append(ref_id)
        else:
            print(f"⚠️  {ref_id}: 向量文件不存在")
            missing_embedding.append(ref_id)

    print("\n" + "="*60)
    print(f"总计: {total}")
    print(f"有向量: {has_embedding}")
    print(f"缺失: {len(missing_embedding)}")

    if missing_embedding:
        print(f"\n缺失向量的项目:")
        for ref_id in missing_embedding:
            print(f"  - {ref_id}")


async def test_similarity():
    """测试相似度检索"""
    from services.gallery_service import gallery_service

    print("\n" + "="*60)
    print("🔍 测试相似度检索")
    print("="*60)

    # 读取第一张图片的向量作为查询
    base_dir = Path(__file__).parent.parent / "data" / "gallery"
    embeddings_dir = base_dir / "embeddings"
    metadata_file = base_dir / "metadata.json"

    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    items = metadata.get("items", [])
    if not items:
        print("⚠️  图库为空")
        return

    # 使用第一个项目作为查询
    test_item = items[0]
    test_id = test_item["id"]
    embedding_path = embeddings_dir / f"{test_id}.npy"

    if not embedding_path.exists():
        print(f"❌ 测试项目 {test_id} 没有向量")
        return

    query_embedding = np.load(embedding_path)
    print(f"\n📍 查询图片: {test_id}")

    # 从分析中提取信息
    analysis_dict = test_item.get("analysis", {})
    style = analysis_dict.get("style", {})
    print(f"   风格: {', '.join(style.get('tags', []))}")

    # 执行检索
    results = await gallery_service.find_similar(query_embedding, top_k=5, threshold=0.0)

    print(f"\n🎯 找到 {len(results)} 个相似结果:\n")
    for i, result in enumerate(results, 1):
        item_analysis = result["item"].get("analysis", {})
        item_style = item_analysis.get("style", {})
        similarity = result["similarity"]

        print(f"{i}. {result['id']}")
        print(f"   相似度: {similarity:.2%}")
        print(f"   风格: {', '.join(item_style.get('tags', []))}")
        print()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "--verify":
            asyncio.run(verify_embeddings())
        elif sys.argv[1] == "--test":
            asyncio.run(test_similarity())
        else:
            print("用法:")
            print("  python regenerate_embeddings.py           # 重新生成所有向量")
            print("  python regenerate_embeddings.py --verify  # 验证向量完整性")
            print("  python regenerate_embeddings.py --test    # 测试相似度检索")
    else:
        asyncio.run(regenerate_embeddings())
