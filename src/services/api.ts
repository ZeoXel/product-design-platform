/**
 * API 客户端服务
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ==================== 类型定义 ====================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  analysis?: AnalysisResult;
  prompt_used?: string;
  message: string;
  cost_estimate?: {
    material: number;
    labor: number;
    total: number;
    currency: string;
  };
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
 * 分析图像
 */
export async function analyzeImage(params: {
  image: string;
  prompt?: string;
}): Promise<AnalysisResult> {
  return request('/analyze', {
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

// 导出API对象
export const api = {
  healthCheck,
  generateDesign,
  analyzeImage,
  generateImage,
  chat,
  getSessionVersions,
  fileToBase64,
};

export default api;
