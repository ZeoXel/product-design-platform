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
from models import ChatMessage, AnalysisResult

settings = get_settings()

# 最大图片大小 (4MB，留一些余量)
MAX_IMAGE_SIZE = 4 * 1024 * 1024


def compress_image_base64(image_base64: str, max_size: int = MAX_IMAGE_SIZE) -> str:
    """
    压缩图片到指定大小以下

    Args:
        image_base64: 原始图片的 base64 编码
        max_size: 最大字节数

    Returns:
        压缩后的 base64 编码
    """
    # 解码 base64
    image_data = base64.b64decode(image_base64)

    # 如果已经小于限制，直接返回
    if len(image_data) <= max_size:
        return image_base64

    print(f"[Image Compress] Original size: {len(image_data)} bytes, compressing...")

    # 打开图片
    img = Image.open(io.BytesIO(image_data))

    # 转换为 RGB（如果是 RGBA 或其他模式）
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')

    # 逐步降低质量和尺寸直到满足大小要求
    quality = 85
    max_dimension = 2048

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
            print(f"[Image Compress] Final size: {len(compressed_data)} bytes")
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
            print(f"[Image Compress] Minimum reached, size: {len(compressed_data)} bytes")
            return result


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
    ) -> AnalysisResult:
        """
        使用Claude Vision分析图像 - 使用 Anthropic 官方格式

        Args:
            image_base64: 图像base64数据
            prompt: 分析提示词

        Returns:
            分析结果
        """
        # 压缩图片以确保不超过大小限制
        compressed_image = compress_image_base64(image_base64)

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

请以JSON格式返回分析结果，包含以下字段:
{{
    "elements": [
        {{"type": "元素类型", "color": "颜色", "position": "位置描述"}}
    ],
    "style": {{
        "overall": "整体风格",
        "color_scheme": "配色方案",
        "mood": "氛围/情绪"
    }},
    "description": "整体描述",
    "suggestions": ["建议1", "建议2"]
}}
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

            # 尝试解析JSON
            try:
                # 提取JSON部分
                json_start = content.find("{")
                json_end = content.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    result = json.loads(content[json_start:json_end])
                    return AnalysisResult(**result)
            except json.JSONDecodeError:
                pass

            # 如果解析失败，返回基础结果
            return AnalysisResult(
                description=content,
                elements=[],
                style={},
                suggestions=[],
            )

    async def generate_design_prompt(
        self,
        user_instruction: str,
        reference_analysis: Optional[AnalysisResult] = None,
    ) -> str:
        """
        根据用户指令生成设计提示词

        Args:
            user_instruction: 用户设计指令
            reference_analysis: 参考图分析结果

        Returns:
            优化后的图像生成提示词
        """
        context = ""
        if reference_analysis:
            context = f"""
参考图分析:
- 整体描述: {reference_analysis.description}
- 风格: {reference_analysis.style}
- 元素: {reference_analysis.elements}
"""

        system_prompt = """你是一个专业的挂饰设计师助手。
你的任务是将用户的设计修改需求转化为高质量的图像生成提示词。

重要规则:
1. 用户的修改需求是最高优先级，必须在提示词开头明确强调
2. 保留参考图中未被要求修改的元素
3. 对于用户要求添加/修改的元素，要详细描述其视觉特征
4. 使用英文，适合AI图像生成模型
5. 在提示词中使用 "IMPORTANT:" 或 "KEY CHANGE:" 来强调修改点

输出格式:
- 先描述关键修改点（用户要求的变化）
- 再描述保留的原有元素
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
