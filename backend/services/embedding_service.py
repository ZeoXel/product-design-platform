"""
图像嵌入服务 - 使用网关向量嵌入 API
支持多模态输入（图像 + 文本）
"""
import httpx
import numpy as np
from typing import Optional
from config import get_settings

settings = get_settings()


class EmbeddingService:
    """向量嵌入服务类 - 调用网关 API 或使用本地 CLIP"""

    def __init__(self):
        self.base_url = settings.OPENAI_API_BASE
        self.api_key = settings.OPENAI_API_KEY
        self.model = "text-embedding-3-small"  # 文本嵌入模型
        self.use_image_embedding = False  # text-embedding-3-small 不支持图像
        # 注意: 如果 API 提供了支持图像的模型，可以修改 use_image_embedding 为 True
        # 并设置 self.model 为支持多模态的模型名称（如 "clip-vit-base" 等）
        self.max_image_size = 400 * 1024  # 最大图片大小（base64字符）

    def _get_headers(self) -> dict:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def generate_embedding(
        self,
        image_base64: str,
        text: Optional[str] = None
    ) -> Optional[np.ndarray]:
        """
        生成多模态嵌入向量（支持图像+文本）

        Args:
            image_base64: 图像base64数据
            text: 可选的文本描述

        Returns:
            归一化的嵌入向量，失败时返回 None
        """
        # 当前模型不支持图像，只使用文本
        if not text:
            print("[Embedding] 提示: 当前模型仅支持文本嵌入，需要提供文本描述")
            return None

        # 使用文本嵌入（兼容 OpenAI API 标准格式）
        payload = {
            "model": self.model,
            "input": text  # 纯文本输入
        }

        print(f"[Embedding] 使用文本嵌入: '{text[:50]}...'")

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/embeddings",
                    headers=self._get_headers(),
                    json=payload,
                )

                if response.status_code != 200:
                    print(f"[Embedding Error] Status: {response.status_code}")
                    print(f"[Embedding Error] Response: {response.text}")
                    response.raise_for_status()

                data = response.json()
                print(f"[Embedding Success] Generated embedding")

                # 解析响应获取嵌入向量
                if "data" in data and len(data["data"]) > 0:
                    embedding = data["data"][0].get("embedding", [])
                    # 转换为 numpy 数组
                    embedding_array = np.array(embedding, dtype=np.float32)

                    # 如果 API 没有返回归一化的向量，手动归一化
                    if not payload.get("normalized"):
                        norm = np.linalg.norm(embedding_array)
                        if norm > 0:
                            embedding_array = embedding_array / norm

                    print(f"[Embedding] Vector shape: {embedding_array.shape}")
                    return embedding_array
                else:
                    raise ValueError("No embedding data in response")

            except httpx.HTTPStatusError as e:
                print(f"[Embedding HTTP Error] {e}")
                raise
            except Exception as e:
                print(f"[Embedding Error] {e}")
                raise

    @staticmethod
    def compute_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        计算两个嵌入向量的余弦相似度

        Args:
            emb1: 第一个嵌入向量
            emb2: 第二个嵌入向量

        Returns:
            相似度分数 (0-1)
        """
        # 确保向量是归一化的
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)

        if norm1 > 0:
            emb1 = emb1 / norm1
        if norm2 > 0:
            emb2 = emb2 / norm2

        # 计算余弦相似度
        similarity = float(np.dot(emb1, emb2))

        # 确保在 0-1 范围内
        similarity = max(0.0, min(1.0, similarity))

        return similarity


# 单例实例
embedding_service = EmbeddingService()
