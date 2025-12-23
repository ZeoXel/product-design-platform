"""
Claude AI 服务
使用第三方代理API调用Claude模型
"""
import httpx
import json
import base64
from typing import List, Optional
from config import get_settings
from models import ChatMessage, AnalysisResult

settings = get_settings()


class ClaudeService:
    """Claude AI 服务类"""

    def __init__(self):
        self.base_url = settings.OPENAI_API_BASE
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.CLAUDE_MODEL

    def _get_headers(self) -> dict:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def chat(
        self,
        messages: List[ChatMessage],
        system_prompt: Optional[str] = None,
        max_tokens: int = 2048,
    ) -> str:
        """
        与Claude进行对话

        Args:
            messages: 对话历史
            system_prompt: 系统提示词
            max_tokens: 最大输出token数

        Returns:
            AI回复内容
        """
        # 构建消息列表
        api_messages = []

        # 添加系统消息
        if system_prompt:
            api_messages.append({"role": "system", "content": system_prompt})

        # 添加对话历史
        for msg in messages:
            api_messages.append({"role": msg.role, "content": msg.content})

        # 使用OpenAI兼容格式
        payload = {
            "model": self.model,
            "messages": api_messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._get_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            return data["choices"][0]["message"]["content"]

    async def analyze_image(
        self,
        image_base64: str,
        prompt: str = "分析这个挂饰设计的元素、风格和结构",
    ) -> AnalysisResult:
        """
        使用Claude Vision分析图像

        Args:
            image_base64: 图像base64数据
            prompt: 分析提示词

        Returns:
            分析结果
        """
        # 检测图片格式
        media_type = "image/jpeg"
        if image_base64.startswith("/9j/"):
            media_type = "image/jpeg"
        elif image_base64.startswith("iVBOR"):
            media_type = "image/png"
        elif image_base64.startswith("R0lGOD"):
            media_type = "image/gif"

        # 使用 OpenAI 兼容格式 (GPT-4V 风格)
        image_url = f"data:{media_type};base64,{image_base64}"

        payload = {
            "model": self.model,
            "max_tokens": 2048,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
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
            # 使用 OpenAI 兼容的 chat/completions 端点
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._get_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            # 解析返回内容 (OpenAI 格式)
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")

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
你的任务是将用户的设计需求转化为高质量的图像生成提示词。

提示词应该:
1. 详细描述设计的视觉元素(材质、颜色、形状)
2. 包含风格和氛围描述
3. 使用英文，适合AI图像生成模型
4. 保持专业性和创意性

只返回提示词文本，不需要其他解释。"""

        messages = [
            ChatMessage(
                role="user",
                content=f"""{context}
用户需求: {user_instruction}

请生成适合图像生成的英文提示词。""",
            )
        ]

        return await self.chat(messages, system_prompt=system_prompt, max_tokens=500)


# 单例实例
claude_service = ClaudeService()
