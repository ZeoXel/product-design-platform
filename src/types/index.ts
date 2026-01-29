// 聊天消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'thinking' | 'complete' | 'error';
  imageUrl?: string;
}

// 生成的图片版本
export interface ImageVersion {
  id: string;
  url: string;
  timestamp: Date;
  instruction: string;
  analysis?: ImageAnalysis;  // 每个版本对应的分析结果
  messagesSnapshot?: ChatMessage[];  // 生成该版本时的对话历史快照
  parentId?: string;  // 父版本ID，用于树状版本结构
  base64?: string;  // 图片的base64数据（用于本地上传的图片，确保在URL失效时仍可使用）
}

// 成本明细
export interface CostBreakdown {
  materials: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  labor: {
    timeMinutes: number;
    hourlyRate: number;
    total: number;
  };
  apiCost: number;
  totalCost: number;
  currency: string;
}

// 图片分析结果
export interface ImageAnalysis {
  elements: {
    primary: { type: string; color?: string }[];
    secondary: { type: string; count?: number }[];
    hardware: { type: string; material?: string }[];
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
  similarItems?: {
    id: string;
    imageUrl: string;
    similarity: number;
  }[];
}

// 生成步骤
export type GenerationStep =
  | 'idle'
  | 'analyzing'
  | 'searching'
  | 'checking'
  | 'generating'
  | 'verifying'
  | 'complete'
  | 'error';

// 质量验证结果
export interface QualityResult {
  score: number;
  pass: boolean;
  checks: {
    label: string;
    status: 'pass' | 'warning' | 'fail';
    message?: string;
  }[];
}

// 兼容性检查结果
export interface CompatibilityCheck {
  compatible: boolean;
  score: number;
  targetElement: string;
  existingElements: string[];
  warnings?: string[];
  alternatives?: {
    element: string;
    score: number;
  }[];
}

// 参考图产品
export interface ReferenceProduct {
  id: string;
  imageUrl: string;
  elements: string[];
  style: string;
  salesTier: 'A' | 'B' | 'C' | 'D';
}

// ==================== V2 分层Prompt系统 ====================

// 产品类型枚举
export type ProductType =
  | 'keychain'
  | 'bag_charm'
  | 'phone_strap'
  | 'car_charm'
  | 'generic';

// 风格类型枚举
export type StyleKey =
  | 'ocean_kawaii'
  | 'vintage_bohemian'
  | 'minimalist_modern'
  | 'luxury_elegant'
  | 'cute_cartoon'
  | 'nature_botanical'
  | 'gothic_dark'
  | 'festive_holiday';

// 分层Prompt
export interface LayeredPrompt {
  identity: string;       // Layer 1: 产品身份锁定
  structure: string;      // Layer 2: 结构约束
  materials: string;      // Layer 3: 材质描述
  style: string;          // Layer 4: 风格定义
  modification: string;   // Layer 5: 用户修改
  technical: string;      // Layer 6: 技术参数
  negative: string;       // 负面提示词
  full_prompt: string;    // 组装后的完整prompt
  product_type: string;   // 使用的产品类型
  style_key: string;      // 使用的风格
}

// 色彩调色板
export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
}

// 产品类型预设
export interface ProductTypePreset {
  id: string;
  name: string;
  name_en: string;
  identity: string;
  typical_hardware: string[];
  typical_structure: string;
  default_length_cm: number[];
  description: string;
  icon: string;
}

// 风格预设
export interface StylePreset {
  id: string;
  name: string;
  name_en: string;
  keywords: string[];
  typical_materials: string[];
  color_palette: ColorPalette;
  mood_keywords: string[];
  style_injection: string;
  icon: string;
}

// 设计预设（组合产品类型 + 风格）
export interface DesignPreset {
  product_type: ProductTypePreset;
  style: StylePreset;
}

// 预设列表响应
export interface PresetListResponse {
  product_types: ProductTypePreset[];
  styles: StylePreset[];
}

// V2 生成请求
export interface GenerateRequestV2 {
  instruction: string;
  reference_image?: string;
  session_id?: string;
  product_type?: ProductType;
  style_key?: StyleKey;
  include_similar?: boolean;
  image_size?: string;
}

// V2 设计响应
export interface DesignResponseV2 {
  success: boolean;
  image_url: string;
  prompt_used: string;
  layered_prompt: LayeredPrompt;
  preset_used: DesignPreset;
  analysis?: ImageAnalysis;
  similar_items?: {
    id: string;
    imageUrl: string;
    similarity: number;
  }[];
  session_id: string;  // 后端返回的会话ID，用于后续请求
  message?: string;
  cost_estimate?: Record<string, unknown>;
}

// ==================== 画布与版本管理 ====================

// 设计画布（每个画布包含自己的版本列表）
export interface DesignCanvas {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  versions: ImageVersion[];
  currentVersionId: string | null;
  referenceImage: string | null;
  referenceBase64: string | null;
  messages: ChatMessage[];
  analysis: ImageAnalysis | null;
  // 元信息
  thumbnail?: string;  // 缩略图 URL（最新版本的图片）
  description?: string;  // 画布描述
  tags?: string[];  // 标签
}

// ==================== 探索模式类型 ====================

// 工作模式
export type WorkMode = 'refine' | 'explore';

// 探索模式 - 种子项
export interface SeedItem {
  id: string;
  imageUrl: string;
  style: string;
  styleName: string;
  salesTier: 'A' | 'B' | 'C';
  similarity: number;
  tags: string[];
}

// 探索模式 - 发散分支
export interface ExplorationBranch {
  id: string;
  seedId: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

