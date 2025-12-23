"""
LangChain 设计助手 Agent
整合Claude分析和Nano Banana生成能力
"""
import uuid
from typing import Optional, Dict, Any
from services import claude_service, nano_banana_service
from models import (
    AnalysisResult,
    GenerationResult,
    DesignResponse,
    AspectRatio,
    ImageSize,
    ChatMessage,
)


class DesignAgent:
    """设计助手Agent"""

    def __init__(self):
        self.claude = claude_service
        self.nano_banana = nano_banana_service
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _get_session(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """获取或创建会话"""
        if not session_id:
            session_id = str(uuid.uuid4())

        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "id": session_id,
                "history": [],
                "current_image": None,
                "analysis": None,
                "generated_versions": [],
            }

        return self.sessions[session_id]

    async def analyze_reference(
        self,
        image_base64: str,
        session_id: Optional[str] = None,
    ) -> AnalysisResult:
        """
        分析参考图

        Args:
            image_base64: 图像base64数据
            session_id: 会话ID

        Returns:
            分析结果
        """
        session = self._get_session(session_id)

        # 调用Claude Vision分析
        analysis = await self.claude.analyze_image(
            image_base64=image_base64,
            prompt="""请详细分析这个挂饰/配饰设计:

1. 识别所有视觉元素（贝壳、水晶、珠子、金属件等）
2. 分析整体风格和色彩方案
3. 描述结构和排列方式
4. 评估设计的品质和独特性
5. 提供可能的改进建议""",
        )

        # 保存到会话
        session["current_image"] = image_base64
        session["analysis"] = analysis

        return analysis

    async def generate_design(
        self,
        instruction: str,
        reference_image: Optional[str] = None,
        session_id: Optional[str] = None,
        aspect_ratio: AspectRatio = AspectRatio.RATIO_1_1,
        image_size: ImageSize = ImageSize.SIZE_2K,
    ) -> DesignResponse:
        """
        根据指令生成设计

        Args:
            instruction: 用户设计指令
            reference_image: 参考图base64
            session_id: 会话ID
            aspect_ratio: 宽高比
            image_size: 图像尺寸

        Returns:
            设计响应
        """
        session = self._get_session(session_id)
        analysis = None

        try:
            # 步骤1: 如果有参考图，先分析
            if reference_image:
                analysis = await self.analyze_reference(reference_image, session["id"])
            elif session.get("analysis"):
                analysis = session["analysis"]

            # 步骤2: 生成优化的提示词
            design_prompt = await self.claude.generate_design_prompt(
                user_instruction=instruction,
                reference_analysis=analysis,
            )

            # 步骤3: 调用Nano Banana生成图像
            reference_images = None
            if reference_image:
                reference_images = [reference_image]
            elif session.get("current_image"):
                reference_images = [session["current_image"]]

            generation_result = await self.nano_banana.generate(
                prompt=design_prompt,
                reference_images=reference_images,
                aspect_ratio=aspect_ratio,
                image_size=image_size,
            )

            # 步骤4: 保存版本历史
            session["generated_versions"].append({
                "instruction": instruction,
                "prompt": design_prompt,
                "image_url": generation_result.image_url,
            })

            # 步骤5: 估算成本
            cost_estimate = self._estimate_cost(analysis)

            return DesignResponse(
                success=True,
                image_url=generation_result.image_url,
                analysis=analysis,
                prompt_used=design_prompt,
                message="设计生成成功",
                cost_estimate=cost_estimate,
            )

        except Exception as e:
            return DesignResponse(
                success=False,
                message=f"生成失败: {str(e)}",
            )

    async def chat(
        self,
        messages: list[ChatMessage],
        session_id: Optional[str] = None,
    ) -> str:
        """
        与设计助手对话

        Args:
            messages: 对话历史
            session_id: 会话ID

        Returns:
            AI回复
        """
        session = self._get_session(session_id)

        system_prompt = """你是一个专业的挂饰设计助手。

你的能力:
1. 分析参考图片的设计元素和风格
2. 理解用户的设计需求和修改意图
3. 提供设计建议和创意灵感
4. 帮助优化设计方案

当用户描述设计需求时，你应该:
- 确认理解用户的意图
- 提供专业的设计建议
- 询问必要的细节（如颜色偏好、风格倾向）
- 预估可行性和效果

请用专业但友好的语气回复。"""

        # 添加上下文
        context_messages = []

        # 如果有当前设计分析，添加到上下文
        if session.get("analysis"):
            context_messages.append(ChatMessage(
                role="assistant",
                content=f"[当前设计分析]\n{session['analysis'].description}",
            ))

        # 添加用户消息
        context_messages.extend(messages)

        response = await self.claude.chat(
            messages=context_messages,
            system_prompt=system_prompt,
        )

        # 保存对话历史
        session["history"].extend(messages)
        session["history"].append(ChatMessage(role="assistant", content=response))

        return response

    def _estimate_cost(self, analysis: Optional[AnalysisResult]) -> dict:
        """
        估算生产成本

        Args:
            analysis: 图像分析结果

        Returns:
            成本估算
        """
        # 基础成本
        base_cost = {
            "material": 8.0,
            "labor": 5.0,
            "total": 13.0,
        }

        if not analysis:
            return base_cost

        # 根据元素数量调整
        element_count = len(analysis.elements) if analysis.elements else 0
        if element_count > 3:
            base_cost["material"] += (element_count - 3) * 1.5
            base_cost["labor"] += (element_count - 3) * 1.0

        # 根据风格调整
        style = analysis.style.get("overall", "").lower() if analysis.style else ""
        if "luxury" in style or "premium" in style:
            base_cost["material"] *= 1.5
        elif "minimalist" in style or "simple" in style:
            base_cost["material"] *= 0.8

        base_cost["total"] = base_cost["material"] + base_cost["labor"]

        return {
            "material": round(base_cost["material"], 2),
            "labor": round(base_cost["labor"], 2),
            "total": round(base_cost["total"], 2),
            "currency": "CNY",
        }

    def get_session_versions(self, session_id: str) -> list:
        """获取会话的版本历史"""
        if session_id in self.sessions:
            return self.sessions[session_id].get("generated_versions", [])
        return []


# 单例实例
design_agent = DesignAgent()
