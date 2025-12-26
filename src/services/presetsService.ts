/**
 * 预设服务 - 前端静态数据
 */

import presetsData from '../data/presets.json';
import fewShotData from '../data/fewShotExamples.json';

// ==================== 类型定义 ====================

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

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
}

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

export interface FewShotExample {
  id: string;
  name: string;
  style: string;
  source_id: string;
  analysis: {
    primary: string[];
    secondary: string[];
    hardware: string[];
    structure: string;
    style_tags: string[];
  };
  ideal_prompt: string;
}

// ==================== 数据访问 ====================

const productTypes = presetsData.product_types as Record<string, ProductTypePreset>;
const stylePresets = presetsData.style_presets as Record<string, StylePreset>;
const fewShotExamples = fewShotData.examples as FewShotExample[];

/**
 * 获取所有产品类型
 */
export function getProductTypes(): ProductTypePreset[] {
  return Object.values(productTypes);
}

/**
 * 获取指定产品类型
 */
export function getProductType(id: string): ProductTypePreset | undefined {
  return productTypes[id];
}

/**
 * 获取所有风格预设
 */
export function getStylePresets(): StylePreset[] {
  return Object.values(stylePresets);
}

/**
 * 获取指定风格预设
 */
export function getStylePreset(id: string): StylePreset | undefined {
  return stylePresets[id];
}

/**
 * 获取 Few-shot 示例
 */
export function getFewShotExamples(styleId?: string): FewShotExample[] {
  if (styleId) {
    return fewShotExamples.filter(e => e.style === styleId);
  }
  return fewShotExamples;
}

/**
 * 根据关键词检测风格
 */
export function detectStyle(text: string): string | undefined {
  const keywords = presetsData.detection_rules.style_keywords as Record<string, string[]>;
  const lowerText = text.toLowerCase();

  for (const [styleId, styleKeywords] of Object.entries(keywords)) {
    for (const keyword of styleKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return styleId;
      }
    }
  }

  return undefined;
}

/**
 * 根据关键词检测产品类型
 */
export function detectProductType(text: string): string | undefined {
  const keywords = presetsData.detection_rules.product_type_keywords as Record<string, string[]>;
  const lowerText = text.toLowerCase();

  for (const [typeId, typeKeywords] of Object.entries(keywords)) {
    for (const keyword of typeKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return typeId;
      }
    }
  }

  return undefined;
}

/**
 * 构建设计 System Prompt
 */
export function buildDesignSystemPrompt(styleId?: string): string {
  const examples = getFewShotExamples(styleId).slice(0, 3);

  const examplesText = examples.map((ex, i) => `
【案例${i + 1}】${ex.name}
分析结果：
- 主体元素：${ex.analysis.primary.join(', ')}
- 辅助元素：${ex.analysis.secondary.join(', ')}
- 五金配件：${ex.analysis.hardware.join(', ')}
- 结构类型：${ex.analysis.structure}
- 风格标签：${ex.analysis.style_tags.join(', ')}

生成 Prompt：
${ex.ideal_prompt}
`).join('\n');

  return `你是专业的配饰设计师，专注于挂饰、钥匙扣、包挂等品类。

## 专业知识

**产品品类**：挂饰、钥匙扣、包挂、手机挂绳、车挂、耳机挂饰
**常见材料**：
- 主体元素：贝壳、天然石、水晶、亚克力、树脂、珍珠、玛瑙
- 辅助元素：玻璃珠、管珠、隔珠、流苏、编织绳、毛线球
- 五金配件：龙虾扣、钥匙环、登山扣、旋转扣、T针、9针、延长链、跳环

## 成功案例参考

${examplesText || '（暂无示例）'}

## 工作要求

1. **分析图片时**：准确识别元素品类、材质、颜色和数量
2. **生成 prompt 时**：参考上述成功案例的描述风格和结构
3. **垂类约束**：确保生成结果符合配饰形态，不要发散成其他品类
4. **英文 prompt**：使用英文生成 prompt，适合 AI 图像生成模型
5. **专业术语**：使用配饰行业的专业术语和描述方式`;
}

/**
 * 获取风格注入文本
 */
export function getStyleInjection(styleId: string): string {
  const style = stylePresets[styleId];
  return style?.style_injection || '';
}

/**
 * 获取产品类型标识
 */
export function getProductIdentity(productTypeId: string): string {
  const productType = productTypes[productTypeId];
  return productType?.identity || 'decorative charm';
}
