/**
 * API 客户端服务
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ==================== 类型定义 ====================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 新的结构化分析结果格式
export interface ImageAnalysis {
  elements: {
    primary: Array<{
      type: string;
      color?: string;
      count?: number;
      material?: string;
      position?: string;
    }>;
    secondary: Array<{
      type: string;
      color?: string;
      count?: number;
      material?: string;
      position?: string;
    }>;
    hardware: Array<{
      type: string;
      color?: string;
      count?: number;
      material?: string;
      position?: string;
    }>;
  };
  style: {
    tags: string[];
    mood: string;
  };
  physicalSpecs: {
    lengthCm: number;
    weightG: number;
  };
  suggestions: string[];
  similarItems?: Array<{
    id: string;
    imageUrl: string;
    similarity: number;
  }>;
}

// 保留旧格式用于兼容
export interface AnalysisResult {
  elements: Array<{
    type: string;
    color?: string;
    position?: string;
  }>;
  style: {
    overall?: string;
    color_scheme?: string;
    mood?: string;
  };
  description: string;
  suggestions: string[];
}

export interface GenerationResult {
  image_url: string;
  prompt_used: string;
  metadata: Record<string, unknown>;
}

export interface DesignResponse {
  success: boolean;
  image_url?: string;
  analysis?: ImageAnalysis;  // 使用新格式
  prompt_used?: string;
  message: string;
  cost_estimate?: {
    material: number;
    labor: number;
    total: number;
    currency: string;
  };
}

// 图库参考图
export interface GalleryReference {
  id: string;
  filename: string;
  uploadTime: string;
  analysis: ImageAnalysis;
  salesTier: 'A' | 'B' | 'C';
}

export interface ChatResponse {
  message: string;
  session_id: string;
}

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2' | '4:5' | '5:4' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

// ==================== API 请求函数 ====================

/**
 * 通用请求函数
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || '请求失败');
  }

  return response.json();
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  return request('/health');
}

/**
 * 生成设计
 */
export async function generateDesign(params: {
  instruction: string;
  reference_image?: string;
  session_id?: string;
  aspect_ratio?: AspectRatio;
  image_size?: ImageSize;
}): Promise<DesignResponse> {
  return request('/generate', {
    method: 'POST',
    body: JSON.stringify({
      instruction: params.instruction,
      reference_image: params.reference_image,
      session_id: params.session_id,
      aspect_ratio: params.aspect_ratio || '1:1',
      image_size: params.image_size || '2K',
    }),
  });
}

/**
 * 分析图像（返回新的结构化格式）
 */
export async function analyzeImage(params: {
  image: string;
  prompt?: string;
  include_similar?: boolean;
}): Promise<ImageAnalysis> {
  const url = `/analyze${params.include_similar !== false ? '?include_similar=true' : ''}`;
  return request(url, {
    method: 'POST',
    body: JSON.stringify({
      image: params.image,
      prompt: params.prompt || '分析这个挂饰设计的元素、风格和结构',
    }),
  });
}

/**
 * 直接生成图像
 */
export async function generateImage(params: {
  prompt: string;
  reference_images?: string[];
  aspect_ratio?: AspectRatio;
  image_size?: ImageSize;
}): Promise<GenerationResult> {
  return request('/image/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt: params.prompt,
      reference_images: params.reference_images,
      aspect_ratio: params.aspect_ratio || '1:1',
      image_size: params.image_size || '2K',
    }),
  });
}

/**
 * 与设计助手对话
 */
export async function chat(params: {
  messages: ChatMessage[];
  session_id?: string;
}): Promise<ChatResponse> {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: params.messages,
      session_id: params.session_id,
    }),
  });
}

/**
 * 获取会话版本历史
 */
export async function getSessionVersions(sessionId: string): Promise<{
  session_id: string;
  versions: Array<{
    instruction: string;
    prompt: string;
    image_url: string;
  }>;
}> {
  return request(`/session/${sessionId}/versions`);
}

/**
 * 将文件转换为base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 上传参考图到图库
 */
export async function uploadReference(params: {
  file: File;
  salesTier?: 'A' | 'B' | 'C';
}): Promise<{ success: boolean; reference: GalleryReference }> {
  const formData = new FormData();
  formData.append('image', params.file);
  if (params.salesTier) {
    formData.append('sales_tier', params.salesTier);
  }

  const response = await fetch(`${API_BASE_URL}/gallery/references`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '上传失败' }));
    throw new Error(error.detail || '上传失败');
  }

  return response.json();
}

/**
 * 列出图库参考图
 */
export async function listReferences(params?: {
  style?: string;
  salesTier?: 'A' | 'B' | 'C';
  limit?: number;
}): Promise<{ success: boolean; items: GalleryReference[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.style) searchParams.set('style', params.style);
  if (params?.salesTier) searchParams.set('sales_tier', params.salesTier);
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const url = `/gallery/references${searchParams.toString() ? `?${searchParams}` : ''}`;
  return request(url);
}

/**
 * 获取参考图详情
 */
export async function getReference(refId: string): Promise<GalleryReference> {
  return request(`/gallery/references/${refId}`);
}

/**
 * 删除参考图
 */
export async function deleteReference(refId: string): Promise<{ success: boolean }> {
  return request(`/gallery/references/${refId}`, {
    method: 'DELETE',
  });
}

/**
 * 查找相似图片
 */
export async function findSimilar(params: {
  image: string;  // base64
  topK?: number;
  threshold?: number;
}): Promise<{
  success: boolean;
  similar: Array<{
    id: string;
    imageUrl: string;
    similarity: number;
    item: GalleryReference;
  }>;
}> {
  return request('/gallery/similar', {
    method: 'POST',
    body: JSON.stringify({
      image: params.image,
      top_k: params.topK || 5,
      threshold: params.threshold || 0.5,
    }),
  });
}

// 导出API对象
export const api = {
  healthCheck,
  generateDesign,
  analyzeImage,
  generateImage,
  chat,
  getSessionVersions,
  fileToBase64,
  // 图库管理
  uploadReference,
  listReferences,
  getReference,
  deleteReference,
  findSimilar,
};

export default api;
