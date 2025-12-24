"""
参考图库管理服务
集成向量检索功能
"""
import json
import uuid
import base64
import numpy as np
from typing import List, Optional, Dict
from pathlib import Path
from datetime import datetime
from models import ImageAnalysis
from services.embedding_service import embedding_service
from services.search_utils import generate_multimodal_search_description


class GalleryService:
    """图库管理服务类"""

    def __init__(self):
        # 支持从不同目录运行
        self.base_dir = Path(__file__).parent.parent / "data" / "gallery"
        self.images_dir = self.base_dir / "images"
        self.embeddings_dir = self.base_dir / "embeddings"
        self.metadata_file = self.base_dir / "metadata.json"

        # 创建目录
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.embeddings_dir.mkdir(parents=True, exist_ok=True)

        # 加载元数据
        self.metadata = self._load_metadata()

    def _load_metadata(self) -> Dict:
        """加载元数据索引"""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"items": []}

    def _save_metadata(self):
        """保存元数据索引"""
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)

    async def add_reference(
        self,
        image_base64: str,
        analysis: ImageAnalysis,
        sales_tier: str = "B"
    ) -> Dict:
        """
        添加参考图到图库

        Args:
            image_base64: 图像base64数据
            analysis: 图像分析结果
            sales_tier: 销售层级 (A/B/C)

        Returns:
            参考图项
        """
        ref_id = str(uuid.uuid4())

        try:
            # 1. 保存图像文件
            image_path = self.images_dir / f"{ref_id}.jpg"
            image_data = base64.b64decode(image_base64)
            with open(image_path, 'wb') as f:
                f.write(image_data)

            # 2. 生成并保存嵌入向量（基于结构化文本描述）
            print(f"[Gallery] Generating embedding for {ref_id}...")
            # 使用标准化的详细描述生成嵌入
            text_desc = generate_multimodal_search_description(analysis)
            print(f"[Gallery] Search description: {text_desc}")
            embedding = await embedding_service.generate_embedding(
                image_base64=image_base64,
                text=text_desc
            )

            if embedding is not None:
                embedding_path = self.embeddings_dir / f"{ref_id}.npy"
                np.save(embedding_path, embedding)
                print(f"[Gallery] Embedding saved to {embedding_path}")
            else:
                print(f"[Gallery] Warning: Embedding generation failed, skipping...")

            # 3. 保存元数据
            item = {
                "id": ref_id,
                "filename": f"{ref_id}.jpg",
                "uploadTime": datetime.now().isoformat(),
                "analysis": analysis.model_dump(),
                "salesTier": sales_tier
            }

            self.metadata["items"].append(item)
            self._save_metadata()

            print(f"[Gallery] Added reference {ref_id}")
            return item

        except Exception as e:
            print(f"[Gallery Error] Failed to add reference: {e}")
            # 清理已创建的文件
            if image_path.exists():
                image_path.unlink()
            if embedding_path and embedding_path.exists():
                embedding_path.unlink()
            raise

    def list_references(
        self,
        style: Optional[str] = None,
        sales_tier: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        列出参考图

        Args:
            style: 风格过滤
            sales_tier: 销售层级过滤
            limit: 返回数量限制

        Returns:
            参考图列表
        """
        items = self.metadata["items"]

        # 风格过滤
        if style:
            items = [
                item for item in items
                if style.lower() in " ".join(
                    item.get("analysis", {}).get("style", {}).get("tags", [])
                ).lower()
            ]

        # 销售层级过滤
        if sales_tier:
            items = [item for item in items if item.get("salesTier") == sales_tier]

        # 添加 imageUrl 字段
        results = []
        for item in items[:limit]:
            item_copy = item.copy()
            item_copy["imageUrl"] = f"/gallery/images/{item['filename']}"
            results.append(item_copy)

        return results

    def get_reference(self, ref_id: str) -> Optional[Dict]:
        """
        获取单个参考图详情

        Args:
            ref_id: 参考图ID

        Returns:
            参考图项，不存在返回None
        """
        for item in self.metadata["items"]:
            if item["id"] == ref_id:
                item_copy = item.copy()
                item_copy["imageUrl"] = f"/gallery/images/{item['filename']}"
                return item_copy
        return None

    def delete_reference(self, ref_id: str) -> bool:
        """
        删除参考图

        Args:
            ref_id: 参考图ID

        Returns:
            是否成功删除
        """
        # 删除图像文件
        image_path = self.images_dir / f"{ref_id}.jpg"
        if image_path.exists():
            image_path.unlink()

        # 删除嵌入文件
        embedding_path = self.embeddings_dir / f"{ref_id}.npy"
        if embedding_path.exists():
            embedding_path.unlink()

        # 从元数据中删除
        original_count = len(self.metadata["items"])
        self.metadata["items"] = [
            item for item in self.metadata["items"]
            if item["id"] != ref_id
        ]
        self._save_metadata()

        deleted = len(self.metadata["items"]) < original_count
        if deleted:
            print(f"[Gallery] Deleted reference {ref_id}")
        return deleted

    async def find_similar(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        threshold: float = 0.5
    ) -> List[Dict]:
        """
        查找相似图片

        Args:
            query_embedding: 查询向量
            top_k: 返回数量
            threshold: 相似度阈值

        Returns:
            相似图片列表（按相似度降序）
        """
        similarities = []

        for item in self.metadata["items"]:
            ref_id = item["id"]
            embedding_path = self.embeddings_dir / f"{ref_id}.npy"

            if embedding_path.exists():
                try:
                    ref_embedding = np.load(embedding_path)
                    similarity = embedding_service.compute_similarity(
                        query_embedding, ref_embedding
                    )

                    if similarity >= threshold:
                        similarities.append({
                            "id": ref_id,
                            "imageUrl": f"/gallery/images/{ref_id}.jpg",
                            "similarity": float(similarity),
                            "item": item
                        })
                except Exception as e:
                    print(f"[Gallery] Error loading embedding for {ref_id}: {e}")
                    continue

        # 按相似度降序排序
        similarities.sort(key=lambda x: x["similarity"], reverse=True)

        # 返回 top_k
        return similarities[:top_k]


# 单例实例
gallery_service = GalleryService()
