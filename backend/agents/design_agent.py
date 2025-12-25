"""
设计助手 Agent
整合Claude分析和图像生成能力（即梦/Nano Banana）

设计理念：
- 自然语言优先：图像模型以自然语言训练，不需要复杂模板约束
- Agent 角色：意图识别 + 自然语言补全，辅助创作
- 图生图原生：保持模型原生的图像参考能力
"""
import json
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List
from config import get_settings
from services import claude_service, nano_banana_service, seedream_service, preset_service
from models import (
    AnalysisResult,
    ImageAnalysis,
    GenerationResult,
    DesignResponse,
    DesignResponseV2,
    AspectRatio,
    ImageSize,
    ChatMessage,
    LayeredPrompt,
)

settings = get_settings()

# 专业化 System Prompt 模板
DESIGN_AGENT_SYSTEM_PROMPT = """你是专业的配饰设计师，专注于挂饰、钥匙扣、包挂等品类。

## 专业知识

**产品品类**：挂饰、钥匙扣、包挂、手机挂绳、车挂、耳机挂饰
**常见材料**：
- 主体元素：贝壳、天然石、水晶、亚克力、树脂、珍珠、玛瑙
- 辅助元素：玻璃珠、管珠、隔珠、流苏、编织绳、毛线球
- 五金配件：龙虾扣、钥匙环、登山扣、旋转扣、T针、9针、延长链、跳环

**结构类型**：
- 中心吊坠式：以1-2个主吊坠为视觉焦点，辅以串珠装饰
- 多股编织式：多条绳/链并行，各股有不同装饰
- 串珠链式：珠子依次串联，形成整体
- 流苏垂坠式：以流苏为主要装饰元素

**风格分类**：
- 海洋风/少女系：贝壳、海星、珍珠、马卡龙色系
- 波西米亚/民族风：天然石、编织绳、流苏、大地色系
- 甜美可爱/童趣：糖果色、卡通元素、彩虹配色
- 简约现代：几何形状、金属元素、单色调
- 复古典雅：琥珀、巴洛克珍珠、古金色

## 成功案例参考

{few_shot_examples}

## 工作要求

1. **分析图片时**：准确识别元素品类、材质、颜色和数量
2. **生成 prompt 时**：参考上述成功案例的描述风格和结构
3. **垂类约束**：确保生成结果符合配饰形态，不要发散成其他品类
4. **英文 prompt**：使用英文生成 prompt，适合 AI 图像生成模型
5. **专业术语**：使用配饰行业的专业术语和描述方式
"""

# 分析用的专业 Prompt
ANALYSIS_PROMPT = """请详细分析这个挂饰/配饰设计:

1. **主体元素识别**：识别所有主要吊坠和装饰元素（如贝壳、海星、水晶、天然石等）
   - 明确材质（天然/人造/金属/玻璃/亚克力等）
   - 描述颜色和渐变
   - 估计尺寸比例

2. **辅助元素识别**：识别所有辅助装饰（珠子、隔珠、流苏等）
   - 统计数量（如"玻璃珠×5"）
   - 描述排列方式

3. **五金配件识别**：识别所有金属件
   - 扣具类型（龙虾扣/登山扣/旋转扣等）
   - 连接件（跳环/T针/9针等）
   - 表面处理（银色/金色/古铜色等）

4. **整体结构分析**：
   - 结构类型（中心吊坠式/串珠链式/多股编织式等）
   - 整体长度估计

5. **风格判断**：
   - 风格标签（如海洋风、波西米亚、少女系等）
   - 配色方案
   - 情绪氛围

请以结构化的方式输出分析结果。"""


class DesignAgent:
    """设计助手Agent - 自然语言模式"""

    def __init__(self):
        self.claude = claude_service
        self.preset_service = preset_service

        # 根据配置选择图像生成服务
        self.image_gen_model = getattr(settings, 'IMAGE_GENERATION_MODEL', 'seedream')
        if self.image_gen_model == 'seedream':
            self.image_generator = seedream_service
            print("[Design Agent] 使用即梦4绘图模型")
        else:
            self.image_generator = nano_banana_service
            print("[Design Agent] 使用Nano Banana绘图模型")

        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.few_shot_examples = self._load_few_shot_examples()
        self.system_prompt = self._build_system_prompt()

        # 默认使用自然语言模式（推荐）
        # 分层Prompt模式保留用于兼容性
        self.use_natural_language = True

    def _load_few_shot_examples(self) -> List[Dict[str, Any]]:
        """加载 few-shot 示例库"""
        examples_path = Path(__file__).parent.parent / "data" / "few_shot_examples.json"
        try:
            with open(examples_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("examples", [])
        except FileNotFoundError:
            print(f"[Design Agent] Warning: few_shot_examples.json not found at {examples_path}")
            return []
        except json.JSONDecodeError as e:
            print(f"[Design Agent] Error parsing few_shot_examples.json: {e}")
            return []

    def _format_few_shot_examples(self) -> str:
        """格式化 few-shot 示例为 System Prompt 内容"""
        if not self.few_shot_examples:
            return "（暂无示例）"

        formatted = []
        for i, example in enumerate(self.few_shot_examples, 1):
            analysis = example.get("analysis", {})
            primary = ", ".join(analysis.get("primary", []))
            secondary = ", ".join(analysis.get("secondary", []))
            hardware = ", ".join(analysis.get("hardware", []))
            structure = analysis.get("structure", "")
            style_tags = ", ".join(analysis.get("style_tags", []))

            example_text = f"""【案例{i}】{example.get("name", "")}
分析结果：
- 主体元素：{primary}
- 辅助元素：{secondary}
- 五金配件：{hardware}
- 结构类型：{structure}
- 风格标签：{style_tags}

生成 Prompt：
{example.get("ideal_prompt", "")}
"""
            formatted.append(example_text)

        return "\n".join(formatted)

    def _build_system_prompt(self) -> str:
        """构建完整的 System Prompt"""
        examples_text = self._format_few_shot_examples()
        return DESIGN_AGENT_SYSTEM_PROMPT.format(few_shot_examples=examples_text)

    def _select_few_shot_examples(
        self,
        style_key: Optional[str] = None,
        product_type: Optional[str] = None,
        max_examples: int = 3
    ) -> List[Dict[str, Any]]:
        """
        动态选择相关的 few-shot 示例

        Args:
            style_key: 风格标识
            product_type: 产品类型
            max_examples: 最大示例数

        Returns:
            筛选后的示例列表
        """
        if not self.few_shot_examples:
            return []

        selected = []

        # 1. 优先选择匹配风格的示例
        if style_key:
            for example in self.few_shot_examples:
                if example.get("style") == style_key:
                    selected.append(example)
                    if len(selected) >= max_examples:
                        break

        # 2. 如果不够，补充其他示例
        if len(selected) < max_examples:
            for example in self.few_shot_examples:
                if example not in selected:
                    selected.append(example)
                    if len(selected) >= max_examples:
                        break

        print(f"[Design Agent] Selected {len(selected)} few-shot examples for style={style_key}")
        return selected

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
        include_similar: bool = True,
    ) -> ImageAnalysis:
        """
        分析参考图

        Args:
            image_base64: 图像base64数据
            session_id: 会话ID
            include_similar: 是否查找相似产品

        Returns:
            分析结果（包含相似产品）
        """
        session = self._get_session(session_id)

        # 调用Claude Vision分析（使用专业化分析Prompt）
        analysis = await self.claude.analyze_image(
            image_base64=image_base64,
            prompt=ANALYSIS_PROMPT,
        )

        # 查找相似产品（用于市场参考和设计灵感）
        if include_similar:
            try:
                from services.embedding_service import embedding_service
                from services.gallery_service import gallery_service
                from services.search_utils import generate_multimodal_search_description
                from models import SimilarItem

                # 使用标准化的详细描述生成查询向量
                text_desc = generate_multimodal_search_description(analysis)
                print(f"[Design Agent] Query description: {text_desc}")
                query_embedding = await embedding_service.generate_embedding(
                    image_base64=image_base64,
                    text=text_desc
                )

                if query_embedding is not None:
                    # 使用较低阈值（文本嵌入相似度通常偏低）
                    similar = await gallery_service.find_similar(query_embedding, top_k=3, threshold=0.15)

                    # 添加相似产品到结果
                    analysis.similarItems = [
                        SimilarItem(
                            id=item["id"],
                            imageUrl=item["imageUrl"],
                            similarity=item["similarity"]
                        )
                        for item in similar
                    ]
                    print(f"[Design Agent] Found {len(similar)} similar products")
            except Exception as e:
                print(f"[Design Agent] Failed to find similar items: {e}")

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
        style_hint: Optional[str] = None,
        product_type: Optional[str] = None,
        style_key: Optional[str] = None,
        include_similar: bool = False,
        use_natural_language: bool = True,  # 默认使用自然语言模式
    ) -> DesignResponse:
        """
        根据指令生成设计 - 自然语言模式

        核心流程：
        1. 分析参考图（可选）
        2. 用自然语言增强用户意图
        3. 图生图 + 自然语言描述

        Args:
            instruction: 用户设计指令
            reference_image: 参考图base64
            session_id: 会话ID
            aspect_ratio: 宽高比
            image_size: 图像尺寸
            style_hint: 风格提示（可选）
            product_type: 产品类型ID（可选）
            style_key: 风格ID（可选）
            include_similar: 是否查找相似产品
            use_natural_language: 使用自然语言模式（推荐）

        Returns:
            设计响应
        """
        session = self._get_session(session_id)
        analysis = None

        try:
            # 步骤1: 如果有参考图，先分析
            if reference_image:
                analysis = await self.analyze_reference(
                    reference_image,
                    session["id"],
                    include_similar=include_similar
                )
            elif session.get("analysis"):
                analysis = session["analysis"]

            # 步骤2: 生成Prompt
            if use_natural_language and self.use_natural_language:
                # 自然语言模式：理解意图 + 简洁描述
                design_prompt = await self.claude.enhance_prompt(
                    user_instruction=instruction,
                    reference_analysis=analysis,
                )
                print(f"[Design Agent] Natural language prompt: {design_prompt}")
            else:
                # 兼容旧版：分层Prompt模式
                detected_product_type = product_type
                detected_style = style_key or style_hint

                if not detected_product_type or not detected_style:
                    preset = self.preset_service.auto_detect_preset(
                        text=instruction,
                        analysis=analysis
                    )
                    detected_product_type = detected_product_type or preset.product_type.id
                    detected_style = detected_style or preset.style.id

                layered_prompt_obj = self.claude.generate_layered_prompt(
                    user_instruction=instruction,
                    reference_analysis=analysis,
                    product_type=detected_product_type,
                    style_key=detected_style,
                )
                design_prompt = layered_prompt_obj.full_prompt

            # 步骤3: 调用图像生成服务
            reference_images = None
            if reference_image:
                reference_images = [reference_image]
            elif session.get("current_image"):
                reference_images = [session["current_image"]]

            if self.image_gen_model == 'seedream':
                size_map = {
                    ImageSize.SIZE_1K: "1K",
                    ImageSize.SIZE_2K: "2K",
                    ImageSize.SIZE_4K: "4K",
                }
                generation_result = await self.image_generator.generate(
                    prompt=design_prompt,
                    reference_images=reference_images,
                    size=size_map.get(image_size, "2K"),
                )
            else:
                generation_result = await self.image_generator.generate(
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
            import traceback
            print(f"[Design Agent Error] {str(e)}")
            print(f"[Design Agent Traceback] {traceback.format_exc()}")
            return DesignResponse(
                success=False,
                message=f"生成失败: {str(e)}",
            )

    async def generate_design_v2(
        self,
        instruction: str,
        reference_image: Optional[str] = None,
        session_id: Optional[str] = None,
        aspect_ratio: AspectRatio = AspectRatio.RATIO_1_1,
        image_size: ImageSize = ImageSize.SIZE_2K,
        product_type: Optional[str] = None,
        style_key: Optional[str] = None,
        include_similar: bool = False,
        use_natural_language: bool = True,  # 默认使用自然语言模式
    ) -> DesignResponseV2:
        """
        V2 设计生成（默认自然语言模式）

        自然语言模式：简洁、自然、让模型发挥原生能力
        分层模式：兼容旧版，提供详细的Prompt层级信息
        """
        session = self._get_session(session_id)
        analysis = None
        layered_prompt_obj = None

        try:
            # 步骤1: 分析参考图
            if reference_image:
                analysis = await self.analyze_reference(
                    reference_image,
                    session["id"],
                    include_similar=include_similar
                )
            elif session.get("analysis"):
                analysis = session["analysis"]

            # 步骤2: 生成Prompt
            if use_natural_language and self.use_natural_language:
                # 自然语言模式
                design_prompt = await self.claude.enhance_prompt(
                    user_instruction=instruction,
                    reference_analysis=analysis,
                )
                print(f"[Design Agent V2] Natural language prompt: {design_prompt}")

                # 构造简化的 LayeredPrompt（兼容返回格式）
                layered_prompt_obj = LayeredPrompt(
                    identity="",
                    structure="",
                    materials="",
                    style="",
                    modification=instruction,
                    technical="",
                    negative="",
                    full_prompt=design_prompt,
                    product_type=product_type or "generic",
                    style_key=style_key or "natural",
                )
            else:
                # 分层Prompt模式
                detected_product_type = product_type
                detected_style = style_key

                if not detected_product_type or not detected_style:
                    preset = self.preset_service.auto_detect_preset(
                        text=instruction,
                        analysis=analysis
                    )
                    detected_product_type = detected_product_type or preset.product_type.id
                    detected_style = detected_style or preset.style.id

                layered_prompt_obj = self.claude.generate_layered_prompt(
                    user_instruction=instruction,
                    reference_analysis=analysis,
                    product_type=detected_product_type,
                    style_key=detected_style,
                )
                design_prompt = layered_prompt_obj.full_prompt

            # 步骤3: 图像生成
            reference_images = None
            if reference_image:
                reference_images = [reference_image]
            elif session.get("current_image"):
                reference_images = [session["current_image"]]
                print(f"[Design Agent V2] 使用 session 中的参考图")

            if self.image_gen_model == 'seedream':
                size_map = {
                    ImageSize.SIZE_1K: "1K",
                    ImageSize.SIZE_2K: "2K",
                    ImageSize.SIZE_4K: "4K",
                }
                generation_result = await self.image_generator.generate(
                    prompt=design_prompt,
                    reference_images=reference_images,
                    size=size_map.get(image_size, "2K"),
                )
            else:
                generation_result = await self.image_generator.generate(
                    prompt=design_prompt,
                    reference_images=reference_images,
                    aspect_ratio=aspect_ratio,
                    image_size=image_size,
                )

            # 步骤4: 保存和返回
            session["generated_versions"].append({
                "instruction": instruction,
                "prompt": design_prompt,
                "image_url": generation_result.image_url,
            })

            cost_estimate = self._estimate_cost(analysis)

            return DesignResponseV2(
                success=True,
                image_url=generation_result.image_url,
                analysis=analysis,
                prompt_used=design_prompt,
                layered_prompt=layered_prompt_obj,
                message="设计生成成功",
                cost_estimate=cost_estimate,
                preset_used={
                    "product_type": layered_prompt_obj.product_type,
                    "style": layered_prompt_obj.style_key,
                },
                session_id=session["id"],
            )

        except Exception as e:
            import traceback
            print(f"[Design Agent V2 Error] {str(e)}")
            print(f"[Design Agent V2 Traceback] {traceback.format_exc()}")
            return DesignResponseV2(
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

        # 使用专业化 System Prompt（包含 few-shot 示例）
        chat_system_prompt = self.system_prompt + """

## 对话指南

当用户描述设计需求时，你应该:
- 确认理解用户的意图
- 使用配饰专业术语提供建议
- 询问必要的细节（如颜色偏好、风格倾向、预算范围）
- 参考成功案例给出具体建议
- 预估可行性和效果

请用专业但友好的语气回复。"""

        # 添加上下文
        context_messages = []

        # 如果有当前设计分析，添加到上下文
        if session.get("analysis"):
            analysis = session['analysis']
            # 生成分析描述
            primary_elements = ', '.join([e.type for e in analysis.elements.primary])
            style_tags = ', '.join(analysis.style.tags)
            description = f"主要元素: {primary_elements}; 风格: {style_tags} ({analysis.style.mood})"

            context_messages.append(ChatMessage(
                role="assistant",
                content=f"[当前设计分析]\n{description}",
            ))

        # 添加用户消息
        context_messages.extend(messages)

        response = await self.claude.chat(
            messages=context_messages,
            system_prompt=chat_system_prompt,
        )

        # 保存对话历史
        session["history"].extend(messages)
        session["history"].append(ChatMessage(role="assistant", content=response))

        return response

    def _estimate_cost(self, analysis: Optional[ImageAnalysis]) -> dict:
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
        element_count = (
            len(analysis.elements.primary) +
            len(analysis.elements.secondary) +
            len(analysis.elements.hardware)
        )
        if element_count > 3:
            base_cost["material"] += (element_count - 3) * 1.5
            base_cost["labor"] += (element_count - 3) * 1.0

        # 根据风格调整
        style_tags = " ".join(analysis.style.tags).lower() if analysis.style.tags else ""
        if "luxury" in style_tags or "premium" in style_tags or "高档" in style_tags:
            base_cost["material"] *= 1.5
        elif "minimalist" in style_tags or "simple" in style_tags or "简约" in style_tags:
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
