/**
 * 画布持久化服务
 * 以画布为单位存储设计历史
 */

import type { DesignCanvas } from '../types';

const STORAGE_KEY = 'design_canvases';
const CURRENT_CANVAS_KEY = 'current_canvas_id';

// 序列化画布（处理 Date 类型）
function serializeCanvas(canvas: DesignCanvas): string {
  return JSON.stringify({
    ...canvas,
    createdAt: canvas.createdAt.toISOString(),
    updatedAt: canvas.updatedAt.toISOString(),
    versions: canvas.versions.map(v => ({
      ...v,
      timestamp: v.timestamp.toISOString(),
    })),
    messages: canvas.messages.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    })),
  });
}

// 反序列化画布
function deserializeCanvas(data: any): DesignCanvas {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    versions: (data.versions || []).map((v: any) => ({
      ...v,
      timestamp: new Date(v.timestamp),
    })),
    messages: (data.messages || []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  };
}

// 加载所有画布
function loadCanvases(): DesignCanvas[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map(deserializeCanvas);
  } catch (e) {
    console.error('[CanvasService] Failed to load canvases:', e);
    return [];
  }
}

// 保存所有画布
function saveCanvases(canvases: DesignCanvas[]): void {
  try {
    const serialized = canvases.map(c => JSON.parse(serializeCanvas(c)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.error('[CanvasService] Failed to save canvases:', e);
  }
}

// 获取所有画布（按更新时间倒序）
export function getCanvases(): DesignCanvas[] {
  return loadCanvases().sort((a, b) =>
    b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

// 获取单个画布
export function getCanvas(id: string): DesignCanvas | null {
  const canvases = loadCanvases();
  return canvases.find(c => c.id === id) || null;
}

// 创建新画布
export function createCanvas(name?: string): DesignCanvas {
  const canvases = loadCanvases();
  const now = new Date();

  const newCanvas: DesignCanvas = {
    id: `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name || `画布 ${canvases.length + 1}`,
    createdAt: now,
    updatedAt: now,
    versions: [],
    currentVersionId: null,
    referenceImage: null,
    referenceBase64: null,
    messages: [],
    analysis: null,
  };

  canvases.unshift(newCanvas);
  saveCanvases(canvases);

  // 设为当前画布
  setCurrentCanvasId(newCanvas.id);

  console.log('[CanvasService] Created canvas:', newCanvas.id);
  return newCanvas;
}

// 保存/更新画布
export function saveCanvas(canvas: DesignCanvas): void {
  const canvases = loadCanvases();
  const index = canvases.findIndex(c => c.id === canvas.id);

  // 更新时间和缩略图
  const updatedCanvas: DesignCanvas = {
    ...canvas,
    updatedAt: new Date(),
    // 使用最新版本的图片作为缩略图
    thumbnail: canvas.versions.length > 0
      ? canvas.versions[canvas.versions.length - 1].url
      : undefined,
  };

  if (index >= 0) {
    canvases[index] = updatedCanvas;
  } else {
    canvases.unshift(updatedCanvas);
  }

  saveCanvases(canvases);
  console.log('[CanvasService] Saved canvas:', canvas.id);
}

// 删除画布
export function deleteCanvas(id: string): boolean {
  const canvases = loadCanvases();
  const filtered = canvases.filter(c => c.id !== id);

  if (filtered.length === canvases.length) {
    return false; // 未找到
  }

  saveCanvases(filtered);

  // 如果删除的是当前画布，清除当前画布 ID
  if (getCurrentCanvasId() === id) {
    setCurrentCanvasId(null);
  }

  console.log('[CanvasService] Deleted canvas:', id);
  return true;
}

// 获取当前画布 ID
export function getCurrentCanvasId(): string | null {
  return localStorage.getItem(CURRENT_CANVAS_KEY);
}

// 设置当前画布 ID
export function setCurrentCanvasId(id: string | null): void {
  if (id) {
    localStorage.setItem(CURRENT_CANVAS_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_CANVAS_KEY);
  }
}

// 获取画布统计
export function getCanvasStats() {
  const canvases = loadCanvases();
  return {
    total: canvases.length,
    totalVersions: canvases.reduce((sum, c) => sum + c.versions.length, 0),
    recentCount: canvases.filter(c => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return c.updatedAt.getTime() > dayAgo;
    }).length,
  };
}

// 导出服务对象
export const canvasService = {
  getCanvases,
  getCanvas,
  createCanvas,
  saveCanvas,
  deleteCanvas,
  getCurrentCanvasId,
  setCurrentCanvasId,
  getCanvasStats,
};

export default canvasService;
