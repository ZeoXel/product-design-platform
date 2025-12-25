# Nano Banana Pro 配饰垂类优化指南

> 版本：v1.0
> 日期：2024-12-25
> 目标：充分发挥 Nano Banana Pro 在配饰设计生成中的能力

---

## 一、Nano Banana Pro 能力解析

### 1.1 技术基础

Nano Banana 基于 **Google Gemini 2.5 Flash Image** 模型优化，专为图像生成场景定制：

| 特性 | 能力 | 应用价值 |
|------|------|---------|
| **多图输入** | 最多 8 张参考图 | 可同时参考主体+风格+元素 |
| **分辨率** | 1K / 2K / 4K | 产品摄影级别输出 |
| **宽高比** | 10 种比例 | 适配不同展示场景 |
| **上下文窗口** | 64K input / 32K output | 可接受极详细的提示词 |
| **图生图** | 原生支持 | 保留参考图核心特征 |

### 1.2 当前实现差距

```python
# 当前实现（nano_banana_service.py）
final_prompt = f"EDIT the reference image with the following changes: {prompt}"
```

**问题**：
- ❌ 缺乏垂类专业约束
- ❌ 未利用多图输入能力
- ❌ prompt 结构单一，无分层控制
- ❌ 无负面提示词过滤

---

## 二、垂类优化核心策略

### 2.1 Prompt 工程分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: IDENTITY (产品身份锁定)                                 │
│ "Product photography of a charm/keychain pendant accessory"     │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: STRUCTURE (结构约束)                                    │
│ "Central pendant with lobster clasp attachment, beaded chain"   │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: MATERIALS (材质描述)                                    │
│ "Natural shell focal, glass beads, gold-plated hardware"        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: STYLE (风格定义)                                        │
│ "Ocean-themed, summer aesthetic, coastal color palette"         │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: MODIFICATION (用户修改)                                 │
│ "KEY CHANGE: Replace dolphin with sea turtle"                   │
├─────────────────────────────────────────────────────────────────┤
│ Layer 6: TECHNICAL (技术参数)                                    │
│ "Studio lighting, white background, macro product shot, 4K"     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 垂类约束注入

**核心原则**：在 prompt 最前端注入不可动摇的产品身份约束

```
PRODUCT TYPE: Charm/Keychain Pendant Accessory
CRITICAL CONSTRAINTS:
- MUST be a hanging charm or keychain
- MUST have attachment hardware (lobster clasp/keyring)
- MUST NOT be: necklace, bracelet, earring, ring

[用户的具体需求在此之后]
```

### 2.3 负面约束 (Negative Guidance)

Gemini 模型支持在 prompt 中明确排除元素：

```
AVOID:
- Jewelry worn on body (necklace around neck, bracelet on wrist)
- Cartoon/illustration style
- Human figures
- Multiple products in frame
- Blurry or low-quality rendering
```

---

## 三、产品摄影专业化模板

### 3.1 通用挂饰模板

```
[IDENTITY]
Professional product photography of a decorative charm pendant.
This is a keychain/bag charm accessory, NOT jewelry worn on body.

[STRUCTURE]
- Central focal element: {主体元素}
- Attachment: {连接方式: lobster clasp/keyring/carabiner}
- Chain/cord: {链条描述}
- Decorative beads: {珠子描述}

[MATERIALS]
Primary material: {主材质}
Secondary materials: {辅助材质}
Hardware: {五金件材质}

[STYLE]
Aesthetic: {风格关键词}
Color palette: {色彩方案}
Mood: {情绪氛围}

[TECHNICAL]
- Studio lighting with soft shadows
- Clean white/gradient background
- Macro product photography
- Sharp focus on details
- {尺寸} resolution

[AVOID]
Necklace, bracelet, earring, ring, worn jewelry, cartoon, illustration, human
```

### 3.2 图生图编辑模板

```
EDIT TASK: Modify the reference charm/keychain accessory

PRESERVE:
- Overall structure and layout
- Attachment hardware type
- Product category (hanging charm)

MODIFY:
- KEY CHANGE: {用户修改需求}

MAINTAIN:
- Professional product photography style
- Original color harmony (unless specified)
- Quality of materials appearance

CRITICAL: Keep this as a charm/keychain pendant. Do NOT transform into other jewelry types.
```

### 3.3 风格专用变体

#### 海洋风 Ocean Style
```
[STYLE INJECTION]
Aesthetic: Coastal, ocean-inspired, beach vacation
Color palette: Ocean blue (#006994), sandy beige, turquoise, pearl white
Materials suggest: Natural shells, sea glass, pearls, coral-shaped beads
Mood: Fresh, summer, relaxed
```

#### 波西米亚 Bohemian Style
```
[STYLE INJECTION]
Aesthetic: Bohemian, ethnic, free-spirited
Color palette: Earth tones, warm amber, terracotta, olive green
Materials suggest: Wooden beads, tassels, woven cord, natural stones
Mood: Artistic, wanderlust, natural
```

#### 简约风 Minimalist Style
```
[STYLE INJECTION]
Aesthetic: Minimalist, modern, clean
Color palette: Monochrome, gold accent, silver, matte black
Materials suggest: Geometric metal, single pendant, thin chain
Mood: Elegant, sophisticated, understated
```

---

## 四、多图输入策略

### 4.1 能力说明

Nano Banana 支持最多 **8 张参考图**同时输入，这是垂类约束的关键能力：

```python
payload["image"] = [
    "参考图1 - 主体参考",
    "参考图2 - 风格参考",
    "参考图3 - 元素参考",
    # ...最多8张
]
```

### 4.2 推荐用法

| 图片槽位 | 用途 | 说明 |
|---------|------|------|
| **Image 1** | 主体参考 | 用户上传的原始参考图 |
| **Image 2** | 风格锚定 | 从图库检索的相似风格产品 |
| **Image 3** | 结构示例 | 标准挂饰结构示例图 |

**示例场景**：

用户上传一张海洋风挂饰，要求"把海豚换成海龟"

```python
images = [
    user_uploaded_image,           # 用户的原图
    similar_ocean_product,         # 图库中相似的海洋风产品
    standard_charm_structure       # 标准挂饰结构参考
]
```

这样做的好处：
- Image 1：提供主体和布局参考
- Image 2：增强风格一致性
- Image 3：**锁定产品形态为挂饰**（关键约束）

### 4.3 标准结构参考图库

建议预置一组"标准挂饰结构图"：

```
/backend/data/structure_references/
├── charm_single_pendant.jpg    # 单吊坠式
├── charm_beaded_chain.jpg      # 串珠链式
├── charm_tassel.jpg            # 流苏式
├── charm_multi_layer.jpg       # 多层式
└── charm_cluster.jpg           # 簇状式
```

在生成时根据分析结果自动选择对应的结构参考图。

---

## 五、技术实现方案

### 5.1 增强版 Prompt 生成

`claude_service.py` 修改方案：

```python
async def generate_design_prompt(
    self,
    user_instruction: str,
    reference_analysis: Optional[ImageAnalysis] = None,
    preset: Optional[PromptPreset] = None,  # 新增：预设约束
) -> str:
    """生成专业化的挂饰设计 prompt"""

    # Layer 1: 产品身份（不可动摇）
    identity = """
PRODUCT TYPE: Charm/Keychain Pendant Accessory
CRITICAL: This MUST be a hanging charm, NOT a necklace/bracelet/earring.
"""

    # Layer 2: 结构约束
    structure = ""
    if preset and preset.form_constraint:
        structure = f"""
STRUCTURE:
- Category: {preset.form_constraint.category}
- Type: {preset.form_constraint.subcategory}
- Form: {preset.form_constraint.structure}
- Attachment: {preset.form_constraint.attachment}
"""

    # Layer 3: 材质约束
    materials = ""
    if preset and preset.material_constraint:
        materials = f"""
ALLOWED MATERIALS:
- Primary: {', '.join(preset.material_constraint.allowed_primary)}
- Secondary: {', '.join(preset.material_constraint.allowed_secondary)}
- Hardware: {', '.join(preset.material_constraint.allowed_hardware)}
"""

    # Layer 4: 用户修改（高优先级）
    modification = f"""
USER REQUEST (PRIORITY):
{user_instruction}
"""

    # Layer 5: 参考分析
    reference = ""
    if reference_analysis:
        primary = ', '.join([e.type for e in reference_analysis.elements.primary])
        style = ', '.join(reference_analysis.style.tags)
        reference = f"""
REFERENCE ANALYSIS:
- Current elements: {primary}
- Style: {style}
PRESERVE elements not mentioned in user request.
"""

    # Layer 6: 技术参数
    technical = """
PHOTOGRAPHY STYLE:
- Professional product photography
- Studio lighting, soft shadows
- Clean white/gradient background
- Macro detail shot
- 4K resolution

AVOID:
necklace, bracelet, earring, ring, worn on body, cartoon, illustration, human figure
"""

    # 组合完整 prompt
    full_prompt = f"{identity}\n{structure}\n{materials}\n{modification}\n{reference}\n{technical}"

    return full_prompt.strip()
```

### 5.2 增强版图像生成

`nano_banana_service.py` 修改方案：

```python
async def generate(
    self,
    prompt: str,
    reference_images: Optional[List[str]] = None,
    style_reference: Optional[str] = None,    # 新增：风格参考图
    structure_reference: Optional[str] = None, # 新增：结构参考图
    aspect_ratio: AspectRatio = AspectRatio.RATIO_1_1,
    image_size: ImageSize = ImageSize.SIZE_2K,
) -> GenerationResult:
    """
    生成图像 - 增强版

    多图策略:
    - reference_images[0]: 用户主参考图
    - style_reference: 风格锚定图（从图库匹配）
    - structure_reference: 结构约束图（预置）
    """

    # 组装多图输入
    images = []

    if reference_images:
        images.extend(self._format_images(reference_images))

    if style_reference:
        images.append(self._format_image(style_reference))

    if structure_reference:
        images.append(self._format_image(structure_reference))

    payload = {
        "model": self.model,
        "prompt": prompt,
        "response_format": "url",
        "aspect_ratio": aspect_ratio.value,
        "image_size": image_size.value,
    }

    if images:
        payload["image"] = images[:8]  # 最多8张

    # ... 其余不变
```

### 5.3 Agent 流程整合

`design_agent.py` 修改方案：

```python
async def generate_design(
    self,
    instruction: str,
    reference_image: Optional[str] = None,
    ...
) -> DesignResponse:

    # 1. 分析参考图（如有）
    analysis = None
    if reference_image:
        analysis = await self.analyze_reference(reference_image)

    # 2. 获取预设约束
    preset = None
    if analysis and analysis.similarItems:
        # 从最相似产品获取预设
        preset = await self._get_preset_for_item(analysis.similarItems[0].id)
    else:
        # 使用默认挂饰预设
        preset = self._get_default_preset("挂饰")

    # 3. 选择结构参考图
    structure_ref = self._select_structure_reference(analysis)

    # 4. 选择风格参考图
    style_ref = None
    if analysis and analysis.similarItems:
        style_ref = analysis.similarItems[0].imageUrl

    # 5. 生成专业化 prompt
    design_prompt = await self.claude.generate_design_prompt(
        user_instruction=instruction,
        reference_analysis=analysis,
        preset=preset,
    )

    # 6. 调用 Nano Banana（多图输入）
    generation_result = await self.nano_banana.generate(
        prompt=design_prompt,
        reference_images=[reference_image] if reference_image else None,
        style_reference=style_ref,
        structure_reference=structure_ref,
        aspect_ratio=aspect_ratio,
        image_size=image_size,
    )

    # ... 其余不变
```

---

## 六、优化效果预期

### 6.1 改进对比

| 维度 | 当前效果 | 优化后效果 |
|------|---------|-----------|
| **垂类准确率** | ~60% | >90% |
| **形态保持** | 有时发散为其他饰品 | 锁定为挂饰形态 |
| **风格一致性** | 随机 | 基于图库锚定 |
| **修改精确度** | 有时遗漏或过度修改 | 精确执行用户指令 |

### 6.2 示例效果

**输入**：海洋风钥匙扣图片 + "把海豚换成海龟"

**当前输出**（不可控）：
- 可能生成项链
- 可能完全改变风格
- 可能丢失原有元素

**优化后输出**（可控）：
- ✅ 保持钥匙扣形态
- ✅ 保持海洋风格
- ✅ 海豚替换为海龟
- ✅ 其他元素保留

---

## 七、实施优先级

### P0：Prompt 模板升级（1-2天）

1. 修改 `claude_service.py` 的 `generate_design_prompt()` 方法
2. 加入分层 prompt 结构
3. 注入垂类约束和负面提示词

### P1：多图输入能力（2-3天）

1. 修改 `nano_banana_service.py` 支持多图
2. 预置标准结构参考图库
3. 整合图库匹配的风格参考

### P2：预设系统完善（3-5天）

1. 为图库产品生成预设
2. 实现预设提取和融合逻辑
3. 默认预设配置

---

## 八、附录

### A. 推荐摄影参数关键词

```
Camera: Canon EOS 90D, Nikon D850
Lens: Macro 100mm f/2.8
Lighting: 3-point studio lighting, softbox
Aperture: f/8-f/11 for product depth
Background: Pure white (#FFFFFF), gradient gray
Post-processing: Color correction, shadow enhancement
```

### B. 颜色表达规范

使用精确的颜色描述或 HEX 值：

```
✅ "Ocean blue (#006994)" / "Turquoise (#40E0D0)"
✅ "Warm amber tone" / "Sandy beige"
❌ "Blue color" / "Light color"
```

### C. 材质描述词库

| 材质类型 | 推荐描述 |
|---------|---------|
| 贝壳 | Natural shell, mother of pearl, abalone |
| 水晶 | Crystal clear, faceted crystal, rose quartz |
| 金属 | Gold-plated, silver-toned, antique brass |
| 珠子 | Glass beads, seed beads, pearl beads |
| 流苏 | Silk tassel, cotton fringe, suede tassel |

### D. 结构参考图规格

建议预置的标准结构图：

| 文件名 | 描述 | 用途 |
|-------|------|------|
| `single_pendant.jpg` | 单一吊坠 + 龙虾扣 | 简约款参考 |
| `beaded_chain.jpg` | 串珠链条 + 吊坠 | 复杂款参考 |
| `tassel_style.jpg` | 流苏 + 装饰珠 | 波西米亚风参考 |
| `cluster_charm.jpg` | 簇状多元素 | 丰富款参考 |

---

## 九、总结

Nano Banana Pro 的核心优势：

1. **多图输入** - 可同时传入参考图 + 风格图 + 结构约束图
2. **大上下文窗口** - 可接受详细分层 prompt
3. **高分辨率输出** - 4K 产品摄影级别

**优化核心思路**：

```
通过 Prompt 分层架构 + 多图输入策略 + 预设约束系统
实现"产品形态锁定"的垂类约束目标
```

不需要更换模型或额外训练，仅通过工程化手段即可显著提升垂类生成效果。
