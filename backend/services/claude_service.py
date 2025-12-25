"""
Claude AI 服务
使用 Anthropic 官方 API 格式

设计理念：
- 自然语言优先：Seedream 以自然语言训练，不需要复杂模板约束
- Agent 角色：意图识别 + 自然语言描述补全，辅助创作而非强约束
- 图生图原生：保持模型原生的图像参考能力

核心方法：
- chat(): 与 Claude 对话
- analyze_image(): 使用 Claude Vision 分析图像
- enhance_prompt(): 自然语言 Prompt 增强（核心）
"""
import httpx
import json
import base64
import io
from pathlib import Path
from typing import List, Optional, Dict, Any
from PIL import Image
from config import get_settings
from models import (
    ChatMessage, ImageAnalysis, ElementsGroup,
    StyleInfo, PhysicalSpecs
)

settings = get_settings()

# 加载模板和模式库
def load_json_file(filename: str) -> Dict[str, Any]:
    """加载 JSON 配置文件"""
    file_path = Path(__file__).parent.parent / "data" / filename
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"[Claude Service] Warning: Failed to load {filename}: {e}")
        return {}

# 预加载配置
FEW_SHOT_EXAMPLES = load_json_file("few_shot_examples.json")

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
        self.few_shot_examples = FEW_SHOT_EXAMPLES.get("examples", [])

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

    async def enhance_prompt(
        self,
        user_instruction: str,
        reference_analysis: Optional[ImageAnalysis] = None,
    ) -> str:
        """
        自然语言提示词增强

        核心理念：
        - 理解用户意图，用自然语言补全
        - 不强加模板约束，保持描述自然流畅
        - 让图像模型发挥原生能力

        Args:
            user_instruction: 用户输入的设计意图
            reference_analysis: 参考图分析结果（可选）

        Returns:
            增强后的自然语言提示词
        """
        # 构建上下文
        context = ""
        if reference_analysis:
            # 提取关键信息
            primary = [e.type for e in reference_analysis.elements.primary]
            secondary = [f"{e.count}个{e.type}" for e in reference_analysis.elements.secondary if e.count]
            style_tags = reference_analysis.style.tags if reference_analysis.style else []
            mood = reference_analysis.style.mood if reference_analysis.style else ""

            context = f"""
参考图包含：
- 主要元素：{', '.join(primary)}
- 装饰元素：{', '.join(secondary)}
- 风格特征：{', '.join(style_tags)}
- 整体氛围：{mood}
"""

        system_prompt = """你是创意设计助手。你的任务是理解用户的设计意图，并用自然流畅的描述补全它。

规则：
1. 保持用户原始意图，不要过度添加
2. 如果有参考图信息，适当融合但不要重复全部细节
3. 用英文输出，适合AI图像生成
4. 描述要自然、简洁、具体
5. 不需要添加技术参数（如分辨率、灯光），模型会自行处理

示例：
- 用户说"把贝壳换成海星" → "A charm with starfish pendant replacing the shell, keeping other decorative elements"
- 用户说"加一些蓝色珠子" → "Add blue glass beads as accent decoration"
- 用户说"设计一个海洋风钥匙扣" → "Ocean-themed keychain with shell and starfish pendants, blue and white color palette"

只输出英文描述，不需要解释。"""

        messages = [
            ChatMessage(
                role="user",
                content=f"""{context}
用户需求：{user_instruction}

请用自然的英文描述这个设计。""",
            )
        ]

        enhanced = await self.chat(messages, system_prompt=system_prompt, max_tokens=300)

        print(f"[Enhance Prompt] Input: {user_instruction}")
        print(f"[Enhance Prompt] Output: {enhanced}")

        return enhanced.strip()


# 单例实例
claude_service = ClaudeService()
