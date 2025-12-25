"""
即梦 (Seedream) 绘图服务
豆包即梦4模型 - 支持文生图和图生图
"""
import httpx
import base64
from typing import List, Optional
from config import get_settings
from models import GenerationResult

settings = get_settings()


class SeedreamService:
    """即梦绘图服务类"""

    def __init__(self):
        self.base_url = settings.OPENAI_API_BASE
        self.api_key = settings.OPENAI_API_KEY
        self.model = getattr(settings, 'SEEDREAM_MODEL', 'doubao-seedream-4-5-251128')

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
        style_reference: Optional[str] = None,
        structure_reference: Optional[str] = None,
        size: str = "2K",
        n: int = 1,
        stream: bool = False,
        watermark: bool = False,
        sequential_image_generation: str = "auto",
    ) -> GenerationResult:
        """
        生成图像（文生图或多图参考生成）

        Args:
            prompt: 图像生成提示词
            reference_images: 参考图列表 (base64或URL)，不带就是文生图
            style_reference: 风格参考图 (用于风格锚定)
            structure_reference: 结构参考图 (用于形态约束)
            size: 图像尺寸 (2K/1K/4K)
            n: 生成数量
            stream: 是否流式返回
            watermark: 是否添加水印
            sequential_image_generation: 顺序图片生成模式 (auto)

        Returns:
            生成结果，包含图像URL
        """
        # 严格按照文档示例构建 payload
        # 文档示例:
        # {
        #   "model": "doubao-seedream-4-5-251128",
        #   "prompt": "...",
        #   "image": ["url1", "url2"],
        #   "sequential_image_generation": "auto",
        #   "n": 3,
        #   "response_format": "url",
        #   "size": "2K",
        #   "stream": true,
        #   "watermark": true
        # }
        payload = {
            "model": self.model,
            "prompt": prompt,
            "n": n,
            "response_format": "url",
            "size": size,
            "stream": stream,
            "watermark": watermark,
        }

        # 组装所有参考图（最多8张）
        all_images = []

        # 1. 用户参考图
        if reference_images:
            all_images.extend(reference_images)

        # 2. 风格参考图
        if style_reference:
            all_images.append(style_reference)

        # 3. 结构参考图
        if structure_reference:
            all_images.append(structure_reference)

        # 格式化并添加到请求
        if all_images:
            formatted_images = []
            for img in all_images[:8]:  # 最多8张
                if img.startswith("http"):
                    # URL 直接使用
                    formatted_images.append(img)
                elif img.startswith("data:"):
                    # data URI 格式直接使用
                    formatted_images.append(img)
                else:
                    # 纯 base64，添加 data URI 前缀
                    formatted_images.append(f"data:image/png;base64,{img}")

            payload["image"] = formatted_images
            payload["sequential_image_generation"] = sequential_image_generation
            print(f"[Seedream] 图生图模式: {len(formatted_images)} 张参考图")
        else:
            print("[Seedream] 文生图模式")

        print(f"[Seedream] 请求: model={self.model}, size={size}, n={n}, prompt={prompt[:80]}...")

        # 调试：打印 payload 结构（不打印完整 base64）
        debug_payload = {}
        for k, v in payload.items():
            if k == "image" and isinstance(v, list):
                debug_payload[k] = f"[{len(v)} images]"
            elif k == "prompt":
                debug_payload[k] = f"{v[:50]}..." if len(v) > 50 else v
            else:
                debug_payload[k] = v
        print(f"[Seedream] Payload: {debug_payload}")

        async with httpx.AsyncClient(timeout=180.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/images/generations",
                    headers=self._get_headers(),
                    json=payload,
                )

                if response.status_code != 200:
                    print(f"[Seedream Error] Status: {response.status_code}")
                    print(f"[Seedream Error] Response: {response.text}")
                    response.raise_for_status()

                data = response.json()
                print(f"[Seedream Success] Response: {data}")

                # 解析响应
                image_urls = []
                if "data" in data and len(data["data"]) > 0:
                    for item in data["data"]:
                        url = item.get("url", "")
                        if url:
                            image_urls.append(url)

                # 返回第一张图的URL（如果需要多张可以扩展）
                image_url = image_urls[0] if image_urls else ""

                return GenerationResult(
                    image_url=image_url,
                    prompt_used=prompt,
                    metadata={
                        "model": self.model,
                        "size": size,
                        "n": n,
                        "has_reference": reference_images is not None,
                        "all_urls": image_urls,  # 保存所有生成的URL
                        "usage": data.get("usage", {}),
                    },
                )

            except httpx.ReadTimeout:
                print("[Seedream Error] 请求超时")
                raise Exception("图像生成超时，请稍后重试")
            except httpx.HTTPStatusError as e:
                print(f"[Seedream HTTP Error] {e}")
                raise
            except Exception as e:
                print(f"[Seedream Error] {e}")
                raise

    async def edit(
        self,
        prompt: str,
        image: str,
        mask: Optional[str] = None,
        size: str = "1024x1024",
        n: int = 1,
    ) -> GenerationResult:
        """
        编辑图像（局部重绘）

        使用 multipart/form-data 格式

        Args:
            prompt: 编辑提示词
            image: 原图 (base64或文件路径)
            mask: 遮罩图 (base64或文件路径，可选)
            size: 输出尺寸
            n: 生成数量

        Returns:
            生成结果
        """
        # 准备 multipart 数据
        files = {}
        data = {
            "model": self.model,
            "prompt": prompt,
            "n": n,
            "size": size,
            "response_format": "url",
        }

        # 处理图像
        if image.startswith("data:"):
            # 从 data URI 提取 base64
            _, img_data = image.split(",", 1)
            img_bytes = base64.b64decode(img_data)
            files["image"] = ("image.png", img_bytes, "image/png")
        elif image.startswith("http"):
            # URL 需要先下载
            async with httpx.AsyncClient() as client:
                resp = await client.get(image)
                files["image"] = ("image.png", resp.content, "image/png")
        else:
            # 纯 base64
            img_bytes = base64.b64decode(image)
            files["image"] = ("image.png", img_bytes, "image/png")

        # 处理遮罩
        if mask:
            if mask.startswith("data:"):
                _, mask_data = mask.split(",", 1)
                mask_bytes = base64.b64decode(mask_data)
                files["mask"] = ("mask.png", mask_bytes, "image/png")
            elif not mask.startswith("http"):
                mask_bytes = base64.b64decode(mask)
                files["mask"] = ("mask.png", mask_bytes, "image/png")

        print(f"[Seedream Edit] 编辑请求: size={size}, n={n}")
        print(f"[Seedream Edit] Prompt: {prompt[:100]}...")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        async with httpx.AsyncClient(timeout=180.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/images/edits",
                    headers=headers,
                    data=data,
                    files=files,
                )

                if response.status_code != 200:
                    print(f"[Seedream Edit Error] Status: {response.status_code}")
                    print(f"[Seedream Edit Error] Response: {response.text}")
                    response.raise_for_status()

                result = response.json()
                print(f"[Seedream Edit Success] Response: {result}")

                # 解析响应
                image_urls = []
                if "data" in result and len(result["data"]) > 0:
                    for item in result["data"]:
                        url = item.get("url", "")
                        if url:
                            image_urls.append(url)

                image_url = image_urls[0] if image_urls else ""

                return GenerationResult(
                    image_url=image_url,
                    prompt_used=prompt,
                    metadata={
                        "model": self.model,
                        "size": size,
                        "n": n,
                        "mode": "edit",
                        "all_urls": image_urls,
                        "usage": result.get("usage", {}),
                    },
                )

            except httpx.ReadTimeout:
                print("[Seedream Edit Error] 请求超时")
                raise Exception("图像编辑超时，请稍后重试")
            except Exception as e:
                print(f"[Seedream Edit Error] {e}")
                raise

    async def generate_batch(
        self,
        prompt: str,
        reference_images: Optional[List[str]] = None,
        size: str = "2K",
        n: int = 3,
    ) -> List[str]:
        """
        批量生成图像

        Args:
            prompt: 提示词
            reference_images: 参考图列表
            size: 尺寸
            n: 生成数量

        Returns:
            图像URL列表
        """
        result = await self.generate(
            prompt=prompt,
            reference_images=reference_images,
            size=size,
            n=n,
        )

        return result.metadata.get("all_urls", [result.image_url])


# 单例实例
seedream_service = SeedreamService()
