"""
预设管理服务
提供产品类型和风格预设的管理、匹配和检测功能
"""
import json
import re
from pathlib import Path
from typing import Optional, List, Dict, Any
from models import (
    ImageAnalysis,
    ProductTypePreset,
    StylePreset,
    DesignPreset,
    ColorPalette,
    PresetListResponse,
)


def load_json_file(filename: str) -> Dict[str, Any]:
    """加载 JSON 配置文件"""
    file_path = Path(__file__).parent.parent / "data" / filename
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"[Preset Service] Warning: Failed to load {filename}: {e}")
        return {}


# 预加载预设配置
PRESETS = load_json_file("presets.json")


class PresetService:
    """预设管理服务类"""

    def __init__(self):
        self.presets = PRESETS
        self.product_types = self._load_product_types()
        self.styles = self._load_styles()
        self.detection_rules = self.presets.get("detection_rules", {})

    def _load_product_types(self) -> Dict[str, ProductTypePreset]:
        """加载产品类型预设"""
        product_types = {}
        raw_types = self.presets.get("product_types", {})

        for key, data in raw_types.items():
            try:
                product_types[key] = ProductTypePreset(
                    id=data.get("id", key),
                    name=data.get("name", key),
                    name_en=data.get("name_en", key),
                    identity=data.get("identity", ""),
                    typical_hardware=data.get("typical_hardware", []),
                    typical_structure=data.get("typical_structure", "single_pendant"),
                    default_length_cm=data.get("default_length_cm", [8, 15]),
                    description=data.get("description", ""),
                    icon=data.get("icon", "✨"),
                )
            except Exception as e:
                print(f"[Preset Service] Error loading product type {key}: {e}")

        return product_types

    def _load_styles(self) -> Dict[str, StylePreset]:
        """加载风格预设"""
        styles = {}
        raw_styles = self.presets.get("style_presets", {})

        for key, data in raw_styles.items():
            try:
                color_data = data.get("color_palette", {})
                color_palette = ColorPalette(
                    primary=color_data.get("primary", []),
                    secondary=color_data.get("secondary", []),
                    accent=color_data.get("accent", []),
                )

                styles[key] = StylePreset(
                    id=data.get("id", key),
                    name=data.get("name", key),
                    name_en=data.get("name_en", key),
                    keywords=data.get("keywords", []),
                    typical_materials=data.get("typical_materials", []),
                    color_palette=color_palette,
                    mood_keywords=data.get("mood_keywords", []),
                    style_injection=data.get("style_injection", ""),
                    icon=data.get("icon", "✨"),
                )
            except Exception as e:
                print(f"[Preset Service] Error loading style {key}: {e}")

        return styles

    def get_product_type(self, type_id: str) -> Optional[ProductTypePreset]:
        """获取产品类型预设"""
        return self.product_types.get(type_id)

    def get_style(self, style_id: str) -> Optional[StylePreset]:
        """获取风格预设"""
        return self.styles.get(style_id)

    def get_preset(
        self,
        product_type: str = "keychain",
        style: str = "ocean_kawaii",
    ) -> DesignPreset:
        """
        获取设计预设（组合产品类型和风格）

        Args:
            product_type: 产品类型ID
            style: 风格ID

        Returns:
            DesignPreset: 组合预设
        """
        product_preset = self.get_product_type(product_type)
        if not product_preset:
            # 使用默认
            product_preset = self.get_product_type("keychain")
            if not product_preset:
                # 构建一个最基础的预设
                product_preset = ProductTypePreset(
                    id="keychain",
                    name="钥匙扣",
                    name_en="Keychain",
                    identity="keychain charm pendant",
                    typical_hardware=["lobster clasp"],
                    typical_structure="single_pendant",
                    default_length_cm=[8, 12],
                    description="",
                    icon="🔑",
                )

        style_preset = self.get_style(style)
        if not style_preset:
            # 使用默认
            style_preset = self.get_style("ocean_kawaii")
            if not style_preset:
                style_preset = StylePreset(
                    id="ocean_kawaii",
                    name="海洋风少女系",
                    name_en="Ocean Kawaii",
                    keywords=["ocean", "kawaii"],
                    typical_materials=["shell", "pearl"],
                    color_palette=ColorPalette(),
                    mood_keywords=["fresh", "summer"],
                    style_injection="ocean-themed kawaii aesthetic",
                    icon="🐚",
                )

        return DesignPreset(
            product_type=product_preset,
            style=style_preset,
        )

    def detect_product_type(
        self,
        text: str = "",
        analysis: Optional[ImageAnalysis] = None
    ) -> str:
        """
        检测产品类型

        Args:
            text: 用户输入文本
            analysis: 图像分析结果

        Returns:
            产品类型ID
        """
        text_lower = text.lower()

        # 1. 从关键词检测
        keywords_map = self.detection_rules.get("product_type_keywords", {})
        for product_type, keywords in keywords_map.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    print(f"[Preset Service] Detected product type from keyword: {product_type}")
                    return product_type

        # 2. 从五金件检测
        if analysis and analysis.elements and analysis.elements.hardware:
            hardware_map = self.detection_rules.get("hardware_to_product", {})
            for hw in analysis.elements.hardware:
                hw_type = hw.type.lower()
                for hw_keyword, product_type in hardware_map.items():
                    if hw_keyword.lower() in hw_type:
                        print(f"[Preset Service] Detected product type from hardware: {product_type}")
                        return product_type

        # 3. 默认
        default = self.presets.get("default_preset", {}).get("product_type", "keychain")
        print(f"[Preset Service] Using default product type: {default}")
        return default

    def detect_style(
        self,
        text: str = "",
        analysis: Optional[ImageAnalysis] = None
    ) -> str:
        """
        检测风格

        Args:
            text: 用户输入文本
            analysis: 图像分析结果

        Returns:
            风格ID
        """
        # 组合文本
        combined_text = text.lower()
        if analysis and analysis.style and analysis.style.tags:
            combined_text += " " + " ".join([t.lower() for t in analysis.style.tags])

        # 从关键词检测
        keywords_map = self.detection_rules.get("style_keywords", {})
        for style_id, keywords in keywords_map.items():
            for keyword in keywords:
                if keyword.lower() in combined_text:
                    print(f"[Preset Service] Detected style from keyword: {style_id}")
                    return style_id

        # 默认
        default = self.presets.get("default_preset", {}).get("style", "ocean_kawaii")
        print(f"[Preset Service] Using default style: {default}")
        return default

    def auto_detect_preset(
        self,
        text: str = "",
        analysis: Optional[ImageAnalysis] = None
    ) -> DesignPreset:
        """
        根据分析结果自动检测预设

        Args:
            text: 用户输入文本
            analysis: 图像分析结果

        Returns:
            DesignPreset: 自动检测的预设
        """
        product_type = self.detect_product_type(text, analysis)
        style = self.detect_style(text, analysis)

        print(f"[Preset Service] Auto-detected preset: product_type={product_type}, style={style}")

        return self.get_preset(product_type, style)

    def list_presets(self) -> PresetListResponse:
        """
        列出所有可用预设

        Returns:
            PresetListResponse: 预设列表
        """
        return PresetListResponse(
            product_types=list(self.product_types.values()),
            styles=list(self.styles.values()),
        )

    def list_product_types(self) -> List[ProductTypePreset]:
        """列出所有产品类型"""
        return list(self.product_types.values())

    def list_styles(self) -> List[StylePreset]:
        """列出所有风格"""
        return list(self.styles.values())


# 单例实例
preset_service = PresetService()
