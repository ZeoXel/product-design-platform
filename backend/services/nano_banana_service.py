"""
Nano Banana 图像生成服务
使用第三方代理API调用Nano Banana模型
"""
import httpx
from typing import List, Optional
from config import get_settings
from models import AspectRatio, ImageSize, GenerationResult

settings = get_settings()


class NanoBananaService:
    """Nano Banana 图像生成服务类"""

    def __init__(self):
        self.base_url = settings.OPENAI_API_BASE
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.NANO_BANANA_MODEL

    def _get_headers(self) -> dict:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def generate(
        self,
        prompt: str,
        reference_images: Optional[List[str]] = None,
        aspect_ratio: AspectRatio = AspectRatio.RATIO_1_1,
        image_size: ImageSize = ImageSize.SIZE_2K,
    ) -> GenerationResult:
        """
        生成图像

        Args:
            prompt: 图像生成提示词
            reference_images: 参考图列表 (base64或URL)
            aspect_ratio: 宽高比
            image_size: 图像尺寸

        Returns:
            生成结果，包含图像URL
        """
        # 使用 /v1/images/generations 端点 (推荐)
        payload = {
            "model": self.model,
            "prompt": prompt,
            "response_format": "url",
            "aspect_ratio": aspect_ratio.value,
            "image_size": image_size.value,
        }

        # 如果有参考图
        if reference_images:
            payload["image"] = reference_images

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/images/generations",
                headers=self._get_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            # 解析响应
            image_url = ""
            if "data" in data and len(data["data"]) > 0:
                image_data = data["data"][0]
                image_url = image_data.get("url", image_data.get("b64_json", ""))

            return GenerationResult(
                image_url=image_url,
                prompt_used=prompt,
                metadata={
                    "model": self.model,
                    "aspect_ratio": aspect_ratio.value,
                    "image_size": image_size.value,
                    "has_reference": reference_images is not None,
                },
            )

    async def edit(
        self,
        prompt: str,
        source_image: str,
        aspect_ratio: AspectRatio = AspectRatio.RATIO_1_1,
        image_size: ImageSize = ImageSize.SIZE_2K,
    ) -> GenerationResult:
        """
        编辑图像 (图生图)

        Args:
            prompt: 编辑指令
            source_image: 源图像 (base64或URL)
            aspect_ratio: 宽高比
            image_size: 图像尺寸

        Returns:
            生成结果
        """
        # 对于编辑操作，将源图像作为参考图传入
        return await self.generate(
            prompt=prompt,
            reference_images=[source_image],
            aspect_ratio=aspect_ratio,
            image_size=image_size,
        )

    async def generate_variations(
        self,
        source_image: str,
        variation_prompts: List[str],
        aspect_ratio: AspectRatio = AspectRatio.RATIO_1_1,
    ) -> List[GenerationResult]:
        """
        批量生成变体

        Args:
            source_image: 源图像
            variation_prompts: 变体提示词列表
            aspect_ratio: 宽高比

        Returns:
            生成结果列表
        """
        results = []
        for prompt in variation_prompts:
            result = await self.edit(
                prompt=prompt,
                source_image=source_image,
                aspect_ratio=aspect_ratio,
            )
            results.append(result)
        return results


# 单例实例
nano_banana_service = NanoBananaService()
