/**
 * API 客户端服务
 * 纯前端模式：直接从浏览器调用 API，无需后端服务器
 */

import * as directApi from './directApi';
import { isApiConfigured } from './directApi';
import {
  getGalleryItems,
  getGalleryImageUrl as getStaticGalleryImageUrl,
} from './galleryService';
import {
  buildDesignSystemPrompt,
  getStyleInjection,
} from './presetsService';

import type {
  ProductType,
  StyleKey,
  DesignPreset,
  PresetListResponse,
  ProductTypePreset,
  StylePreset,
  DesignResponseV2,
  SeedItem,
  ExplorationBranch,
} from '../types';

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
  analysis?: ImageAnalysis;
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

export interface ChatContext {
  analysis?: ImageAnalysis;
  selected_style?: string;
}

export interface ChatResponse {
  message: string;
  session_id: string;
}

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2' | '4:5' | '5:4' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

// 风格类型定义
export type StyleHint =
  | 'ocean_kawaii'
  | 'bohemian'
  | 'bohemian_natural'
  | 'ocean_shell'
  | 'candy_playful'
  | 'dreamy_star'
  | 'minimalist'
  | 'vintage_elegant';

// ==================== 图库图片 URL ====================

/**
 * 构建图库图片的完整 URL（使用静态资源）
 */
export function getGalleryImageUrl(filename: string): string {
  return getStaticGalleryImageUrl(filename);
}

// ==================== API 请求函数 ====================

/**
 * 健康检查（检查 API 配置是否有效）
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  if (isApiConfigured()) {
    return { status: 'ok', service: 'frontend-direct' };
  }
  throw new Error('API 未配置');
}

/**
 * 生成设计（使用 directApi）
 */
export async function generateDesign(params: {
  instruction: string;
  reference_image?: string;
  session_id?: string;
  aspect_ratio?: AspectRatio;
  image_size?: ImageSize;
  style_hint?: StyleHint;
}): Promise<DesignResponse> {
  try {
    // 获取风格注入文本
    const styleInjection = params.style_hint
      ? getStyleInjection(params.style_hint)
      : '';

    // 构建 prompt
    let prompt = params.instruction;
    if (styleInjection) {
      prompt = `${styleInjection}\n\n${params.instruction}`;
    }

    // 准备参考图
    const referenceImages = params.reference_image
      ? [params.reference_image]
      : undefined;

    // 调用直接 API
    const result = await directApi.generateImage({
      prompt,
      referenceImages,
      size: params.image_size || '2K',
    });

    // 如果生成成功，分析结果图
    let analysis: ImageAnalysis | undefined;
    if (result.imageUrl) {
      try {
        // 将生成的图片转换为 base64 并分析
        const imageBase64 = await urlToBase64(result.imageUrl);
        const analysisText = await directApi.analyzeImage({
          imageBase64,
          prompt: '分析这个挂饰设计的元素、材质、风格和结构。返回 JSON 格式。',
        });

        // 尝试解析分析结果
        analysis = parseAnalysisResult(analysisText);
      } catch (e) {
        console.warn('[API] 图像分析失败，继续返回生成结果:', e);
      }
    }

    return {
      success: true,
      image_url: result.imageUrl,
      prompt_used: result.revisedPrompt || prompt,
      analysis,
      message: '生成成功',
    };
  } catch (error) {
    console.error('[API] 生成失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '生成失败',
    };
  }
}

/**
 * 分析图像（使用 directApi）
 */
export async function analyzeImage(params: {
  image: string;
  prompt?: string;
  include_similar?: boolean;
}): Promise<ImageAnalysis> {
  const systemPrompt = buildDesignSystemPrompt();

  const analysisPrompt = `${params.prompt || '分析这个挂饰设计的元素、材质、风格和结构。'}

请返回 JSON 格式：
{
  "elements": {
    "primary": [{"type": "元素名", "color": "颜色", "material": "材质"}],
    "secondary": [{"type": "元素名", "count": 数量}],
    "hardware": [{"type": "五金件名", "material": "材质"}]
  },
  "style": {
    "tags": ["风格标签1", "风格标签2"],
    "mood": "整体氛围描述"
  },
  "physicalSpecs": {
    "lengthCm": 估计长度,
    "weightG": 估计重量
  },
  "suggestions": ["建议1", "建议2"]
}`;

  const result = await directApi.analyzeImage({
    imageBase64: params.image,
    prompt: `${systemPrompt}\n\n${analysisPrompt}`,
  });

  // 解析 JSON 结果
  const analysis = parseAnalysisResult(result);

  // 如果需要相似图，从静态图库中查找
  if (params.include_similar) {
    const similarItems = findSimilarFromGallery(analysis);
    analysis.similarItems = similarItems;
  }

  return analysis;
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
  const result = await directApi.generateImage({
    prompt: params.prompt,
    referenceImages: params.reference_images,
    size: params.image_size || '2K',
  });

  return {
    image_url: result.imageUrl,
    prompt_used: result.revisedPrompt || params.prompt,
    metadata: {},
  };
}

/**
 * 与设计助手对话（使用 directApi）
 */
export async function chat(params: {
  messages: ChatMessage[];
  session_id?: string;
  context?: ChatContext;
}): Promise<ChatResponse> {
  const systemPrompt = buildDesignSystemPrompt(params.context?.selected_style);

  // 构建上下文信息
  let contextInfo = '';
  if (params.context?.analysis) {
    contextInfo = `\n\n当前分析结果：
- 主体元素：${params.context.analysis.elements.primary.map(e => e.type).join(', ')}
- 风格标签：${params.context.analysis.style.tags.join(', ')}
- 氛围：${params.context.analysis.style.mood}`;
  }

  const result = await directApi.chatCompletion({
    messages: params.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    systemPrompt: systemPrompt + contextInfo,
    temperature: 0.7,
    maxTokens: 2048,
  });

  return {
    message: result,
    session_id: params.session_id || Date.now().toString(),
  };
}

/**
 * 获取会话版本历史（前端模式下返回空）
 */
export async function getSessionVersions(_sessionId: string): Promise<{
  session_id: string;
  versions: Array<{
    instruction: string;
    prompt: string;
    image_url: string;
  }>;
}> {
  // 前端模式下，版本历史由 Workspace 组件管理
  return {
    session_id: _sessionId,
    versions: [],
  };
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
 * 将图片 URL 转换为 base64
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/xxx;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[urlToBase64] Failed to convert URL to base64:', error);
    throw error;
  }
}

// ==================== 图库管理（使用静态数据）====================

/**
 * 上传参考图到图库（前端模式暂不支持）
 */
export async function uploadReference(_params: {
  file: File;
  salesTier?: 'A' | 'B' | 'C';
}): Promise<{ success: boolean; reference: GalleryReference }> {
  throw new Error('前端模式暂不支持上传图片');
}

/**
 * 列出图库参考图（使用静态数据）
 */
export async function listReferences(params?: {
  style?: string;
  salesTier?: 'A' | 'B' | 'C';
  limit?: number;
}): Promise<{ success: boolean; items: GalleryReference[]; total: number }> {
  let items = getGalleryItems();

  // 按风格筛选
  if (params?.style) {
    items = items.filter(item =>
      item.analysis.style.tags.some(tag =>
        tag.toLowerCase().includes(params.style!.toLowerCase())
      )
    );
  }

  // 按销售等级筛选
  if (params?.salesTier) {
    items = items.filter(item => item.salesTier === params.salesTier);
  }

  // 限制数量
  if (params?.limit) {
    items = items.slice(0, params.limit);
  }

  // 转换为 GalleryReference 格式
  const references: GalleryReference[] = items.map(item => ({
    id: item.id,
    filename: item.filename,
    uploadTime: item.uploadTime,
    analysis: convertGalleryAnalysis(item.analysis),
    salesTier: item.salesTier as 'A' | 'B' | 'C',
  }));

  return {
    success: true,
    items: references,
    total: getGalleryItems().length,
  };
}

/**
 * 获取参考图详情
 */
export async function getReference(refId: string): Promise<GalleryReference> {
  const items = getGalleryItems();
  const item = items.find(i => i.id === refId);

  if (!item) {
    throw new Error('参考图不存在');
  }

  return {
    id: item.id,
    filename: item.filename,
    uploadTime: item.uploadTime,
    analysis: convertGalleryAnalysis(item.analysis),
    salesTier: item.salesTier as 'A' | 'B' | 'C',
  };
}

/**
 * 删除参考图（前端模式暂不支持）
 */
export async function deleteReference(_refId: string): Promise<{ success: boolean }> {
  throw new Error('前端模式暂不支持删除图片');
}

/**
 * 查找相似图片（从静态图库中基于风格标签匹配）
 */
export async function findSimilar(params: {
  image: string;
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
  // 先分析上传的图片
  const analysis = await analyzeImage({ image: params.image });

  // 从静态图库中查找相似
  const similarItems = findSimilarFromGallery(analysis, params.topK || 5);

  const items = getGalleryItems();
  const similar = similarItems.map(s => {
    const item = items.find(i => i.id === s.id);
    return {
      id: s.id,
      imageUrl: s.imageUrl,
      similarity: s.similarity,
      item: item ? {
        id: item.id,
        filename: item.filename,
        uploadTime: item.uploadTime,
        analysis: convertGalleryAnalysis(item.analysis),
        salesTier: item.salesTier as 'A' | 'B' | 'C',
      } : {} as GalleryReference,
    };
  });

  return {
    success: true,
    similar,
  };
}

// ==================== 预设系统（使用静态数据）====================

/**
 * 获取所有预设列表
 */
export async function getPresets(): Promise<PresetListResponse> {
  // 返回静态预设数据的结构
  return {
    success: true,
    product_types: [],
    styles: [],
  } as unknown as PresetListResponse;
}

/**
 * 获取所有产品类型预设
 */
export async function getProductTypes(): Promise<{
  success: boolean;
  product_types: ProductTypePreset[];
}> {
  const { getProductTypes: getTypes } = await import('./presetsService');
  const types = getTypes();
  return {
    success: true,
    product_types: types as unknown as ProductTypePreset[],
  };
}

/**
 * 获取所有风格预设
 */
export async function getStyles(): Promise<{
  success: boolean;
  styles: StylePreset[];
}> {
  const { getStylePresets } = await import('./presetsService');
  const styles = getStylePresets();
  return {
    success: true,
    styles: styles as unknown as StylePreset[],
  };
}

/**
 * 获取指定的组合预设
 */
export async function getPreset(
  _productType: ProductType,
  _style: StyleKey
): Promise<DesignPreset> {
  // 返回空预设
  return {} as DesignPreset;
}

/**
 * V2 设计生成
 */
export async function generateDesignV2(params: {
  instruction: string;
  reference_image?: string;
  session_id?: string;
  product_type?: ProductType;
  style_key?: StyleKey;
  include_similar?: boolean;
  image_size?: string;
}): Promise<DesignResponseV2> {
  const result = await generateDesign({
    instruction: params.instruction,
    reference_image: params.reference_image,
    session_id: params.session_id,
    style_hint: params.style_key as StyleHint,
    image_size: (params.image_size || '2K') as ImageSize,
  });

  return result as unknown as DesignResponseV2;
}

// ==================== 探索模式 API ====================

/**
 * 获取探索模式种子
 */
export async function fetchExplorationSeeds(_intent: string): Promise<SeedItem[]> {
  const result = await listReferences({ limit: 8 });

  if (!result.success || !result.items) {
    return [];
  }

  return result.items.map((item, index) => ({
    id: item.id,
    imageUrl: getGalleryImageUrl(item.filename),
    style: item.analysis?.style?.tags?.[0] || 'unknown',
    styleName: getStyleName(item.analysis?.style?.tags?.[0]),
    salesTier: item.salesTier,
    similarity: 0.95 - index * 0.05,
    tags: [
      ...(item.analysis?.elements?.primary?.map(e => e.type) || []),
      ...(item.analysis?.style?.tags?.slice(0, 2) || []),
    ].slice(0, 3),
  }));
}

/**
 * 风格名称映射
 */
function getStyleName(styleKey?: string): string {
  const styleNames: Record<string, string> = {
    ocean_kawaii: '海洋风少女系',
    bohemian: '波西米亚风',
    bohemian_natural: '波西米亚自然系',
    ocean_shell: '海洋贝壳系',
    candy_playful: '糖果童趣系',
    dreamy_star: '梦幻星空系',
    minimalist: '极简现代风',
    vintage_elegant: '复古典雅风',
    ocean: '海洋风',
    cute: '可爱风',
    natural: '自然风',
    '海洋风': '海洋风',
    '波西米亚': '波西米亚风',
    '少女系': '少女系',
  };
  return styleNames[styleKey || ''] || styleKey || '未知风格';
}

/**
 * 发散生成探索分支
 */
export async function generateExplorationBranches(params: {
  seedImageUrl: string;
  intent: string;
  count?: number;
}): Promise<ExplorationBranch[]> {
  const { seedImageUrl, intent, count = 4 } = params;

  let seedBase64: string;
  try {
    seedBase64 = await urlToBase64(seedImageUrl);
  } catch (error) {
    console.error('[generateExplorationBranches] Failed to convert seed image:', error);
    throw new Error('无法加载种子图片');
  }

  const generatePromises = Array.from({ length: count }, async (_, i) => {
    try {
      const result = await generateDesign({
        instruction: `${intent} (变体 ${i + 1})`,
        reference_image: seedBase64,
        image_size: '2K',
      });

      if (result.success && result.image_url) {
        return {
          id: `branch-${Date.now()}-${i}`,
          seedId: 'seed',
          imageUrl: result.image_url,
          prompt: intent,
          timestamp: new Date(),
        } as ExplorationBranch;
      }
      return null;
    } catch (error) {
      console.error(`[generateExplorationBranches] Branch ${i + 1} failed:`, error);
      return null;
    }
  });

  const results = await Promise.all(generatePromises);
  return results.filter((b): b is ExplorationBranch => b !== null);
}

// ==================== 辅助函数 ====================

/**
 * 转换图库分析格式为 API 格式
 */
function convertGalleryAnalysis(galleryAnalysis: {
  elements: { primary: unknown[]; secondary: unknown[]; hardware: unknown[] };
  style: { tags: string[]; mood: string };
  physicalSpecs: { lengthCm: number; weightG: number };
  suggestions: string[];
  similarItems?: string[] | null;
}): ImageAnalysis {
  return {
    elements: galleryAnalysis.elements as ImageAnalysis['elements'],
    style: galleryAnalysis.style,
    physicalSpecs: galleryAnalysis.physicalSpecs,
    suggestions: galleryAnalysis.suggestions,
    // similarItems 在图库格式中是 string[] 或 null，需要忽略或转换
    similarItems: undefined,
  };
}

/**
 * 解析分析结果 JSON
 */
function parseAnalysisResult(text: string): ImageAnalysis {
  try {
    // 尝试从文本中提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        elements: parsed.elements || { primary: [], secondary: [], hardware: [] },
        style: parsed.style || { tags: [], mood: '' },
        physicalSpecs: parsed.physicalSpecs || { lengthCm: 15, weightG: 10 },
        suggestions: parsed.suggestions || [],
      };
    }
  } catch (e) {
    console.warn('[parseAnalysisResult] JSON 解析失败，使用默认值:', e);
  }

  // 返回默认结构
  return {
    elements: { primary: [], secondary: [], hardware: [] },
    style: { tags: ['未识别'], mood: text.substring(0, 100) },
    physicalSpecs: { lengthCm: 15, weightG: 10 },
    suggestions: ['请提供更清晰的图片以获得更准确的分析'],
  };
}

/**
 * 从静态图库中查找相似项目（基于风格标签匹配）
 */
function findSimilarFromGallery(
  analysis: ImageAnalysis,
  topK: number = 5
): Array<{ id: string; imageUrl: string; similarity: number }> {
  const items = getGalleryItems();
  const inputTags = new Set(analysis.style.tags.map(t => t.toLowerCase()));

  // 计算每个图库项目与输入的相似度
  const scored = items.map(item => {
    const itemTags = new Set(item.analysis.style.tags.map(t => t.toLowerCase()));

    // 计算标签交集
    const intersection = [...inputTags].filter(t => itemTags.has(t)).length;
    const union = new Set([...inputTags, ...itemTags]).size;

    // Jaccard 相似度
    const similarity = union > 0 ? intersection / union : 0;

    return {
      id: item.id,
      imageUrl: getStaticGalleryImageUrl(item.filename),
      similarity: Math.round(similarity * 100) / 100,
    };
  });

  // 按相似度排序并返回前 K 个
  return scored
    .filter(s => s.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// 导出API对象
export const api = {
  healthCheck,
  generateDesign,
  generateDesignV2,
  analyzeImage,
  generateImage,
  chat,
  getSessionVersions,
  fileToBase64,
  urlToBase64,
  // 图库管理
  uploadReference,
  listReferences,
  getReference,
  deleteReference,
  findSimilar,
  // 预设系统
  getPresets,
  getProductTypes,
  getStyles,
  getPreset,
  // 探索模式
  fetchExplorationSeeds,
  generateExplorationBranches,
};

export default api;
