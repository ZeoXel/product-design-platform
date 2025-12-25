"""
Claude AI 服务
使用 Anthropic 官方 API 格式
支持分层Prompt生成和垂类约束
"""
import httpx
import json
import base64
import io
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from PIL import Image
from config import get_settings
from models import (
    ChatMessage, AnalysisResult, ImageAnalysis, ElementsGroup,
    StyleInfo, PhysicalSpecs, LayeredPrompt
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

# 预加载模板库
STYLE_PATTERNS = load_json_file("prompt_patterns.json")
STYLE_TEMPLATES = load_json_file("style_templates.json")
FEW_SHOT_EXAMPLES = load_json_file("few_shot_examples.json")
# 新增：分层Prompt配置
LAYERED_PROMPTS = load_json_file("layered_prompts.json")
PRESETS = load_json_file("presets.json")

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
        self.style_patterns = STYLE_PATTERNS.get("styles", {})
        self.templates = STYLE_TEMPLATES.get("templates", {})
        self.style_modifiers = STYLE_TEMPLATES.get("style_modifiers", {})
        self.few_shot_examples = FEW_SHOT_EXAMPLES.get("examples", [])

    def _detect_style(
        self,
        user_instruction: str,
        reference_analysis: Optional[ImageAnalysis] = None
    ) -> str:
        """
        检测设计风格

        Args:
            user_instruction: 用户指令
            reference_analysis: 参考图分析结果

        Returns:
            风格标识符
        """
        # 从参考分析中提取风格标签
        style_tags = []
        if reference_analysis and reference_analysis.style and reference_analysis.style.tags:
            style_tags = [tag.lower() for tag in reference_analysis.style.tags]

        # 组合文本用于匹配
        combined_text = user_instruction.lower() + " " + " ".join(style_tags)

        # 使用规则匹配风格
        detection_rules = STYLE_PATTERNS.get("style_detection_rules", {}).get("keywords_to_style", {})
        for pattern, style in detection_rules.items():
            if re.search(pattern, combined_text):
                print(f"[Style Detection] Matched pattern '{pattern}' -> {style}")
                return style

        # 基于标签的备用匹配
        style_mapping = {
            "海洋": "ocean_kawaii",
            "ocean": "ocean_kawaii",
            "贝壳": "ocean_shell",
            "shell": "ocean_shell",
            "波西米亚": "bohemian",
            "bohemian": "bohemian",
            "民族": "bohemian",
            "ethnic": "bohemian",
            "自然": "bohemian_natural",
            "natural": "bohemian_natural",
            "糖果": "candy_playful",
            "candy": "candy_playful",
            "童趣": "candy_playful",
            "playful": "candy_playful",
            "星空": "dreamy_star",
            "star": "dreamy_star",
            "梦幻": "dreamy_star",
            "dreamy": "dreamy_star",
            "简约": "minimalist",
            "minimalist": "minimalist",
            "复古": "vintage_elegant",
            "vintage": "vintage_elegant",
        }

        for keyword, style in style_mapping.items():
            if keyword in combined_text:
                print(f"[Style Detection] Matched keyword '{keyword}' -> {style}")
                return style

        # 默认风格
        print("[Style Detection] No match found, using default 'ocean_kawaii'")
        return "ocean_kawaii"

    def _detect_product_type(self, reference_analysis: Optional[ImageAnalysis] = None) -> str:
        """检测产品类型"""
        # 可以根据分析结果中的五金件类型推断
        if reference_analysis and reference_analysis.elements:
            hardware = reference_analysis.elements.hardware
            if hardware:
                hardware_types = [h.type.lower() for h in hardware]
                hardware_text = " ".join(hardware_types)

                if "钥匙" in hardware_text or "keyring" in hardware_text:
                    return "keychain"
                elif "登山扣" in hardware_text or "包" in hardware_text:
                    return "bag_charm"
                elif "手机" in hardware_text or "挂绳" in hardware_text:
                    return "phone_strap"
                elif "车" in hardware_text or "悬挂" in hardware_text:
                    return "car_charm"

        # 默认为钥匙扣
        return "keychain"

    def _format_elements(self, reference_analysis: Optional[ImageAnalysis]) -> Dict[str, str]:
        """格式化元素描述"""
        if not reference_analysis or not reference_analysis.elements:
            return {
                "primary": "decorative pendant",
                "secondary": "accent beads",
                "hardware": "metal clasp"
            }

        elements = reference_analysis.elements

        # 主元素
        primary_list = []
        for e in elements.primary:
            color = e.color if hasattr(e, 'color') and e.color else ""
            if color:
                primary_list.append(f"{color} {e.type}")
            else:
                primary_list.append(e.type)

        primary = " and ".join(primary_list[:2]) if primary_list else "decorative pendant"

        # 辅助元素
        secondary_list = []
        for e in elements.secondary:
            count = e.count if hasattr(e, 'count') and e.count else 1
            secondary_list.append(f"{count} {e.type}")

        secondary = ", ".join(secondary_list[:3]) if secondary_list else "accent beads"

        # 五金件
        hardware_list = []
        for h in elements.hardware:
            material = h.material if hasattr(h, 'material') and h.material else ""
            if material:
                hardware_list.append(f"{material} {h.type}")
            else:
                hardware_list.append(h.type)

        hardware = " and ".join(hardware_list[:2]) if hardware_list else "metal clasp"

        return {
            "primary": primary,
            "secondary": secondary,
            "hardware": hardware
        }

    def _build_template_prompt(
        self,
        style: str,
        product_type: str,
        elements: Dict[str, str],
        user_modifications: str = ""
    ) -> str:
        """
        使用模板构建 prompt

        Args:
            style: 风格标识
            product_type: 产品类型
            elements: 元素描述
            user_modifications: 用户修改需求

        Returns:
            完整的 prompt
        """
        # 获取模板
        template = self.templates.get(product_type, self.templates.get("generic", {}))
        base_template = template.get("base", "A {style_keyword} accessory with {primary_elements}")

        # 获取风格修饰符
        modifier = self.style_modifiers.get(style, self.style_modifiers.get("ocean_kawaii", {}))
        style_keyword = modifier.get("style_keyword", "stylish")
        quality_suffix = modifier.get("quality_suffix", "professional lighting")

        # 获取颜色方案
        style_info = self.style_patterns.get(style, {})
        color_palette = style_info.get("color_palette", ["natural colors"])
        color_desc = " ".join(color_palette[:3])

        # 获取长度
        length_defaults = STYLE_TEMPLATES.get("length_defaults", {})
        length = length_defaults.get(product_type, "15cm")

        # 填充模板
        prompt = base_template.format(
            style_keyword=style_keyword,
            primary_elements=elements["primary"],
            secondary_elements=elements["secondary"],
            hardware=elements["hardware"],
            color_palette=color_desc,
            length=length
        )

        # 添加质量后缀
        prompt += f", {quality_suffix}"

        # 添加用户修改需求（最高优先级）
        if user_modifications:
            prompt = f"KEY CHANGE: {user_modifications}. " + prompt

        # 添加质量增强后缀
        quality_suffix_global = STYLE_TEMPLATES.get("prompt_quality_suffix", "")
        if quality_suffix_global:
            prompt += f", {quality_suffix_global}"

        return prompt

    def _find_matching_example(self, style: str) -> Optional[Dict[str, Any]]:
        """查找匹配风格的示例"""
        for example in self.few_shot_examples:
            if example.get("style") == style:
                return example
        return None

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
        根据用户指令生成设计提示词（使用模板系统增强）

        Args:
            user_instruction: 用户设计指令
            reference_analysis: 参考图分析结果
            similar_items: 相似产品列表（用于市场参考）

        Returns:
            优化后的图像生成提示词
        """
        # 1. 检测风格
        style = self._detect_style(user_instruction, reference_analysis)
        print(f"[Prompt Generation] Detected style: {style}")

        # 2. 检测产品类型
        product_type = self._detect_product_type(reference_analysis)
        print(f"[Prompt Generation] Detected product type: {product_type}")

        # 3. 格式化元素
        elements = self._format_elements(reference_analysis)
        print(f"[Prompt Generation] Formatted elements: {elements}")

        # 4. 查找匹配的 few-shot 示例作为参考
        matching_example = self._find_matching_example(style)
        example_prompt = ""
        if matching_example:
            example_prompt = matching_example.get("ideal_prompt", "")
            print(f"[Prompt Generation] Found matching example: {matching_example.get('name')}")

        # 5. 构建上下文信息
        context = ""
        if reference_analysis:
            primary_elements = ', '.join([e.type for e in reference_analysis.elements.primary])
            style_tags = ', '.join(reference_analysis.style.tags) if reference_analysis.style.tags else ""

            context = f"""
参考图分析:
- 主要元素: {primary_elements}
- 风格: {style_tags} ({reference_analysis.style.mood if reference_analysis.style else '未知'})
- 检测风格类型: {style}
- 检测产品类型: {product_type}
"""

        # 6. 添加相似产品信息（市场参考）
        if similar_items and len(similar_items) > 0:
            similar_desc = []
            for idx, item in enumerate(similar_items[:3], 1):
                item_analysis = item.get("item", {}).get("analysis", {})
                if item_analysis:
                    item_elements = item_analysis.get("elements", {}).get("primary", [])
                    elements_text = ', '.join([e.get("type", "") for e in item_elements if e.get("type")])
                    item_style = item_analysis.get("style", {}).get("tags", [])
                    style_text = ', '.join(item_style[:3]) if item_style else "未知"
                    similarity = item.get("similarity", 0)

                    similar_desc.append(f"  {idx}. 相似度{similarity:.0%}: {elements_text} - {style_text}风格")

            if similar_desc:
                context += f"""
市场相似产品参考:
{chr(10).join(similar_desc)}
"""

        # 7. 添加参考示例
        if example_prompt:
            context += f"""
同风格成功案例的prompt参考:
{example_prompt}
"""

        # 8. 获取风格模式信息用于 system prompt
        style_info = self.style_patterns.get(style, {})
        typical_elements = style_info.get("typical_elements", [])
        color_palette = style_info.get("color_palette", [])
        mood = style_info.get("mood", [])

        system_prompt = f"""你是专业的配饰设计师助手，专注于挂饰/钥匙扣/包挂等品类。

## 当前风格: {style_info.get('name', style)}

**典型元素**: {', '.join(typical_elements[:5])}
**推荐配色**: {', '.join(color_palette[:4])}
**情绪氛围**: {', '.join(mood[:3])}

## 任务要求

将用户的设计需求转化为高质量的图像生成提示词（英文）。

**关键规则**:
1. 用户的修改需求是最高优先级，必须在 prompt 开头用 "KEY CHANGE:" 强调
2. 保留参考图中未被要求修改的元素
3. 确保生成结果符合配饰形态（挂饰/钥匙扣/包挂），不要发散成其他品类
4. 使用配饰行业专业术语
5. 参考成功案例的 prompt 结构和描述风格
6. 包含产品摄影的技术参数（白色背景、产品居中、专业灯光）

**输出格式**:
- 如有修改需求：KEY CHANGE: [修改内容]. [主体描述], [装饰描述], [配色], [摄影参数]
- 无修改需求：[风格关键词] [产品类型] with [主元素], [辅助元素], [五金件], [配色], [摄影参数]

只返回英文 prompt 文本，不需要其他解释。"""

        messages = [
            ChatMessage(
                role="user",
                content=f"""{context}
用户需求: {user_instruction}

请生成专业的英文图像生成提示词。""",
            )
        ]

        generated_prompt = await self.chat(messages, system_prompt=system_prompt, max_tokens=500)

        # 9. 确保 prompt 包含 negative prompt 相关的约束
        template = self.templates.get(product_type, self.templates.get("generic", {}))
        negative = template.get("negative", "")

        if negative and "negative" not in generated_prompt.lower():
            print(f"[Prompt Generation] Adding negative prompt guidance")
            # 不直接添加 negative prompt（那是给图像生成模型用的），但可以在日志中记录

        print(f"[Prompt Generation] Final prompt: {generated_prompt[:100]}...")
        return generated_prompt

    # ==================== 分层Prompt生成方法 ====================

    def _get_identity_layer(self, product_type: str = "keychain") -> str:
        """
        获取产品身份层（Layer 1）
        这是最高优先级的约束，锁定产品类型
        """
        identity_templates = LAYERED_PROMPTS.get("identity_templates", {})
        template = identity_templates.get(product_type, identity_templates.get("generic", {}))

        if isinstance(template, dict):
            identity_text = template.get("en", "")
            constraint = template.get("constraint", "")
            return f"[PRODUCT IDENTITY]\n{identity_text}\n{constraint}"
        else:
            return f"[PRODUCT IDENTITY]\n{template}"

    def _get_structure_layer(
        self,
        reference_analysis: Optional[ImageAnalysis] = None,
        product_type: str = "keychain"
    ) -> str:
        """
        获取结构层（Layer 2）
        根据分析结果或预设确定结构类型
        """
        structure_patterns = LAYERED_PROMPTS.get("structure_patterns", {})

        # 从产品类型预设获取典型结构
        product_presets = PRESETS.get("product_types", {})
        product_preset = product_presets.get(product_type, {})
        typical_structure = product_preset.get("typical_structure", "single_pendant")

        # 获取结构模板
        structure_info = structure_patterns.get(typical_structure, {})
        structure_en = structure_info.get("en", "Decorative charm structure") if isinstance(structure_info, dict) else structure_info

        # 如果有分析结果，提取五金件信息
        hardware_desc = "lobster clasp"
        if reference_analysis and reference_analysis.elements.hardware:
            hardware_types = [h.type for h in reference_analysis.elements.hardware]
            hardware_mappings = LAYERED_PROMPTS.get("hardware_mappings", {})
            english_hardware = []
            for hw in hardware_types:
                eng = hardware_mappings.get(hw, hw)
                english_hardware.append(eng)
            if english_hardware:
                hardware_desc = ", ".join(english_hardware[:2])

        structure_text = structure_en.format(hardware=hardware_desc)
        return f"[STRUCTURE]\n{structure_text}"

    def _get_materials_layer(self, reference_analysis: Optional[ImageAnalysis] = None) -> str:
        """
        获取材质层（Layer 3）
        从分析结果提取材质描述
        """
        if not reference_analysis or not reference_analysis.elements:
            return "[MATERIALS]\nDecorative materials with quality finish"

        material_mappings = LAYERED_PROMPTS.get("material_mappings", {})
        materials = []

        # 主要元素材质
        for elem in reference_analysis.elements.primary:
            elem_type = elem.type.lower()
            for key, value in material_mappings.items():
                if key in elem_type:
                    materials.append(value)
                    break
            else:
                # 如果没有匹配到，直接使用原描述
                color = elem.color if elem.color else ""
                materials.append(f"{color} {elem.type}".strip())

        # 辅助元素材质
        for elem in reference_analysis.elements.secondary[:2]:
            elem_type = elem.type.lower()
            for key, value in material_mappings.items():
                if key in elem_type:
                    materials.append(value)
                    break

        # 五金件材质
        for hw in reference_analysis.elements.hardware[:2]:
            material = hw.material if hw.material else ""
            materials.append(f"{material} {hw.type}".strip())

        materials_text = ", ".join(materials[:6]) if materials else "quality decorative materials"
        return f"[MATERIALS]\n{materials_text}"

    def _get_style_layer(
        self,
        style_key: Optional[str] = None,
        reference_analysis: Optional[ImageAnalysis] = None
    ) -> str:
        """
        获取风格层（Layer 4）
        使用指定风格或从分析检测
        """
        # 确定风格
        if not style_key:
            style_key = self._detect_style("", reference_analysis)

        # 获取风格注入信息
        style_injections = LAYERED_PROMPTS.get("style_injections", {})
        style_info = style_injections.get(style_key, {})

        if style_info:
            keywords = ", ".join(style_info.get("keywords", [])[:4])
            colors = style_info.get("color_palette", [])
            color_text = ", ".join([c.split("(")[0].strip() for c in colors[:3]])
            mood = style_info.get("mood", "")
            return f"[STYLE]\nAesthetic: {keywords}\nColor palette: {color_text}\nMood: {mood}"
        else:
            return f"[STYLE]\nAesthetic: {style_key} style"

    def _get_technical_layer(self) -> str:
        """
        获取技术层（Layer 6）
        包含摄影参数和负面词
        """
        technical_defaults = LAYERED_PROMPTS.get("technical_defaults", {})

        lighting = technical_defaults.get("lighting", "studio lighting")
        background = technical_defaults.get("background", "white background")
        quality = technical_defaults.get("quality", "4K resolution")
        composition = technical_defaults.get("composition", "centered product")

        technical = f"[TECHNICAL]\n{lighting}, {background}, {quality}, {composition}"

        # 添加负面词
        negative_prompts = LAYERED_PROMPTS.get("negative_prompts", [])
        if negative_prompts:
            negative_text = ", ".join(negative_prompts[:10])
            technical += f"\n\n[AVOID]\n{negative_text}"

        return technical

    def _assemble_layered_prompt(
        self,
        identity: str,
        structure: str,
        materials: str,
        style: str,
        modification: str,
        technical: str
    ) -> str:
        """
        组装完整的分层Prompt
        """
        # 获取分隔符
        separator = LAYERED_PROMPTS.get("prompt_format", {}).get("separator", "\n\n")

        # 按优先级组装
        # 修改需求放在最前面（最高优先级）
        parts = [
            modification,
            identity,
            structure,
            materials,
            style,
            technical,
        ]

        return separator.join([p for p in parts if p])

    def generate_layered_prompt(
        self,
        user_instruction: str,
        reference_analysis: Optional[ImageAnalysis] = None,
        product_type: str = "keychain",
        style_key: Optional[str] = None,
    ) -> LayeredPrompt:
        """
        生成分层结构的专业化Prompt

        Args:
            user_instruction: 用户设计指令
            reference_analysis: 参考图分析结果
            product_type: 产品类型
            style_key: 风格标识

        Returns:
            LayeredPrompt: 分层Prompt对象
        """
        print(f"[Layered Prompt] Generating for product_type={product_type}, style={style_key}")

        # 自动检测风格（如果未指定）
        if not style_key:
            style_key = self._detect_style(user_instruction, reference_analysis)
            print(f"[Layered Prompt] Auto-detected style: {style_key}")

        # 生成各层
        identity = self._get_identity_layer(product_type)
        structure = self._get_structure_layer(reference_analysis, product_type)
        materials = self._get_materials_layer(reference_analysis)
        style = self._get_style_layer(style_key, reference_analysis)

        # 用户修改层（最高优先级）
        modification_prefix = LAYERED_PROMPTS.get("modification_prefix", "KEY CHANGE:")
        modification = f"[USER REQUEST - PRIORITY]\n{modification_prefix} {user_instruction}"

        technical = self._get_technical_layer()

        # 提取负面词
        negative_prompts = LAYERED_PROMPTS.get("negative_prompts", [])
        negative = ", ".join(negative_prompts)

        # 组装完整prompt
        full_prompt = self._assemble_layered_prompt(
            identity=identity,
            structure=structure,
            materials=materials,
            style=style,
            modification=modification,
            technical=technical,
        )

        print(f"[Layered Prompt] Generated full prompt ({len(full_prompt)} chars)")

        return LayeredPrompt(
            identity=identity,
            structure=structure,
            materials=materials,
            style=style,
            modification=modification,
            technical=technical,
            negative=negative,
            full_prompt=full_prompt,
            product_type=product_type,
            style_key=style_key,
        )


# 单例实例
claude_service = ClaudeService()
