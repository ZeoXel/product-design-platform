"""
向量检索辅助工具
提供标准化的图像描述生成功能

注意：当前使用 text-embedding-3-small 文本模型，
相似度基于文本描述而非图像内容，因此：
1. 使用英文描述可获得更好的嵌入效果
2. 描述越详细、标准化，相似度越准确
"""
from models import ImageAnalysis


# 元素类型中英对照
ELEMENT_EN_MAP = {
    "贝壳": "shell",
    "海星": "starfish",
    "珍珠": "pearl",
    "水晶": "crystal",
    "玛瑙": "agate",
    "流苏": "tassel",
    "编织绳": "woven cord",
    "毛线球": "yarn ball",
    "玻璃珠": "glass bead",
    "珠子": "bead",
    "吊坠": "pendant",
    "天然石": "natural stone",
    "蝴蝶": "butterfly",
    "心形": "heart",
    "星星": "star",
    "月亮": "moon",
    "花朵": "flower",
    "叶子": "leaf",
    "海豚": "dolphin",
    "海马": "seahorse",
    "龙虾扣": "lobster clasp",
    "钥匙环": "keyring",
    "登山扣": "carabiner",
    "旋转扣": "swivel clasp",
    "跳环": "jump ring",
    "T针": "T-pin",
    "9针": "eye pin",
    "耳钩": "ear hook",
    "延长链": "extension chain",
}

# 颜色中英对照
COLOR_EN_MAP = {
    "白色": "white",
    "粉色": "pink",
    "蓝色": "blue",
    "绿色": "green",
    "红色": "red",
    "紫色": "purple",
    "金色": "gold",
    "银色": "silver",
    "古铜色": "bronze",
    "玫瑰金": "rose gold",
    "薄荷绿": "mint green",
    "天蓝色": "sky blue",
    "海蓝色": "ocean blue",
    "透明": "transparent",
    "渐变": "gradient",
    "彩虹": "rainbow",
    "米白": "cream",
    "奶白": "milky white",
    "珊瑚粉": "coral pink",
}

# 风格标签中英对照
STYLE_EN_MAP = {
    "海洋风": "ocean style",
    "波西米亚": "bohemian",
    "民族风": "ethnic",
    "甜美": "sweet",
    "可爱": "cute",
    "少女系": "girly",
    "简约": "minimalist",
    "复古": "vintage",
    "典雅": "elegant",
    "自然": "natural",
    "清新": "fresh",
    "梦幻": "dreamy",
    "星空": "starry",
    "童趣": "playful",
    "糖果色": "candy color",
}


def _translate(text: str, mapping: dict) -> str:
    """尝试翻译文本，如果找不到映射则返回原文"""
    return mapping.get(text, text)


def generate_search_description(analysis: ImageAnalysis) -> str:
    """
    从图像分析结果生成标准化的检索描述

    这个描述会被用于生成嵌入向量，因此需要：
    1. 包含足够的视觉特征信息
    2. 对于相似图片生成相似的描述
    3. 结构化且详细

    Args:
        analysis: 图像分析结果

    Returns:
        标准化的检索描述文本
    """
    parts = []

    # 1. 主要元素描述（最重要）
    if analysis.elements.primary:
        primary_desc = []
        for elem in analysis.elements.primary:
            elem_text = elem.type
            if elem.color:
                elem_text = f"{elem.color}{elem_text}"
            primary_desc.append(elem_text)
        parts.append(f"主要元素: {', '.join(primary_desc)}")

    # 2. 辅助元素描述
    if analysis.elements.secondary:
        secondary_desc = []
        for elem in analysis.elements.secondary:
            if elem.count and elem.count > 0:
                secondary_desc.append(f"{elem.count}个{elem.type}")
            else:
                secondary_desc.append(elem.type)
        parts.append(f"装饰: {', '.join(secondary_desc)}")

    # 3. 五金件描述
    if analysis.elements.hardware:
        hardware_desc = []
        for elem in analysis.elements.hardware:
            if elem.material:
                hardware_desc.append(f"{elem.material}{elem.type}")
            else:
                hardware_desc.append(elem.type)
        parts.append(f"五金: {', '.join(hardware_desc)}")

    # 4. 风格和情绪
    if analysis.style.tags:
        parts.append(f"风格: {', '.join(analysis.style.tags[:5])}")  # 最多5个标签

    if analysis.style.mood:
        parts.append(f"情绪: {analysis.style.mood}")

    # 5. 物理规格（可选，但有助于区分尺寸）
    if analysis.physicalSpecs:
        specs_parts = []
        if analysis.physicalSpecs.lengthCm > 0:
            # 分类长度：短（<10cm）、中（10-20cm）、长（>20cm）
            length_cat = "短款" if analysis.physicalSpecs.lengthCm < 10 else "中款" if analysis.physicalSpecs.lengthCm < 20 else "长款"
            specs_parts.append(length_cat)

        if analysis.physicalSpecs.weightG > 0:
            # 分类重量：轻（<10g）、中（10-30g）、重（>30g）
            weight_cat = "轻量" if analysis.physicalSpecs.weightG < 10 else "中等" if analysis.physicalSpecs.weightG < 30 else "厚重"
            specs_parts.append(weight_cat)

        if specs_parts:
            parts.append(f"特征: {', '.join(specs_parts)}")

    # 组合所有部分
    description = " | ".join(parts)

    return description


def generate_english_search_description(analysis: ImageAnalysis) -> str:
    """
    生成英文检索描述 - 更适合 text-embedding-3-small 模型

    使用英文描述可以获得更准确的嵌入向量匹配

    Args:
        analysis: 图像分析结果

    Returns:
        英文检索描述
    """
    parts = []

    # 1. 产品类型
    parts.append("keychain charm accessory pendant")

    # 2. 主要元素 (英文)
    if analysis.elements.primary:
        primary_desc = []
        for elem in analysis.elements.primary:
            elem_type = _translate(elem.type, ELEMENT_EN_MAP)
            if elem.color:
                color = _translate(elem.color, COLOR_EN_MAP)
                elem_text = f"{color} {elem_type}"
            else:
                elem_text = elem_type
            primary_desc.append(elem_text)
        parts.append(f"main elements: {', '.join(primary_desc)}")

    # 3. 辅助元素
    if analysis.elements.secondary:
        secondary_desc = []
        for elem in analysis.elements.secondary:
            elem_type = _translate(elem.type, ELEMENT_EN_MAP)
            if elem.count and elem.count > 0:
                secondary_desc.append(f"{elem.count} {elem_type}s")
            else:
                secondary_desc.append(elem_type)
        parts.append(f"decorations: {', '.join(secondary_desc)}")

    # 4. 五金件
    if analysis.elements.hardware:
        hardware_desc = []
        for elem in analysis.elements.hardware:
            elem_type = _translate(elem.type, ELEMENT_EN_MAP)
            if elem.material:
                material = _translate(elem.material, COLOR_EN_MAP)
                hardware_desc.append(f"{material} {elem_type}")
            else:
                hardware_desc.append(elem_type)
        parts.append(f"hardware: {', '.join(hardware_desc)}")

    # 5. 风格标签
    if analysis.style.tags:
        style_tags = [_translate(tag, STYLE_EN_MAP) for tag in analysis.style.tags[:5]]
        parts.append(f"style: {', '.join(style_tags)}")

    # 6. 情绪氛围
    if analysis.style.mood:
        mood = _translate(analysis.style.mood, STYLE_EN_MAP)
        parts.append(f"mood: {mood}")

    return "; ".join(parts)


def generate_multimodal_search_description(analysis: ImageAnalysis) -> str:
    """
    生成适合多模态嵌入的增强描述

    优先使用英文描述以获得更好的嵌入效果

    Args:
        analysis: 图像分析结果

    Returns:
        英文增强检索描述
    """
    # 使用英文描述（对 text-embedding-3-small 效果更好）
    return generate_english_search_description(analysis)


# 测试示例
if __name__ == "__main__":
    from models import ElementsGroup, StyleInfo, PhysicalSpecs, ElementItem

    # 创建测试用例
    test_analysis = ImageAnalysis(
        elements=ElementsGroup(
            primary=[
                ElementItem(type="贝壳", color="白色"),
                ElementItem(type="珍珠", color="粉色")
            ],
            secondary=[
                ElementItem(type="珠子", count=5),
                ElementItem(type="流苏")
            ],
            hardware=[
                ElementItem(type="耳钩", material="银色")
            ]
        ),
        style=StyleInfo(
            tags=["波西米亚", "自然", "夏日"],
            mood="清新自然"
        ),
        physicalSpecs=PhysicalSpecs(
            lengthCm=12.0,
            weightG=8.5
        ),
        suggestions=["设计简约优雅", "适合日常佩戴"]
    )

    # 测试描述生成
    print("=" * 60)
    print("标准检索描述:")
    print(generate_search_description(test_analysis))
    print("\n" + "=" * 60)
    print("增强检索描述:")
    print(generate_multimodal_search_description(test_analysis))
    print("=" * 60)
