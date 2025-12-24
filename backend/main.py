"""
AI 挂饰设计平台 - FastAPI 主入口
"""
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from config import get_settings
from api import router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    print(f"🚀 {settings.APP_NAME} 启动中...")
    print(f"📡 API Base: {settings.OPENAI_API_BASE}")
    yield
    # 关闭时
    print(f"👋 {settings.APP_NAME} 已关闭")


# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description="基于AI的挂饰设计生成平台",
    version="0.1.0",
    lifespan=lifespan,
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router)

# 挂载静态文件服务（图库图片）
gallery_images_path = Path(__file__).parent / "data" / "gallery" / "images"
gallery_images_path.mkdir(parents=True, exist_ok=True)
app.mount("/gallery/images", StaticFiles(directory=str(gallery_images_path)), name="gallery_images")


# 根路径
@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8010,
        reload=settings.DEBUG,
    )
