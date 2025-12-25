"""
Pydantic数据模型
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class AspectRatio(str, Enum):
    """图像宽高比"""
    RATIO_1_1 = "1:1"
    RATIO_4_3 = "4:3"
    RATIO_3_4 = "3:4"
    RATIO_16_9 = "16:9"
    RATIO_9_16 = "9:16"
    RATIO_2_3 = "2:3"
    RATIO_3_2 = "3:2"
    RATIO_4_5 = "4:5"
    RATIO_5_4 = "5:4"
    RATIO_21_9 = "21:9"


class ImageSize(str, Enum):
    """图像尺寸"""
    SIZE_1K = "1K"
    SIZE_2K = "2K"
    SIZE_4K = "4K"


class StyleHint(str, Enum):
    """风格提示 - 用于引导生成结果的风格方向"""
    OCEAN_KAWAII = "ocean_kawaii"         # 海洋风少女系
    BOHEMIAN = "bohemian"                  # 波西米亚民族风
    BOHEMIAN_NATURAL = "bohemian_natural"  # 波西米亚自然系
    OCEAN_SHELL = "ocean_shell"            # 海洋贝壳系
    CANDY_PLAYFUL = "candy_playful"        # 糖果色童趣系
    DREAMY_STAR = "dreamy_star"            # 梦幻星空系
    MINIMALIST = "minimalist"              # 简约现代风
    VINTAGE_ELEGANT = "vintage_elegant"    # 复古典雅风


# ==================== 请求模型 ====================

class ChatMessage(BaseModel):
    """聊天消息"""
    role: str = Field(..., description="消息角色: user/assistant")
    content: str = Field(..., description="消息内容")


class GenerateRequest(BaseModel):
    """设计生成请求"""
    instruction: str = Field(..., description="用户设计指令")
    reference_image: Optional[str] = Field(None, description="参考图base64或URL")
    session_id: Optional[str] = Field(None, description="会话ID")
    aspect_ratio: AspectRatio = Field(AspectRatio.RATIO_1_1, description="生成图像宽高比")
    image_size: ImageSize = Field(ImageSize.SIZE_2K, description="生成图像尺寸")
    style_hint: Optional[StyleHint] = Field(None, description="风格提示，用于引导生成方向")


class ChatRequest(BaseModel):
    """对话请求"""
    messages: List[ChatMessage] = Field(..., description="对话历史")
    session_id: Optional[str] = Field(None, description="会话ID")


class ImageAnalyzeRequest(BaseModel):
    """图像分析请求"""
    image: str = Field(..., description="图像base64数据")
    prompt: Optional[str] = Field("分析这个挂饰设计的元素、风格和结构", description="分析提示词")


class ImageGenerateRequest(BaseModel):
    """图像生成请求"""
    prompt: str = Field(..., description="生成提示词")
    reference_images: Optional[List[str]] = Field(None, description="参考图列表(base64或URL)")
    aspect_ratio: AspectRatio = Field(AspectRatio.RATIO_1_1, description="宽高比")
    image_size: ImageSize = Field(ImageSize.SIZE_2K, description="图像尺寸")


class SimilarSearchRequest(BaseModel):
    """相似图片搜索请求"""
    image: str = Field(..., description="图像base64数据")
    text: Optional[str] = Field(None, description="可选的文本描述")
    top_k: int = Field(5, description="返回数量")
    threshold: float = Field(0.5, description="相似度阈值")


# ==================== 响应模型 ====================

class AnalysisResult(BaseModel):
    """图像分析结果（旧格式，保留兼容性）"""
    elements: List[dict] = Field(default_factory=list, description="检测到的元素")
    style: dict = Field(default_factory=dict, description="风格特征")
    description: str = Field("", description="整体描述")
    suggestions: List[str] = Field(default_factory=list, description="设计建议")


class ElementItem(BaseModel):
    """元素项"""
    type: str = Field(..., description="元素类型")
    color: Optional[str] = Field(None, description="颜色")
    count: Optional[int] = Field(None, description="数量")
    material: Optional[str] = Field(None, description="材质")
    position: Optional[str] = Field(None, description="位置")


class ElementsGroup(BaseModel):
    """元素分组"""
    primary: List[ElementItem] = Field(default_factory=list, description="主要元素（视觉主体）")
    secondary: List[ElementItem] = Field(default_factory=list, description="辅助元素（装饰填充）")
    hardware: List[ElementItem] = Field(default_factory=list, description="五金件（功能性）")


class StyleInfo(BaseModel):
    """风格信息"""
    tags: List[str] = Field(default_factory=list, description="风格标签")
    mood: str = Field("", description="整体情绪/氛围")


class PhysicalSpecs(BaseModel):
    """物理规格"""
    lengthCm: float = Field(..., description="长度（厘米）")
    weightG: float = Field(..., description="重量（克）")


class SimilarItem(BaseModel):
    """相似产品"""
    id: str = Field(..., description="产品ID")
    imageUrl: str = Field(..., description="图片URL")
    similarity: float = Field(..., description="相似度（0-1）")


class ImageAnalysis(BaseModel):
    """图像分析结果（前端格式）"""
    elements: ElementsGroup = Field(..., description="元素分组")
    style: StyleInfo = Field(..., description="风格信息")
    physicalSpecs: PhysicalSpecs = Field(..., description="物理规格")
    suggestions: List[str] = Field(default_factory=list, description="设计建议")
    similarItems: Optional[List[SimilarItem]] = Field(None, description="相似产品")


class GenerationResult(BaseModel):
    """图像生成结果"""
    image_url: str = Field(..., description="生成图像URL")
    prompt_used: str = Field(..., description="使用的提示词")
    metadata: dict = Field(default_factory=dict, description="生成元数据")


class ChatResponse(BaseModel):
    """对话响应"""
    message: str = Field(..., description="AI回复内容")
    session_id: str = Field(..., description="会话ID")


class DesignResponse(BaseModel):
    """设计生成响应"""
    success: bool = Field(..., description="是否成功")
    image_url: Optional[str] = Field(None, description="生成图像URL")
    analysis: Optional[ImageAnalysis] = Field(None, description="图像分析结果")
    prompt_used: Optional[str] = Field(None, description="使用的提示词")
    message: str = Field("", description="处理消息")
    cost_estimate: Optional[dict] = Field(None, description="成本估算")
    session_id: Optional[str] = Field(None, description="会话ID")


class ErrorResponse(BaseModel):
    """错误响应"""
    success: bool = Field(False)
    error: str = Field(..., description="错误信息")
    code: str = Field("UNKNOWN_ERROR", description="错误代码")


# ==================== 产品类型枚举 ====================

class ProductType(str, Enum):
    """产品类型"""
    KEYCHAIN = "keychain"           # 钥匙扣
    BAG_CHARM = "bag_charm"         # 包挂
    PHONE_STRAP = "phone_strap"     # 手机挂绳
    CAR_CHARM = "car_charm"         # 车挂
    GENERIC = "generic"             # 通用挂饰


class StructureType(str, Enum):
    """结构类型"""
    SINGLE_PENDANT = "single_pendant"   # 单一吊坠式
    BEADED_CHAIN = "beaded_chain"       # 串珠链式
    TASSEL_STYLE = "tassel_style"       # 流苏垂坠式
    MULTI_LAYER = "multi_layer"         # 多层式
    CLUSTER = "cluster"                  # 簇状式


# ==================== 预设模型 ====================

class ColorPalette(BaseModel):
    """颜色方案"""
    primary: List[str] = Field(default_factory=list, description="主色调")
    secondary: List[str] = Field(default_factory=list, description="辅助色")
    accent: List[str] = Field(default_factory=list, description="点缀色")


class ProductTypePreset(BaseModel):
    """产品类型预设"""
    id: str = Field(..., description="预设ID")
    name: str = Field(..., description="中文名称")
    name_en: str = Field(..., description="英文名称")
    identity: str = Field(..., description="产品身份描述")
    typical_hardware: List[str] = Field(default_factory=list, description="典型五金件")
    typical_structure: str = Field("single_pendant", description="典型结构类型")
    default_length_cm: List[int] = Field([8, 15], description="默认长度范围(cm)")
    description: str = Field("", description="描述")
    icon: str = Field("✨", description="图标")


class StylePreset(BaseModel):
    """风格预设"""
    id: str = Field(..., description="预设ID")
    name: str = Field(..., description="中文名称")
    name_en: str = Field(..., description="英文名称")
    keywords: List[str] = Field(default_factory=list, description="关键词")
    typical_materials: List[str] = Field(default_factory=list, description="典型材料")
    color_palette: ColorPalette = Field(default_factory=ColorPalette, description="颜色方案")
    mood_keywords: List[str] = Field(default_factory=list, description="情绪关键词")
    style_injection: str = Field("", description="风格注入文本")
    icon: str = Field("✨", description="图标")


class DesignPreset(BaseModel):
    """设计预设（组合产品类型和风格）"""
    product_type: ProductTypePreset = Field(..., description="产品类型预设")
    style: StylePreset = Field(..., description="风格预设")

    # 计算属性
    @property
    def product_type_id(self) -> str:
        return self.product_type.id

    @property
    def style_id(self) -> str:
        return self.style.id


class PresetListResponse(BaseModel):
    """预设列表响应"""
    product_types: List[ProductTypePreset] = Field(default_factory=list)
    styles: List[StylePreset] = Field(default_factory=list)
