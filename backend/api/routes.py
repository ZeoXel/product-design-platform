"""
API 路由定义
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import base64
from typing import Optional

from models import (
    GenerateRequest,
    ChatRequest,
    ImageAnalyzeRequest,
    ImageGenerateRequest,
    DesignResponse,
    ChatResponse,
    AnalysisResult,
    GenerationResult,
    ErrorResponse,
)
from agents import design_agent
from services import claude_service, nano_banana_service

router = APIRouter(prefix="/api/v1", tags=["Design API"])


# ==================== 设计生成 ====================

@router.post("/generate", response_model=DesignResponse)
async def generate_design(request: GenerateRequest):
    """
    主设计生成接口

    根据用户指令和可选的参考图生成挂饰设计
    """
    try:
        result = await design_agent.generate_design(
            instruction=request.instruction,
            reference_image=request.reference_image,
            session_id=request.session_id,
            aspect_ratio=request.aspect_ratio,
            image_size=request.image_size,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/upload", response_model=DesignResponse)
async def generate_design_with_upload(
    instruction: str,
    session_id: Optional[str] = None,
    reference_image: Optional[UploadFile] = File(None),
):
    """
    带文件上传的设计生成接口
    """
    try:
        image_base64 = None
        if reference_image:
            content = await reference_image.read()
            image_base64 = base64.b64encode(content).decode("utf-8")

        result = await design_agent.generate_design(
            instruction=instruction,
            reference_image=image_base64,
            session_id=session_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 图像分析 ====================

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_image(request: ImageAnalyzeRequest):
    """
    分析图像

    使用Claude Vision分析图像中的设计元素、风格等
    """
    try:
        result = await claude_service.analyze_image(
            image_base64=request.image,
            prompt=request.prompt,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/upload", response_model=AnalysisResult)
async def analyze_image_upload(
    image: UploadFile = File(...),
    prompt: Optional[str] = "分析这个挂饰设计的元素、风格和结构",
):
    """
    上传文件分析图像
    """
    try:
        content = await image.read()
        image_base64 = base64.b64encode(content).decode("utf-8")

        result = await claude_service.analyze_image(
            image_base64=image_base64,
            prompt=prompt,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 图像生成 ====================

@router.post("/image/generate", response_model=GenerationResult)
async def generate_image(request: ImageGenerateRequest):
    """
    直接生成图像

    使用Nano Banana根据提示词生成图像
    """
    try:
        result = await nano_banana_service.generate(
            prompt=request.prompt,
            reference_images=request.reference_images,
            aspect_ratio=request.aspect_ratio,
            image_size=request.image_size,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 对话 ====================

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    与设计助手对话
    """
    try:
        response = await design_agent.chat(
            messages=request.messages,
            session_id=request.session_id,
        )

        session_id = request.session_id or "new_session"

        return ChatResponse(
            message=response,
            session_id=session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 会话管理 ====================

@router.get("/session/{session_id}/versions")
async def get_session_versions(session_id: str):
    """
    获取会话的版本历史
    """
    versions = design_agent.get_session_versions(session_id)
    return {"session_id": session_id, "versions": versions}


# ==================== 健康检查 ====================

@router.get("/health")
async def health_check():
    """
    健康检查
    """
    return {"status": "healthy", "service": "AI Design Platform"}
