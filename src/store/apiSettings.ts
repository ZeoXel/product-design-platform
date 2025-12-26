/**
 * API 设置存储
 * 使用 localStorage 持久化用户的 API 配置
 */

export interface ApiSettings {
  // OpenAI 兼容 API 配置
  apiBaseUrl: string;
  apiKey: string;

  // 模型配置
  imageModel: string;
  chatModel: string;

  // 高级设置
  timeout: number;
}

const STORAGE_KEY = 'ai-design-api-settings';

const DEFAULT_SETTINGS: ApiSettings = {
  apiBaseUrl: 'https://api.lsaigc.com/v1',
  apiKey: '',
  imageModel: 'doubao-seedream-4-5-251128',
  chatModel: 'claude-3-5-sonnet-20240620',
  timeout: 180000,
};

/**
 * 获取 API 设置
 */
export function getApiSettings(): ApiSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('[ApiSettings] Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 保存 API 设置
 */
export function saveApiSettings(settings: Partial<ApiSettings>): void {
  try {
    const current = getApiSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 触发自定义事件，通知其他组件设置已更新
    window.dispatchEvent(new CustomEvent('api-settings-changed', { detail: updated }));
  } catch (e) {
    console.error('[ApiSettings] Failed to save settings:', e);
  }
}

/**
 * 检查 API 设置是否已配置
 */
export function isApiConfigured(): boolean {
  const settings = getApiSettings();
  return Boolean(settings.apiKey && settings.apiBaseUrl);
}

/**
 * 清除 API 设置
 */
export function clearApiSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('api-settings-changed', { detail: DEFAULT_SETTINGS }));
}

/**
 * React Hook: 监听设置变化
 */
export function useApiSettingsListener(callback: (settings: ApiSettings) => void): void {
  if (typeof window !== 'undefined') {
    const handler = (e: CustomEvent<ApiSettings>) => callback(e.detail);
    window.addEventListener('api-settings-changed', handler as EventListener);
  }
}
