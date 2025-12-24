"""
测试图像分析功能
验证压缩和错误处理是否正常工作
"""
import asyncio
import base64
import sys
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.claude_service import claude_service


async def test_analyze_image():
    """测试图像分析"""
    # 从图库中选择一张图片进行测试
    gallery_dir = Path(__file__).parent.parent / "data" / "gallery" / "images"
    images = list(gallery_dir.glob("*.jpg"))

    if not images:
        print("❌ 图库中没有图片")
        return

    test_image = images[0]
    print(f"📸 测试图片: {test_image.name}")

    # 读取图片并转换为base64
    with open(test_image, 'rb') as f:
        image_data = f.read()

    image_base64 = base64.b64encode(image_data).decode('utf-8')
    print(f"📊 原始图片大小: {len(image_data)} bytes ({len(image_base64)} base64 chars)")

    # 测试分析
    try:
        print("\n🔍 开始分析...")
        result = await claude_service.analyze_image(
            image_base64=image_base64,
            prompt="分析这个挂饰的元素和风格"
        )

        print("\n✅ 分析成功!")
        print(f"主要元素: {[e.type for e in result.elements.primary]}")
        print(f"风格标签: {result.style.tags}")
        print(f"整体氛围: {result.style.mood}")
        print(f"物理规格: {result.physicalSpecs.lengthCm}cm, {result.physicalSpecs.weightG}g")

        return True

    except Exception as e:
        print(f"\n❌ 分析失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_large_image():
    """测试超大图片压缩"""
    print("\n" + "="*60)
    print("测试超大图片压缩")
    print("="*60)

    # 创建一个大图片（10MB）
    from PIL import Image
    import io

    # 创建一个大尺寸图片
    img = Image.new('RGB', (4000, 4000), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=95)
    large_data = buffer.getvalue()

    large_base64 = base64.b64encode(large_data).decode('utf-8')
    print(f"📊 超大图片大小: {len(large_data)} bytes ({len(large_data) / 1024 / 1024:.2f} MB)")

    try:
        print("\n🔍 开始压缩和分析...")
        result = await claude_service.analyze_image(
            image_base64=large_base64,
            prompt="简单分析这个图片"
        )

        print("✅ 超大图片处理成功!")
        return True

    except Exception as e:
        print(f"❌ 超大图片处理失败: {e}")
        return False


async def test_invalid_image():
    """测试无效图片数据"""
    print("\n" + "="*60)
    print("测试无效图片数据处理")
    print("="*60)

    # 测试无效的base64
    invalid_base64 = "invalid_base64_data"

    try:
        print("\n🔍 测试无效数据...")
        result = await claude_service.analyze_image(
            image_base64=invalid_base64,
            prompt="分析"
        )
        print("⚠️  无效数据未被捕获（应该抛出异常）")
        return False

    except Exception as e:
        print(f"✅ 正确捕获异常: {e}")
        return True


async def main():
    print("\n" + "="*60)
    print("图像分析功能测试")
    print("="*60)

    # 测试1: 正常图片
    test1 = await test_analyze_image()

    # 测试2: 超大图片
    test2 = await test_large_image()

    # 测试3: 无效数据
    test3 = await test_invalid_image()

    # 总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60)
    print(f"正常图片分析: {'✅ 通过' if test1 else '❌ 失败'}")
    print(f"超大图片压缩: {'✅ 通过' if test2 else '❌ 失败'}")
    print(f"无效数据处理: {'✅ 通过' if test3 else '❌ 失败'}")

    all_passed = test1 and test2 and test3
    print(f"\n总体结果: {'✅ 全部通过' if all_passed else '❌ 部分失败'}")


if __name__ == "__main__":
    asyncio.run(main())
