/**
 * 前端直接调用 API 服务
 * 绕过后端，从浏览器直接调用 OpenAI 兼容 API
 */

import { getApiSettings } from '../store/apiSettings';

// ==================== 类型定义 ====================

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  image?: string[];  // 参考图 (base64 或 URL)
  response_format?: 'url' | 'b64_json';
  sequential_image_generation?: string;
  watermark?: boolean;
}

export interface ImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ==================== 核心 API 函数 ====================

/**
 * 获取请求头
 */
function getHeaders(): HeadersInit {
  const settings = getApiSettings();
  return {
    'Authorization': `Bearer ${settings.apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 获取 API 基础 URL
 */
function getBaseUrl(): string {
  const settings = getApiSettings();
  return settings.apiBaseUrl.replace(/\/$/, '');  // 移除末尾斜杠
}

/**
 * 生成图像 (Seedream / DALL-E 兼容)
 */
export async function generateImage(params: {
  prompt: string;
  referenceImages?: string[];
  size?: string;
  n?: number;
}): Promise<{ imageUrl: string; revisedPrompt?: string }> {
  const settings = getApiSettings();
  const baseUrl = getBaseUrl();

  const requestBody: ImageGenerationRequest = {
    model: settings.imageModel,
    prompt: params.prompt,
    n: params.n || 1,
    size: params.size || '2K',
    response_format: 'url',
    watermark: false,
  };

  // 添加参考图
  if (params.referenceImages && params.referenceImages.length > 0) {
    requestBody.image = params.referenceImages.map(img => {
      if (img.startsWith('http')) {
        return img;
      } else if (img.startsWith('data:')) {
        return img;
      } else {
        // 纯 base64，添加 data URI 前缀
        return `data:image/png;base64,${img}`;
      }
    });
    requestBody.sequential_image_generation = 'auto';
    console.log(`[DirectAPI] 图生图模式: ${requestBody.image.length} 张参考图`);
  } else {
    console.log('[DirectAPI] 文生图模式');
  }

  console.log(`[DirectAPI] 请求: model=${settings.imageModel}, size=${params.size}`);
  console.log(`[DirectAPI] Prompt: ${params.prompt.substring(0, 100)}...`);

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[DirectAPI] Error: ${response.status} ${response.statusText}`);
    console.error(`[DirectAPI] Response: ${errorText}`);
    throw new Error(`生成失败: ${response.status} ${response.statusText}`);
  }

  const data: ImageGenerationResponse = await response.json();
  console.log('[DirectAPI] 生成成功:', data);

  if (!data.data || data.data.length === 0) {
    throw new Error('生成失败: 未返回图像');
  }

  const imageUrl = data.data[0].url || '';
  const revisedPrompt = data.data[0].revised_prompt;

  return { imageUrl, revisedPrompt };
}

/**
 * 聊天补全 (Claude / GPT 兼容)
 */
export async function chatCompletion(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const settings = getApiSettings();
  const baseUrl = getBaseUrl();

  const messages: ChatMessage[] = [];

  // 添加系统提示
  if (params.systemPrompt) {
    messages.push({
      role: 'system',
      content: params.systemPrompt,
    });
  }

  // 添加对话消息
  messages.push(...params.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  })));

  const requestBody: ChatCompletionRequest = {
    model: settings.chatModel,
    messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 4096,
  };

  console.log(`[DirectAPI] Chat: model=${settings.chatModel}, messages=${messages.length}`);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[DirectAPI] Error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`对话失败: ${response.status} ${response.statusText}`);
  }

  const data: ChatCompletionResponse = await response.json();
  console.log('[DirectAPI] Chat 成功');

  return data.choices[0]?.message?.content || '';
}

/**
 * 分析图像 (使用 Vision 模型)
 */
export async function analyzeImage(params: {
  imageBase64: string;
  prompt?: string;
}): Promise<string> {
  const settings = getApiSettings();
  const baseUrl = getBaseUrl();

  const imageUrl = params.imageBase64.startsWith('data:')
    ? params.imageBase64
    : `data:image/png;base64,${params.imageBase64}`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: imageUrl },
        },
        {
          type: 'text',
          text: params.prompt || '请分析这张图片的内容、风格和元素。',
        },
      ],
    },
  ];

  const requestBody: ChatCompletionRequest = {
    model: settings.chatModel,
    messages,
    temperature: 0.3,
    max_tokens: 2048,
  };

  console.log(`[DirectAPI] Analyze: model=${settings.chatModel}`);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[DirectAPI] Error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`分析失败: ${response.status} ${response.statusText}`);
  }

  const data: ChatCompletionResponse = await response.json();
  console.log('[DirectAPI] Analyze 成功');

  return data.choices[0]?.message?.content || '';
}

/**
 * 增强 Prompt (使用 Chat 模型优化用户输入)
 */
export async function enhancePrompt(params: {
  userInstruction: string;
  referenceAnalysis?: string;
}): Promise<string> {
  const systemPrompt = `你是专业的配饰设计师。根据用户的描述，生成适合图像生成模型的英文 prompt。

要求：
1. 使用英文
2. 包含材质、颜色、风格描述
3. 明确产品类型（keychain, bag charm, phone strap 等）
4. 专业术语：shell, starfish, pearl, crystal, beads, tassel, lobster clasp 等
5. 保持简洁精炼，突出重点

${params.referenceAnalysis ? `参考图分析结果：\n${params.referenceAnalysis}` : ''}

直接输出优化后的英文 prompt，不需要解释。`;

  const result = await chatCompletion({
    messages: [{ role: 'user', content: params.userInstruction }],
    systemPrompt,
    temperature: 0.7,
    maxTokens: 500,
  });

  return result.trim();
}
