"""
检查图库中所有图片的分析状态
识别分析失败或不完整的图片，并提供重新分析选项
"""
import json
import asyncio
import base64
import sys
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.claude_service import claude_service


async def check_gallery_analysis():
    """检查图库分析状态"""
    # 加载元数据
    metadata_file = Path(__file__).parent.parent / "data" / "gallery" / "metadata.json"

    if not metadata_file.exists():
        print("❌ 元数据文件不存在")
        return

    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    items = metadata.get("items", [])
    total = len(items)

    print(f"\n📊 图库总计: {total} 张图片")
    print("="*60)

    failed_items = []
    incomplete_items = []
    success_items = []

    for idx, item in enumerate(items, 1):
        item_id = item.get("id", "unknown")
        filename = item.get("filename", "unknown")
        analysis = item.get("analysis", {})

        # 检查分析是否存在
        if not analysis:
            print(f"❌ [{idx}/{total}] {filename} - 缺少分析数据")
            failed_items.append(item)
            continue

        # 检查关键字段
        elements = analysis.get("elements", {})
        style = analysis.get("style", {})
        primary = elements.get("primary", [])
        tags = style.get("tags", [])
        mood = style.get("mood", "")

        # 判断是否完整
        is_complete = (
            len(primary) > 0 and
            len(tags) > 0 and
            mood != "" and
            mood != "未知"
        )

        if is_complete:
            print(f"✅ [{idx}/{total}] {filename} - 分析完整")
            success_items.append(item)
        else:
            print(f"⚠️  [{idx}/{total}] {filename} - 分析不完整")
            print(f"   主要元素: {len(primary)}, 风格标签: {len(tags)}, 氛围: {mood}")
            incomplete_items.append(item)

    # 统计
    print("\n" + "="*60)
    print("📈 统计结果")
    print("="*60)
    print(f"总计: {total} 张")
    print(f"✅ 完整: {len(success_items)} 张 ({len(success_items)/total*100:.1f}%)")
    print(f"⚠️  不完整: {len(incomplete_items)} 张 ({len(incomplete_items)/total*100:.1f}%)")
    print(f"❌ 失败: {len(failed_items)} 张 ({len(failed_items)/total*100:.1f}%)")

    return {
        "total": total,
        "success": success_items,
        "incomplete": incomplete_items,
        "failed": failed_items
    }


async def reanalyze_failed_items(failed_items, incomplete_items):
    """重新分析失败的图片"""
    items_to_fix = failed_items + incomplete_items

    if not items_to_fix:
        print("\n✅ 没有需要重新分析的图片")
        return

    print(f"\n🔧 准备重新分析 {len(items_to_fix)} 张图片")

    response = input(f"\n是否继续重新分析？(y/n): ")
    if response.lower() != 'y':
        print("❌ 已取消")
        return

    # 图片目录
    images_dir = Path(__file__).parent.parent / "data" / "gallery" / "images"
    metadata_file = Path(__file__).parent.parent / "data" / "gallery" / "metadata.json"

    # 加载元数据
    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    success_count = 0
    fail_count = 0

    for idx, item in enumerate(items_to_fix, 1):
        item_id = item.get("id")
        filename = item.get("filename")
        image_path = images_dir / filename

        print(f"\n[{idx}/{len(items_to_fix)}] 正在分析: {filename}")

        if not image_path.exists():
            print(f"❌ 图片文件不存在: {image_path}")
            fail_count += 1
            continue

        try:
            # 读取图片
            with open(image_path, 'rb') as f:
                image_data = f.read()

            image_base64 = base64.b64encode(image_data).decode('utf-8')

            # 分析图片
            result = await claude_service.analyze_image(
                image_base64=image_base64,
                prompt="详细分析这个挂饰/配饰设计"
            )

            # 更新元数据
            for meta_item in metadata["items"]:
                if meta_item["id"] == item_id:
                    meta_item["analysis"] = result.model_dump()
                    break

            print(f"✅ 分析成功: {[e.type for e in result.elements.primary]}, {result.style.tags}")
            success_count += 1

        except Exception as e:
            print(f"❌ 分析失败: {e}")
            fail_count += 1
            continue

    # 保存更新后的元数据
    if success_count > 0:
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 元数据已更新")

    # 总结
    print("\n" + "="*60)
    print("重新分析总结")
    print("="*60)
    print(f"成功: {success_count} 张")
    print(f"失败: {fail_count} 张")


async def main():
    print("\n" + "="*60)
    print("图库分析状态检查")
    print("="*60)

    # 检查分析状态
    result = await check_gallery_analysis()

    if result["failed"] or result["incomplete"]:
        # 重新分析失败的图片
        await reanalyze_failed_items(result["failed"], result["incomplete"])
    else:
        print("\n🎉 所有图片分析状态正常！")


if __name__ == "__main__":
    asyncio.run(main())
