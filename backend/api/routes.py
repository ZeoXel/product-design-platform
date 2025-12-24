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
    SimilarSearchRequest,
    DesignResponse,
    ChatResponse,
    AnalysisResult,
    ImageAnalysis,
    GenerationResult,
    ErrorResponse,
)
from agents import design_agent
from services import claude_service, nano_banana_service, gallery_service, embedding_service

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

@router.post("/analyze", response_model=ImageAnalysis)
async def analyze_image(
    request: ImageAnalyzeRequest,
    include_similar: bool = True  # 是否包含相似产品推荐
):
    """
    分析图像

    使用Claude Vision分析图像中的设计元素、风格等
    可选：自动查找图库中的相似产品
    """
    try:
        # 1. 分析图像
        result = await claude_service.analyze_image(
            image_base64=request.image,
            prompt=request.prompt,
        )

        # 2. 如果需要，查找相似图片
        if include_similar:
            try:
                # 使用分析结果生成文本描述用于嵌入
                text_desc = f"{' '.join(result.style.tags)} {result.style.mood}"
                query_embedding = await embedding_service.generate_embedding(
                    image_base64=request.image,
                    text=text_desc
                )

                if query_embedding is None:
                    print("[Analyze] Cannot generate embedding, skipping similarity search")
                    return result

                similar = await gallery_service.find_similar(query_embedding, top_k=3)

                # 添加相似产品到结果
                from models import SimilarItem
                result.similarItems = [
                    SimilarItem(
                        id=item["id"],
                        imageUrl=item["imageUrl"],
                        similarity=item["similarity"]
                    )
                    for item in similar
                ]
            except Exception as e:
                # 相似推荐失败不影响主流程
                print(f"[Analyze] Failed to find similar items: {e}")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/upload", response_model=ImageAnalysis)
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


# ==================== 图库管理 ====================

@router.post("/gallery/references")
async def upload_reference(
    image: UploadFile = File(...),
    sales_tier: str = "B"
):
    """
    上传参考图到图库

    自动生成图像分析和嵌入向量
    """
    try:
        # 读取图像
        content = await image.read()
        image_base64 = base64.b64encode(content).decode("utf-8")

        # 分析图片
        analysis = await claude_service.analyze_image(image_base64)

        # 添加到图库（包含向量嵌入）
        item = await gallery_service.add_reference(
            image_base64, analysis, sales_tier
        )

        return {
            "success": True,
            "reference": item
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gallery/references")
async def list_references(
    style: Optional[str] = None,
    sales_tier: Optional[str] = None,
    limit: int = 20
):
    """
    列出图库中的参考图

    支持按风格和销售层级过滤
    """
    try:
        items = gallery_service.list_references(style, sales_tier, limit)
        return {
            "success": True,
            "items": items,
            "total": len(items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gallery/references/{ref_id}")
async def get_reference(ref_id: str):
    """
    获取参考图详情
    """
    try:
        item = gallery_service.get_reference(ref_id)
        if not item:
            raise HTTPException(status_code=404, detail="Reference not found")
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/gallery/references/{ref_id}")
async def delete_reference(ref_id: str):
    """
    删除参考图
    """
    try:
        success = gallery_service.delete_reference(ref_id)
        if not success:
            raise HTTPException(status_code=404, detail="Reference not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 相似图片查询 ====================

@router.post("/gallery/similar")
async def find_similar_images(request: SimilarSearchRequest):
    """
    查找相似图片

    根据图像相似度返回图库中的相似产品
    注意：当前需要提供文本描述来生成嵌入向量
    """
    try:
        # 生成查询图像的嵌入向量
        text = request.text
        if not text:
            # 如果没有文本，先分析图像获取描述
            analysis = await claude_service.analyze_image(request.image)
            text = f"{' '.join(analysis.style.tags)} {analysis.style.mood}"

        query_embedding = await embedding_service.generate_embedding(
            image_base64=request.image,
            text=text
        )

        if query_embedding is None:
            return {
                "success": False,
                "error": "Failed to generate embedding",
                "similar": []
            }

        # 检索相似图片
        similar_items = await gallery_service.find_similar(
            query_embedding, request.top_k, request.threshold
        )

        return {
            "success": True,
            "similar": similar_items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
