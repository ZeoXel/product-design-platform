"""
测试不同图片格式的转换和分析
验证 PNG、JPEG 等格式都能正确处理
"""
import asyncio
import base64
import sys
from pathlib import Path
from PIL import Image
import io

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.claude_service import claude_service, compress_image_base64


def create_test_images():
    """创建不同格式的测试图片"""
    # 创建一个简单的测试图片
    img = Image.new('RGB', (800, 600), color='red')

    # 保存为不同格式
    formats = {}

    # PNG 格式
    png_buffer = io.BytesIO()
    img.save(png_buffer, format='PNG')
    formats['PNG'] = base64.b64encode(png_buffer.getvalue()).decode('utf-8')

    # JPEG 格式
    jpeg_buffer = io.BytesIO()
    img.save(jpeg_buffer, format='JPEG', quality=95)
    formats['JPEG'] = base64.b64encode(jpeg_buffer.getvalue()).decode('utf-8')

    # WebP 格式（如果支持）
    try:
        webp_buffer = io.BytesIO()
        img.save(webp_buffer, format='WEBP', quality=95)
        formats['WEBP'] = base64.b64encode(webp_buffer.getvalue()).decode('utf-8')
    except:
        print("⚠️  WebP 格式不支持，跳过")

    # RGBA PNG（带透明度）
    rgba_img = Image.new('RGBA', (800, 600), color=(255, 0, 0, 128))
    rgba_buffer = io.BytesIO()
    rgba_img.save(rgba_buffer, format='PNG')
    formats['PNG_RGBA'] = base64.b64encode(rgba_buffer.getvalue()).decode('utf-8')

    return formats


def test_compression():
    """测试压缩函数"""
    print("\n" + "="*60)
    print("测试图片格式转换")
    print("="*60)

    formats = create_test_images()

    for format_name, image_base64 in formats.items():
        original_size = len(base64.b64decode(image_base64))
        print(f"\n📸 测试 {format_name} 格式")
        print(f"   原始大小: {original_size} bytes")

        try:
            compressed = compress_image_base64(image_base64)
            compressed_size = len(base64.b64decode(compressed))

            # 验证是否是 JPEG
            compressed_data = base64.b64decode(compressed)
            img = Image.open(io.BytesIO(compressed_data))

            print(f"   ✅ 转换成功")
            print(f"   压缩后格式: {img.format}")
            print(f"   压缩后大小: {compressed_size} bytes")
            print(f"   压缩率: {compressed_size/original_size*100:.1f}%")

            if img.format != 'JPEG':
                print(f"   ⚠️  警告: 期望 JPEG，实际是 {img.format}")

        except Exception as e:
            print(f"   ❌ 转换失败: {e}")


async def test_analyze_formats():
    """测试分析不同格式的图片"""
    print("\n" + "="*60)
    print("测试图片分析（不同格式）")
    print("="*60)

    formats = create_test_images()

    for format_name, image_base64 in formats.items():
        print(f"\n📸 分析 {format_name} 格式图片")

        try:
            result = await claude_service.analyze_image(
                image_base64=image_base64,
                prompt="简单描述这个图片"
            )

            print(f"   ✅ 分析成功")
            print(f"   风格: {result.style.tags[:3]}")

        except Exception as e:
            print(f"   ❌ 分析失败: {e}")


async def main():
    print("\n" + "="*60)
    print("图片格式处理测试")
    print("="*60)

    # 测试1: 压缩转换
    test_compression()

    # 测试2: 分析
    await test_analyze_formats()

    print("\n" + "="*60)
    print("测试完成")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
