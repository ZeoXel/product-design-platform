/**
 * API 设置弹窗
 */
import { useState, useEffect } from 'react';
import { getApiSettings, saveApiSettings, type ApiSettings } from '../../store/apiSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<ApiSettings>(getApiSettings());
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettings(getApiSettings());
      setTestStatus('idle');
    }
  }, [isOpen]);

  const handleSave = () => {
    saveApiSettings(settings);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const response = await fetch(`${settings.apiBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setTestStatus('success');
        setTestMessage('连接成功');
      } else {
        setTestStatus('error');
        setTestMessage(`连接失败: ${response.status} ${response.statusText}`);
      }
    } catch (e) {
      setTestStatus('error');
      setTestMessage(`连接失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 pointer-events-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">API 设置</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-5">
            {/* 提示信息 */}
            <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-xl">
              <p className="font-medium mb-1">纯前端模式</p>
              <p className="text-blue-600">所有 API 调用直接从浏览器发起，无需后端服务器。API Key 仅存储在本地浏览器中。</p>
            </div>

            {/* API Base URL */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                API 地址
              </label>
              <input
                type="text"
                value={settings.apiBaseUrl}
                onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                placeholder="https://api.lsaigc.com/v1"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">支持 OpenAI 兼容的 API 地址</p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 模型配置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  生图模型
                </label>
                <select
                  value={settings.imageModel}
                  onChange={(e) => setSettings({ ...settings, imageModel: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="doubao-seedream-4-5-251128">即梦 4.5</option>
                  <option value="doubao-seedream-4-0-250828">即梦 4.0</option>
                  <option value="seedream-3.0">即梦 3.0</option>
                  <option value="nano-banana-2">Nano Banana 2</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  对话模型
                </label>
                <select
                  value={settings.chatModel}
                  onChange={(e) => setSettings({ ...settings, chatModel: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </select>
              </div>
            </div>

            {/* 测试连接 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || !settings.apiKey}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testStatus === 'testing' ? '测试中...' : '测试连接'}
              </button>
              {testStatus === 'success' && (
                <span className="text-sm text-emerald-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {testMessage}
                </span>
              )}
              {testStatus === 'error' && (
                <span className="text-sm text-red-600">{testMessage}</span>
              )}
            </div>
          </div>

          {/* 底部 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!settings.apiKey}
              className="px-5 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
