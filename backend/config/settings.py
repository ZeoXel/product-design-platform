"""
应用配置
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用设置"""

    # API配置 - 使用第三方代理入口
    OPENAI_BASE_URL: str = "https://api.bltcy.ai"
    OPENAI_API_BASE: str = "https://api.bltcy.ai/v1"
    OPENAI_API_KEY: str = ""

    # 模型配置
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20240620"
    NANO_BANANA_MODEL: str = "nano-banana-2"

    # 应用配置
    APP_NAME: str = "AI挂饰设计平台"
    DEBUG: bool = True

    # CORS配置
    CORS_ORIGINS: list = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3010", "http://127.0.0.1:3010"]

    class Config:
        env_file = ("../.env", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """获取缓存的设置实例"""
    return Settings()
