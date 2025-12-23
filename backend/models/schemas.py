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


# ==================== 响应模型 ====================

class AnalysisResult(BaseModel):
    """图像分析结果"""
    elements: List[dict] = Field(default_factory=list, description="检测到的元素")
    style: dict = Field(default_factory=dict, description="风格特征")
    description: str = Field("", description="整体描述")
    suggestions: List[str] = Field(default_factory=list, description="设计建议")


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
    analysis: Optional[AnalysisResult] = Field(None, description="图像分析结果")
    prompt_used: Optional[str] = Field(None, description="使用的提示词")
    message: str = Field("", description="处理消息")
    cost_estimate: Optional[dict] = Field(None, description="成本估算")


class ErrorResponse(BaseModel):
    """错误响应"""
    success: bool = Field(False)
    error: str = Field(..., description="错误信息")
    code: str = Field("UNKNOWN_ERROR", description="错误代码")
