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
