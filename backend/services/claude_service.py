"""
Claude AI 服务
使用 Anthropic 官方 API 格式
"""
import httpx
import json
import base64
import io
from typing import List, Optional
from PIL import Image
from config import get_settings
from models import ChatMessage, AnalysisResult, ImageAnalysis, ElementsGroup, StyleInfo, PhysicalSpecs

settings = get_settings()

# 最大图片大小 (4MB，留一些余量)
MAX_IMAGE_SIZE = 4 * 1024 * 1024


def compress_image_base64(image_base64: str, max_size: int = MAX_IMAGE_SIZE) -> str:
    """
    压缩图片到指定大小以下，并统一转换为 JPEG 格式

    Args:
        image_base64: 原始图片的 base64 编码
        max_size: 最大字节数

    Returns:
        压缩后的 JPEG 格式 base64 编码
    """
    try:
        # 解码 base64
        image_data = base64.b64decode(image_base64)
        print(f"[Image Compress] Original size: {len(image_data)} bytes")

        # 打开图片
        img = Image.open(io.BytesIO(image_data))
        print(f"[Image Compress] Original format: {img.format}, mode: {img.mode}")

        # 转换为 RGB（如果是 RGBA 或其他模式）
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        elif img.mode not in ('RGB', 'L'):
            # 其他模式也转换为 RGB
            img = img.convert('RGB')

        # 如果已经小于限制且是 JPEG，可以快速转换
        # 否则需要压缩处理

    except Exception as e:
        print(f"[Image Compress Error] Failed to decode/open image: {e}")
        # 如果解码或打开失败，尝试返回原始数据
        # 如果原始数据太大，可能会导致 API 调用失败，但至少不会崩溃
        return image_base64

    # 统一转换为 JPEG 格式，并根据需要压缩
    # 首先尝试高质量转换
    quality = 95
    max_dimension = 2048

    try:
        # 第一次尝试：高质量 JPEG 转换
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        compressed_data = buffer.getvalue()

        print(f"[Image Compress] Initial JPEG conversion: {len(compressed_data)} bytes (quality: {quality})")

        # 如果已经满足大小要求，直接返回
        if len(compressed_data) <= max_size:
            result = base64.b64encode(compressed_data).decode('utf-8')
            print(f"[Image Compress] ✓ No compression needed, final size: {len(compressed_data)} bytes")
            return result

        # 需要进一步压缩
        print(f"[Image Compress] Image too large ({len(compressed_data)} > {max_size}), compressing...")
        quality = 85

        while True:
            # 调整尺寸
            if max(img.size) > max_dimension:
                ratio = max_dimension / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
            else:
                resized_img = img

            # 压缩为 JPEG
            buffer = io.BytesIO()
            resized_img.save(buffer, format='JPEG', quality=quality, optimize=True)
            compressed_data = buffer.getvalue()

            print(f"[Image Compress] Quality: {quality}, Dimension: {max_dimension}, Size: {len(compressed_data)} bytes")

            if len(compressed_data) <= max_size:
                result = base64.b64encode(compressed_data).decode('utf-8')
                print(f"[Image Compress] ✓ Compression successful, final size: {len(compressed_data)} bytes")
                return result

            # 降低质量或尺寸
            if quality > 30:
                quality -= 15
            elif max_dimension > 512:
                max_dimension = int(max_dimension * 0.7)
                quality = 85
            else:
                # 已经是最小了，强制返回
                result = base64.b64encode(compressed_data).decode('utf-8')
                print(f"[Image Compress] ⚠ Minimum reached, size: {len(compressed_data)} bytes")
                return result

    except Exception as e:
        print(f"[Image Compress Error] Failed during compression: {e}")
        # 压缩失败，返回原始数据
        return image_base64


class ClaudeService:
    """Claude AI 服务类 - 使用 Anthropic 官方格式"""

    def __init__(self):
        self.base_url = settings.OPENAI_API_BASE
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.CLAUDE_MODEL

    def _get_headers(self) -> dict:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }

    async def chat(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> str:
        """
        与Claude进行对话 - 使用 Anthropic Messages API

        Args:
            messages: 对话历史
            system_prompt: 系统提示词
            max_tokens: 最大输出token数

        Returns:
            AI回复内容
        """
        # 构建消息列表 (Anthropic 格式)
        api_messages = []

        for msg in messages:
            api_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Anthropic Messages API 格式
        payload = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": api_messages,
        }

        # system 是顶级参数，不是消息
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url.replace('/v1', '')}/v1/messages",
                headers=self._get_headers(),
                json=payload,
            )
            if response.status_code != 200:
                print(f"[Claude Chat Error] Status: {response.status_code}")
                print(f"[Claude Chat Error] Response: {response.text}")
            response.raise_for_status()
            data = response.json()

            # Anthropic 响应格式
            content = data.get("content", [])
            if content and len(content) > 0:
                return content[0].get("text", "")
            return ""

    async def analyze_image(
        self,
        image_base64: str,
        prompt: str = "分析这个挂饰设计的元素、风格和结构",
    ) -> ImageAnalysis:
        """
        使用Claude Vision分析图像 - 使用 Anthropic 官方格式

        Args:
            image_base64: 图像base64数据
            prompt: 分析提示词

        Returns:
            分析结果
        """
        try:
            # 压缩图片以确保不超过大小限制
            print(f"[Claude Vision] Starting image analysis, original size: {len(image_base64)} chars")
            compressed_image = compress_image_base64(image_base64)
            print(f"[Claude Vision] Image compressed, size: {len(compressed_image)} chars")
        except Exception as e:
            print(f"[Claude Vision Error] Image compression failed: {e}")
            raise ValueError(f"图片压缩失败: {str(e)}")

        # Anthropic 官方图片格式
        payload = {
            "model": self.model,
            "max_tokens": 2048,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": compressed_image
                            }
                        },
                        {
                            "type": "text",
                            "text": f"""{prompt}

请以精确的JSON格式返回分析结果，严格遵循以下结构：

{{
  "elements": {{
    "primary": [
      {{"type": "主要元素类型", "color": "颜色"}}
    ],
    "secondary": [
      {{"type": "辅助元素类型", "count": 数量}}
    ],
    "hardware": [
      {{"type": "五金件类型", "material": "材质"}}
    ]
  }},
  "style": {{
    "tags": ["风格1", "风格2", "风格3"],
    "mood": "整体情绪"
  }},
  "physicalSpecs": {{
    "lengthCm": 长度数值,
    "weightG": 重量数值
  }},
  "suggestions": ["建议1", "建议2"]
}}

分类规则：
- primary: 视觉主体元素（贝壳、天然石、水晶等）
- secondary: 填充装饰元素（珠子、流苏、金属片等）
- hardware: 功能五金件（耳钩、链条、连接扣等）

请确保数字为数值类型，不含单位。
"""
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url.replace('/v1', '')}/v1/messages",
                headers=self._get_headers(),
                json=payload,
            )
            if response.status_code != 200:
                print(f"[Claude Vision Error] Status: {response.status_code}")
                print(f"[Claude Vision Error] Response: {response.text}")
            response.raise_for_status()
            data = response.json()
            print(f"[Claude Vision Success] Response received")

            # Anthropic 响应格式
            content_blocks = data.get("content", [])
            content = ""
            if content_blocks and len(content_blocks) > 0:
                content = content_blocks[0].get("text", "{}")

            # 尝试解析为 ImageAnalysis 格式
            try:
                # 提取JSON部分
                json_start = content.find("{")
                json_end = content.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    result_dict = json.loads(content[json_start:json_end])
                    return ImageAnalysis(**result_dict)
            except (json.JSONDecodeError, Exception) as e:
                print(f"[Parse Error] {e}")
                print(f"[Content] {content[:500]}...")

            # 如果解析失败，返回空结构
            return ImageAnalysis(
                elements=ElementsGroup(),
                style=StyleInfo(tags=[], mood="未知"),
                physicalSpecs=PhysicalSpecs(lengthCm=0, weightG=0),
                suggestions=[]
            )

    async def generate_design_prompt(
        self,
        user_instruction: str,
        reference_analysis: Optional[AnalysisResult] = None,
        similar_items: Optional[list] = None,
    ) -> str:
        """
        根据用户指令生成设计提示词

        Args:
            user_instruction: 用户设计指令
            reference_analysis: 参考图分析结果
            similar_items: 相似产品列表（用于市场参考）

        Returns:
            优化后的图像生成提示词
        """
        context = ""
        if reference_analysis:
            # 生成参考图描述
            primary_elements = ', '.join([e.type for e in reference_analysis.elements.primary])
            style_tags = ', '.join(reference_analysis.style.tags)

            context = f"""
参考图分析:
- 主要元素: {primary_elements}
- 风格: {style_tags} ({reference_analysis.style.mood})
- 物理规格: 长度{reference_analysis.physicalSpecs.lengthCm}cm, 重量{reference_analysis.physicalSpecs.weightG}g
"""

        # 添加相似产品信息（市场参考）
        if similar_items and len(similar_items) > 0:
            similar_desc = []
            for idx, item in enumerate(similar_items[:3], 1):
                item_analysis = item.get("item", {}).get("analysis", {})
                if item_analysis:
                    elements = item_analysis.get("elements", {}).get("primary", [])
                    elements_text = ', '.join([e.get("type", "") for e in elements if e.get("type")])
                    style = item_analysis.get("style", {}).get("tags", [])
                    style_text = ', '.join(style[:3]) if style else "未知"
                    similarity = item.get("similarity", 0)

                    similar_desc.append(f"  {idx}. 相似度{similarity:.0%}: {elements_text} - {style_text}风格")

            if similar_desc:
                context += f"""
市场相似产品参考（可借鉴的成功元素）:
{chr(10).join(similar_desc)}
"""

        system_prompt = """你是一个专业的挂饰设计师助手。
你的任务是将用户的设计修改需求转化为高质量的图像生成提示词。

重要规则:
1. 用户的修改需求是最高优先级，必须在提示词开头明确强调
2. 保留参考图中未被要求修改的元素
3. 对于用户要求添加/修改的元素，要详细描述其视觉特征
4. 如果提供了市场相似产品参考，可以借鉴其成功的设计元素和配色方案，但要确保创新性
5. 使用英文，适合AI图像生成模型
6. 在提示词中使用 "IMPORTANT:" 或 "KEY CHANGE:" 来强调修改点

输出格式:
- 先描述关键修改点（用户要求的变化）
- 再描述保留的原有元素和借鉴的市场成功元素
- 最后添加风格和技术参数

只返回提示词文本，不需要其他解释。"""

        messages = [
            ChatMessage(
                role="user",
                content=f"""{context}
用户修改需求: {user_instruction}

请生成强调用户修改需求的英文提示词。确保修改点在提示词中被明确突出。""",
            )
        ]

        return await self.chat(messages, system_prompt=system_prompt, max_tokens=500)


# 单例实例
claude_service = ClaudeService()
