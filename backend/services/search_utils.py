"""
向量检索辅助工具
提供标准化的图像描述生成功能
"""
from models import ImageAnalysis


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


def generate_multimodal_search_description(analysis: ImageAnalysis) -> str:
    """
    生成适合多模态嵌入的增强描述

    包含更详细的视觉特征，适合用于图像+文本混合嵌入

    Args:
        analysis: 图像分析结果

    Returns:
        增强的检索描述
    """
    # 使用基础描述
    base_desc = generate_search_description(analysis)

    # 添加额外的视觉提示
    visual_hints = []

    # 从元素提取颜色信息
    colors = set()
    for elem in analysis.elements.primary:
        if elem.color:
            colors.add(elem.color)

    if colors:
        visual_hints.append(f"颜色: {', '.join(sorted(colors))}")

    # 从建议中提取设计特点
    if analysis.suggestions:
        # 提取与设计相关的关键词
        design_keywords = []
        for suggestion in analysis.suggestions[:2]:  # 只取前2条
            # 简化建议为关键特征
            if "简约" in suggestion or "简洁" in suggestion:
                design_keywords.append("简约设计")
            elif "复杂" in suggestion or "丰富" in suggestion:
                design_keywords.append("复杂设计")
            elif "对称" in suggestion:
                design_keywords.append("对称布局")
            elif "不对称" in suggestion or "非对称" in suggestion:
                design_keywords.append("非对称布局")

        if design_keywords:
            visual_hints.append(f"设计: {', '.join(design_keywords)}")

    # 组合基础描述和视觉提示
    if visual_hints:
        return f"{base_desc} | {' | '.join(visual_hints)}"
    else:
        return base_desc


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
