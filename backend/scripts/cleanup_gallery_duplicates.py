#!/usr/bin/env python3
"""
清理图库重复素材
基于图片内容哈希识别并删除重复图片
"""
import hashlib
import json
import sys
from pathlib import Path
from collections import defaultdict
from PIL import Image

try:
    import imagehash
    HAS_IMAGEHASH = True
except ImportError:
    HAS_IMAGEHASH = False

# 添加 backend 目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))


def get_image_hash(image_path: Path) -> str:
    """计算图片的感知哈希（可识别相似图片）"""
    if not HAS_IMAGEHASH:
        return None

    try:
        img = Image.open(image_path)
        # 使用平均哈希，对轻微变化不敏感
        return str(imagehash.average_hash(img, hash_size=8))
    except Exception as e:
        print(f"  ⚠️  无法计算哈希: {image_path.name} - {e}")
        return None


def get_file_hash(image_path: Path) -> str:
    """计算文件MD5哈希（精确匹配）"""
    try:
        with open(image_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception as e:
        print(f"  ⚠️  无法读取文件: {image_path.name} - {e}")
        return None


def analyze_duplicates():
    """分析图库中的重复图片"""
    gallery_dir = Path(__file__).parent.parent / "data" / "gallery"
    images_dir = gallery_dir / "images"
    metadata_file = gallery_dir / "metadata.json"

    if not images_dir.exists():
        print("❌ 图库目录不存在")
        return

    # 加载元数据
    if metadata_file.exists():
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    else:
        print("⚠️  元数据文件不存在")
        metadata = {"items": []}

    print("\n" + "="*60)
    print("📊 图库重复分析")
    print("="*60)

    # 获取所有图片
    image_files = list(images_dir.glob("*.jpg"))
    print(f"\n📁 图库中共有 {len(image_files)} 张图片")
    print(f"📄 元数据中记录 {len(metadata['items'])} 条")

    # 检查精确重复（基于文件哈希）
    print("\n🔍 检查精确重复（相同文件）...")
    file_hashes = defaultdict(list)

    for img_path in image_files:
        file_hash = get_file_hash(img_path)
        if file_hash:
            file_hashes[file_hash].append(img_path)

    exact_duplicates = {h: files for h, files in file_hashes.items() if len(files) > 1}

    if exact_duplicates:
        print(f"\n⚠️  发现 {len(exact_duplicates)} 组精确重复:")
        for hash_val, files in exact_duplicates.items():
            print(f"\n  哈希: {hash_val[:16]}...")
            for f in files:
                print(f"    - {f.name}")
    else:
        print("✅ 没有发现精确重复的文件")

    # 检查相似图片（基于感知哈希）
    print("\n🔍 检查相似图片（视觉相似）...")

    try:
        image_hashes = {}
        for img_path in image_files:
            img_hash = get_image_hash(img_path)
            if img_hash:
                if img_hash not in image_hashes:
                    image_hashes[img_hash] = []
                image_hashes[img_hash].append(img_path)

        similar_groups = {h: files for h, files in image_hashes.items() if len(files) > 1}

        if similar_groups:
            print(f"\n⚠️  发现 {len(similar_groups)} 组相似图片:")
            for hash_val, files in similar_groups.items():
                print(f"\n  感知哈希: {hash_val}")
                for f in files:
                    size_kb = f.stat().st_size / 1024
                    print(f"    - {f.name} ({size_kb:.1f} KB)")
        else:
            print("✅ 没有发现视觉相似的图片")

    except ImportError:
        print("⚠️  未安装 imagehash 库，跳过相似度检查")
        print("   可运行: pip install imagehash")

    # 检查元数据重复
    print("\n🔍 检查元数据重复...")
    analysis_signatures = defaultdict(list)

    for item in metadata['items']:
        analysis = item.get('analysis', {})
        style = analysis.get('style', {})

        # 创建签名：风格标签 + 主要元素
        tags = tuple(sorted(style.get('tags', [])))
        primary = tuple(sorted([
            e.get('type', '')
            for e in analysis.get('elements', {}).get('primary', [])
        ]))

        signature = (tags, primary)
        analysis_signatures[signature].append(item['id'])

    duplicate_analyses = {
        sig: ids for sig, ids in analysis_signatures.items()
        if len(ids) > 1
    }

    if duplicate_analyses:
        print(f"\n⚠️  发现 {len(duplicate_analyses)} 组元数据重复:")
        for (tags, elements), ids in duplicate_analyses.items():
            print(f"\n  标签: {', '.join(tags)}")
            print(f"  元素: {', '.join(elements)}")
            print(f"  数量: {len(ids)} 条记录")
    else:
        print("✅ 没有发现重复的元数据")

    # 统计建议
    print("\n" + "="*60)
    print("💡 清理建议")
    print("="*60)

    total_duplicates = sum(len(files) - 1 for files in exact_duplicates.values())
    if similar_groups:
        total_duplicates += sum(len(files) - 1 for files in similar_groups.values())

    if total_duplicates > 0:
        print(f"\n可删除约 {total_duplicates} 张重复图片")
        print(f"清理后剩余约 {len(image_files) - total_duplicates} 张唯一图片")
    else:
        print("\n图库已清理，无重复图片")

    return {
        'total': len(image_files),
        'exact_duplicates': exact_duplicates,
        'similar_groups': similar_groups if 'similar_groups' in locals() else {},
        'duplicate_analyses': duplicate_analyses
    }


def cleanup_duplicates(dry_run=True):
    """清理重复图片"""
    result = analyze_duplicates()

    if not result:
        return

    exact_duplicates = result['exact_duplicates']
    similar_groups = result['similar_groups']

    if not exact_duplicates and not similar_groups:
        print("\n✅ 无需清理")
        return

    print("\n" + "="*60)
    print("🗑️  开始清理")
    print("="*60)

    gallery_dir = Path(__file__).parent.parent / "data" / "gallery"
    images_dir = gallery_dir / "images"
    embeddings_dir = gallery_dir / "embeddings"
    metadata_file = gallery_dir / "metadata.json"

    # 加载元数据
    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    files_to_delete = []
    ids_to_remove = set()

    # 收集要删除的文件（每组保留第一个）
    for files in exact_duplicates.values():
        files_to_delete.extend(files[1:])  # 保留第一个，删除其余

    for files in similar_groups.values():
        files_to_delete.extend(files[1:])  # 保留第一个，删除其余

    # 从文件名提取 ID
    for file_path in files_to_delete:
        file_id = file_path.stem
        ids_to_remove.add(file_id)

    if dry_run:
        print(f"\n⚠️  模拟运行模式（不会实际删除）")
        print(f"将删除 {len(files_to_delete)} 个文件:")
        for f in files_to_delete[:10]:  # 只显示前10个
            print(f"  - {f.name}")
        if len(files_to_delete) > 10:
            print(f"  ... 还有 {len(files_to_delete) - 10} 个")

        print(f"\n将从元数据中删除 {len(ids_to_remove)} 条记录")

        print("\n要执行实际删除，请运行:")
        print("  python cleanup_gallery_duplicates.py --execute")
    else:
        # 实际删除
        deleted_count = 0

        for file_path in files_to_delete:
            try:
                # 删除图片文件
                if file_path.exists():
                    file_path.unlink()
                    print(f"  ✓ 删除图片: {file_path.name}")

                # 删除对应的嵌入向量
                file_id = file_path.stem
                embedding_path = embeddings_dir / f"{file_id}.npy"
                if embedding_path.exists():
                    embedding_path.unlink()
                    print(f"  ✓ 删除向量: {embedding_path.name}")

                deleted_count += 1
            except Exception as e:
                print(f"  ❌ 删除失败: {file_path.name} - {e}")

        # 更新元数据
        original_count = len(metadata['items'])
        metadata['items'] = [
            item for item in metadata['items']
            if item['id'] not in ids_to_remove
        ]

        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 清理完成:")
        print(f"  删除文件: {deleted_count}")
        print(f"  删除记录: {original_count - len(metadata['items'])}")
        print(f"  剩余图片: {len(metadata['items'])}")


if __name__ == "__main__":
    import sys

    if "--execute" in sys.argv:
        cleanup_duplicates(dry_run=False)
    else:
        analyze_duplicates()
