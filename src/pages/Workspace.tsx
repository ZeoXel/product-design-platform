import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from '../components/layout/Header';
import { ImagePreview } from '../components/preview/ImagePreview';
import { VersionBar } from '../components/preview/VersionBar';
import { ChatPanel } from '../components/chat/ChatPanel';
import { api, fileToBase64, urlToBase64 } from '../services/api';
import { ImageAnalysisPanel } from '../components/preview/ImageAnalysisPanel';
import { CompatibilityWarning } from '../components/chat/CompatibilityWarning';
import { CostPanelEnhanced } from '../components/cost/CostPanelEnhanced';
import { GalleryDrawer } from '../components/gallery/GalleryDrawer';
import { type HistoryItem } from '../services/historyService';
import { detectStyleFromTags, getStyleInfo, type StyleKey } from '../components/style/StyleSelector';
import type {
  ChatMessage,
  ImageVersion,
  ImageAnalysis,
  GenerationStep,
  CompatibilityCheck,
  CostBreakdown,
  ReferenceProduct,
  DesignCanvas,
} from '../types';

interface WorkspaceProps {
  onNavigate?: (page: 'workspace' | 'gallery' | 'history') => void;
  historyItem?: HistoryItem | null;
}

// 空白画布占位图（用于文生图模式的 v0）
const BLANK_CANVAS_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50' y='55' font-family='sans-serif' font-size='12' fill='%239ca3af' text-anchor='middle'%3E空白%3C/text%3E%3C/svg%3E";

/**
 * 生成树状版本号
 * - v0: 原始图
 * - 从 v0 分支: v1.0, v2.0, v3.0...
 * - 从 vX.0 分支: vX.1, vX.2, vX.3...
 * - 从 vX.Y 分支: vX.(Y+1), vX.(Y+2)...
 */
function generateVersionId(
  parentId: string | null,
  existingVersions: ImageVersion[]
): string {
  // 从 v0 分支，创建新的主版本
  if (!parentId || parentId === 'v0') {
    // 找出所有主版本号 (vX.0 格式)
    const mainVersions = existingVersions
      .filter(v => v.id.match(/^v(\d+)\.0$/))
      .map(v => parseInt(v.id.match(/^v(\d+)\.0$/)?.[1] || '0'));

    const maxMain = mainVersions.length > 0 ? Math.max(...mainVersions) : 0;
    return `v${maxMain + 1}.0`;
  }

  // 从 vX.Y 分支，创建该主版本下的新次版本
  const parentMatch = parentId.match(/^v(\d+)\.(\d+)$/);
  if (parentMatch) {
    const mainVersion = parseInt(parentMatch[1]);

    // 找出该主版本下所有次版本号
    const subVersions = existingVersions
      .filter(v => v.id.match(new RegExp(`^v${mainVersion}\\.(\\d+)$`)))
      .map(v => parseInt(v.id.match(/\.(\d+)$/)?.[1] || '0'));

    const maxSub = subVersions.length > 0 ? Math.max(...subVersions) : 0;
    return `v${mainVersion}.${maxSub + 1}`;
  }

  // 兜底：使用时间戳
  return `v${Date.now()}`;
}

export function Workspace({ onNavigate, historyItem }: WorkspaceProps = {}) {
  const [currentPage, setCurrentPage] = useState<'workspace' | 'gallery' | 'history'>('workspace');

  const handleNavigate = (page: 'workspace' | 'gallery' | 'history') => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      setCurrentPage(page);
    }
  };

  // 多画布管理
  const [canvases, setCanvases] = useState<DesignCanvas[]>([]);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [versions, setVersions] = useState<ImageVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  const [generationStep, setGenerationStep] = useState<GenerationStep>('idle');
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [compatibilityCheck, setCompatibilityCheck] = useState<CompatibilityCheck | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isEstimatingCost, _setIsEstimatingCost] = useState(false);
  const [generationError, setGenerationError] = useState<string | undefined>();
  const [userRating, setUserRating] = useState<number | undefined>();
  const [showRating, setShowRating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleKey | null>(null);
  const [isBlankMode, setIsBlankMode] = useState(false);  // 空白模式，用于文生图
  const [isChatting, setIsChatting] = useState(false);  // Agent 对话中（区别于图片生成）

  // 当前版本的分析结果（优先使用版本自带的分析，否则使用全局分析）
  const currentAnalysis = useMemo(() => {
    const current = versions.find(v => v.id === currentVersionId);
    return current?.analysis || imageAnalysis;
  }, [versions, currentVersionId, imageAnalysis]);

  // 从分析结果自动检测风格
  const detectedStyle = useMemo(() => {
    if (!currentAnalysis?.style.tags) return null;
    return detectStyleFromTags(currentAnalysis.style.tags);
  }, [currentAnalysis?.style.tags]);

  // 当前生效的风格（用户选择优先，否则使用检测结果）
  const activeStyle = selectedStyle || detectedStyle;

  React.useEffect(() => {
    api.healthCheck()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  // 从历史记录恢复
  useEffect(() => {
    if (historyItem) {
      setReferenceImage(historyItem.referenceUrl);
      setVersions(historyItem.versions || []);
      setCurrentVersionId(historyItem.versions?.[historyItem.versions.length - 1]?.id || null);
      setCostBreakdown(historyItem.costBreakdown || null);

      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `已恢复历史记录：「${historyItem.instruction}」。你可以继续在此基础上进行修改。`,
        timestamp: new Date(),
        status: 'complete'
      };
      setMessages([systemMessage]);
    }
  }, [historyItem]);

  const handleUpload = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setReferenceImage(url);

    let base64: string = '';
    try {
      base64 = await fileToBase64(file);
      setReferenceBase64(base64);
    } catch (e) {
      console.error('Failed to convert file to base64:', e);
      return; // 如果转换失败，直接返回
    }

    const initialVersion: ImageVersion = {
      id: 'v0',
      url,
      timestamp: new Date(),
      instruction: '原始参考图'
    };
    setVersions([initialVersion]);
    setCurrentVersionId('v0');

    // 调用真实的图像分析 API
    setGenerationStep('analyzing');

    try {
      const analysis = await api.analyzeImage({
        image: base64,
        include_similar: true,
      });

      setImageAnalysis(analysis);
      setGenerationStep('idle');

      // 更新 v0 版本，附加分析结果
      setVersions(prev => prev.map(v =>
        v.id === 'v0' ? { ...v, analysis } : v
      ));

      // 保持对话框初始状态，分析结果已在左侧面板显示
      setMessages([]);
    } catch (error) {
      console.error('图像分析失败:', error);
      setGenerationStep('idle');

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，图像分析失败。请重新上传或稍后再试。',
        timestamp: new Date(),
        status: 'error'
      };
      setMessages([errorMessage]);
    }
  }, []);

  // 对话模式：调用 chat API 进行对话，不直接生图
  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'complete'
    };
    setMessages(prev => [...prev, userMessage]);

    const thinkingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'thinking'
    };
    setMessages(prev => [...prev, thinkingMessage]);

    setIsChatting(true);  // 使用 isChatting 而非 isGenerating

    try {
      // 调用对话 API
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // 构建上下文，传递当前分析结果
      const chatContext = currentAnalysis ? {
        analysis: currentAnalysis,
        selected_style: selectedStyle || undefined,
      } : undefined;

      const result = await api.chat({
        messages: chatMessages,
        session_id: sessionId || undefined,
        context: chatContext,
      });

      if (!sessionId && result.session_id) {
        setSessionId(result.session_id);
      }

      // 更新 thinking 消息为 Agent 回复
      const assistantMessage: ChatMessage = {
        ...thinkingMessage,
        content: result.message,
        status: 'complete' as const,
      };

      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMessage.id ? assistantMessage : msg
      ));

      // 注意：不更新当前版本的 messagesSnapshot
      // 每个版本的快照在创建时固定，代表到达该版本的对话节点
      // 当前对话历史（messages）会在生成新版本时保存到新版本的快照中

    } catch (error) {
      console.error('对话失败:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMessage.id
          ? {
            ...msg,
            content: `抱歉，对话失败：${error instanceof Error ? error.message : '未知错误'}`,
            status: 'error' as const
          }
          : msg
      ));
    } finally {
      setIsChatting(false);
    }
  }, [messages, sessionId, currentVersionId, isBlankMode]);

  // 空白模式时不显示任何版本
  const currentVersion = isBlankMode ? null : (versions.find(v => v.id === currentVersionId) || null);

  const handleGallerySelect = useCallback(async (product: ReferenceProduct) => {
    setReferenceImage(product.imageUrl);
    setGenerationStep('analyzing');

    // 将图库图片 URL 转换为 base64，以便后续图生图使用
    try {
      const base64 = await urlToBase64(product.imageUrl);
      setReferenceBase64(base64);
      console.log('[Workspace] 图库图片已转换为 base64');
    } catch (error) {
      console.error('[Workspace] 图库图片转换失败:', error);
      // 转换失败时仍继续，但后续图生图可能使用 URL
      setReferenceBase64(null);
    }

    const mockAnalysis: ImageAnalysis = {
      elements: {
        primary: product.elements.map(el => ({ type: el })),
        secondary: [],
        hardware: [{ type: '标准五金', material: '合金' }]
      },
      style: {
        tags: [product.style],
        mood: product.style
      },
      physicalSpecs: {
        lengthCm: 18,
        weightG: 15
      },
      suggestions: ['可根据需求调整颜色或元素']
    };

    const initialVersion: ImageVersion = {
      id: 'v0',
      url: product.imageUrl,
      timestamp: new Date(),
      instruction: '从图库选择',
      analysis: mockAnalysis,  // 版本携带分析结果
    };
    setVersions([initialVersion]);
    setCurrentVersionId('v0');
    setImageAnalysis(mockAnalysis);
    setGenerationStep('idle');

    // 保持对话框初始状态，分析结果已在左侧面板显示
    setMessages([]);
  }, []);

  const handleCompatibilityContinue = useCallback(() => {
    setCompatibilityCheck(null);
  }, []);

  const handleCompatibilityCancel = useCallback(() => {
    setCompatibilityCheck(null);
    setIsGenerating(false);
    setGenerationStep('idle');
  }, []);

  const handleCompatibilityAlternative = useCallback((_element: string) => {
    setCompatibilityCheck(null);
  }, []);

  // 保存当前画布状态到 canvases 数组
  const saveCurrentCanvas = useCallback(() => {
    if (currentCanvasId && (versions.length > 0 || referenceImage)) {
      setCanvases(prev => prev.map(c =>
        c.id === currentCanvasId
          ? {
              ...c,
              versions,
              currentVersionId,
              referenceImage,
              referenceBase64,
              messages,
              analysis: imageAnalysis,
            }
          : c
      ));
    }
  }, [currentCanvasId, versions, currentVersionId, referenceImage, referenceBase64, messages, imageAnalysis]);

  // 创建新画布
  const handleCreateCanvas = useCallback(() => {
    // 先保存当前画布状态
    if (currentCanvasId) {
      saveCurrentCanvas();
    } else if (versions.length > 0 || referenceImage) {
      // 如果当前没有画布ID但有内容，先创建一个画布保存当前内容
      const firstCanvas: DesignCanvas = {
        id: `canvas-${Date.now() - 1}`,
        name: '画布 1',
        createdAt: new Date(),
        versions,
        currentVersionId,
        referenceImage,
        referenceBase64,
        messages,
        analysis: imageAnalysis,
      };
      setCanvases(prev => [...prev, firstCanvas]);
    }

    // 创建新的空白画布
    const newCanvas: DesignCanvas = {
      id: `canvas-${Date.now()}`,
      name: `画布 ${canvases.length + (versions.length > 0 || referenceImage ? 2 : 1)}`,
      createdAt: new Date(),
      versions: [],
      currentVersionId: null,
      referenceImage: null,
      referenceBase64: null,
      messages: [],
      analysis: null,
    };

    setCanvases(prev => [...prev, newCanvas]);
    setCurrentCanvasId(newCanvas.id);

    // 清空当前工作状态
    setReferenceImage(null);
    setReferenceBase64(null);
    setVersions([]);
    setCurrentVersionId(null);
    setImageAnalysis(null);
    setMessages([]);
    setCompatibilityCheck(null);
    setCostBreakdown(null);
    setGenerationStep('idle');
    setGenerationError(undefined);
    setUserRating(undefined);
    setShowRating(false);
    setSelectedStyle(null);
  }, [currentCanvasId, canvases.length, versions, currentVersionId, referenceImage, referenceBase64, messages, imageAnalysis, saveCurrentCanvas]);

  // 切换画布
  const handleSelectCanvas = useCallback((canvasId: string) => {
    if (canvasId === currentCanvasId) return;

    // 保存当前画布状态
    saveCurrentCanvas();

    // 加载目标画布状态
    const targetCanvas = canvases.find(c => c.id === canvasId);
    if (targetCanvas) {
      setCurrentCanvasId(canvasId);
      setVersions(targetCanvas.versions);
      setCurrentVersionId(targetCanvas.currentVersionId);
      setReferenceImage(targetCanvas.referenceImage);
      setReferenceBase64(targetCanvas.referenceBase64);
      setMessages(targetCanvas.messages);
      setImageAnalysis(targetCanvas.analysis);
      // 重置其他状态
      setCompatibilityCheck(null);
      setCostBreakdown(null);
      setGenerationStep('idle');
      setGenerationError(undefined);
      setUserRating(undefined);
      setShowRating(false);
    }
  }, [currentCanvasId, canvases, saveCurrentCanvas]);

  // 创建空白版本（进入文生图模式，但保留版本历史）
  const handleCreateBlankVersion = useCallback(() => {
    setIsBlankMode(true);
    setCurrentVersionId(null);
    setImageAnalysis(null);
    setCompatibilityCheck(null);
    setCostBreakdown(null);
    setGenerationStep('idle');
    setGenerationError(undefined);
    setShowRating(false);
    // 注意：不清空 versions，保留版本历史
  }, []);

  // 选择版本（退出空白模式，恢复该版本的对话历史）
  // 每个版本是一个对话节点，切换版本 = 回到该节点继续
  const handleSelectVersion = useCallback((versionId: string) => {
    setIsBlankMode(false);
    setCurrentVersionId(versionId);

    const targetVersion = versions.find(v => v.id === versionId);

    // 恢复该版本的对话历史快照（如果没有快照则清空，如 V0 原始图）
    setMessages(targetVersion?.messagesSnapshot || []);

    // 恢复该版本的分析结果
    if (targetVersion?.analysis) {
      setImageAnalysis(targetVersion.analysis);
    }
  }, [versions]);

  // 删除版本
  const handleDeleteVersion = useCallback((versionId: string) => {
    setVersions(prev => {
      const newVersions = prev.filter(v => v.id !== versionId);
      // 如果删除的是当前版本，切换到最后一个版本或进入空白模式
      if (currentVersionId === versionId) {
        if (newVersions.length > 0) {
          setCurrentVersionId(newVersions[newVersions.length - 1].id);
          setIsBlankMode(false);
        } else {
          setCurrentVersionId(null);
          setIsBlankMode(true);
        }
      }
      return newVersions;
    });
  }, [currentVersionId]);

  // 直接文生图（不经过 Agent 对话）
  const handleDirectGenerate = useCallback(async (prompt: string) => {
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `[直接生图] ${prompt}`,
      timestamp: new Date(),
      status: 'complete'
    };
    setMessages(prev => [...prev, userMessage]);

    // 纯文生图场景：如果没有任何版本且没有参考图，先创建空白 v0
    // v0 保存的是"生图前的对话状态"，这样用户可以回到这个节点重新尝试
    let workingVersions = versions;
    if (versions.length === 0 && !referenceBase64) {
      const blankV0: ImageVersion = {
        id: 'v0',
        url: BLANK_CANVAS_PLACEHOLDER,
        timestamp: new Date(),
        instruction: '空白画布',
        messagesSnapshot: [...messages],  // 保存生图前的对话历史
      };
      workingVersions = [blankV0];
      setVersions(workingVersions);
      console.log('[Generate] 纯文生图模式，创建空白 v0，保存对话历史:', messages.length, '条');
    }

    setIsGenerating(true);
    setProgress(0);
    setShowRating(false);
    setGenerationStep('generating');

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      // 简化逻辑：左侧显示什么图片，就用什么作为参考图
      // 空白状态 = 纯文生图
      let referenceImageToUse: string | undefined = undefined;

      // 计算当前左侧显示的版本（与 ImagePreview 显示一致）
      const displayedVersion = isBlankMode ? null : versions.find(v => v.id === currentVersionId);
      const displayedUrl = displayedVersion?.url;

      // 判断是否有有效的图片（排除空白占位符 SVG）
      const hasValidImage = displayedUrl && !displayedUrl.startsWith('data:image/svg');

      if (hasValidImage) {
        // 有图片：图生图模式
        // 外部 URL (http/https) 直接传给后端，避免 CORS 问题
        // 本地 blob/data URL 需要转换为 base64
        if (displayedUrl.startsWith('http')) {
          referenceImageToUse = displayedUrl;  // 直接传 URL
          console.log(`[Generate] 图生图模式，直接使用 URL: ${displayedUrl.substring(0, 50)}...`);
        } else if (displayedUrl.startsWith('blob:') || displayedUrl.startsWith('data:')) {
          try {
            referenceImageToUse = await urlToBase64(displayedUrl);
            console.log(`[Generate] 图生图模式，转换本地图片为 base64`);
          } catch (e) {
            console.error(`[Generate] 本地图片转换失败:`, e);
          }
        } else {
          // 其他格式尝试转换
          try {
            referenceImageToUse = await urlToBase64(displayedUrl);
            console.log(`[Generate] 图生图模式，使用版本 ${currentVersionId} 的图片`);
          } catch (e) {
            console.error(`[Generate] 图片转换失败:`, e, displayedUrl);
          }
        }
      } else {
        // 无图片：纯文生图模式
        console.log('[Generate] 纯文生图模式');
      }

      const result = await api.generateDesign({
        instruction: prompt,
        reference_image: referenceImageToUse,
        session_id: sessionId || undefined,
        style_hint: activeStyle || undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.image_url) {
        if (!sessionId) {
          setSessionId(Date.now().toString());
        }

        // 创建新版本（稀后会更新对话快照）
        // 使用树状版本号：从 v0 分支 → vX.0，从 vX.Y 分支 → vX.(Y+1)
        const parentId = currentVersionId;
        const newVersionId = generateVersionId(parentId, workingVersions);
        const newVersion: ImageVersion = {
          id: newVersionId,
          url: result.image_url,
          timestamp: new Date(),
          instruction: prompt,
          analysis: result.analysis,
          messagesSnapshot: [...messages, userMessage],  // 先保存当前对话
          parentId: parentId || 'v0',  // 记录父版本
        };

        setVersions(prev => [...prev, newVersion]);
        setCurrentVersionId(newVersion.id);
        setIsBlankMode(false);  // 退出空白模式

        // 处理分析结果（后端已在生成后分析图片）
        if (result.analysis) {
          setImageAnalysis(result.analysis);
          // 更新版本的分析结果
          setVersions(prev => prev.map(v =>
            v.id === newVersionId ? { ...v, analysis: result.analysis } : v
          ));
          console.log('[Generate] 使用后端返回的分析结果');
        } else {
          console.log('[Generate] 后端未返回分析结果');
        }

        // 添加成功消息（不在对话框显示图片，图片仅在左侧预览区展示）
        const successMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '✓ 设计已生成，请在左侧查看。你可以继续描述修改意见。',
          timestamp: new Date(),
          status: 'complete',
        };
        const updatedMessages = [...messages, userMessage, successMessage];
        setMessages(updatedMessages);

        // 更新版本的对话快照（包含成功消息）
        setVersions(prev => prev.map(v =>
          v.id === newVersionId ? { ...v, messagesSnapshot: updatedMessages } : v
        ));

        setGenerationStep('complete');
        setShowRating(true);
      } else {
        throw new Error(result.message || '生成失败');
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('直接生图失败:', error);
      setGenerationStep('error');
      setGenerationError(error instanceof Error ? error.message : '生成失败');

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `生成失败：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => prev.filter(m => m.status !== 'thinking').concat(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  }, [messages, currentVersionId, isBlankMode, referenceBase64, sessionId, activeStyle, versions]);

  return (
    <div className="h-screen flex flex-col bg-gradient-mesh">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1 overflow-hidden p-5">
        {/* 三栏布局 3:1:1 */}
        <div className="h-full flex gap-5">

          {/* 左栏 - 预览 (60%) */}
          <div className="flex-[3] min-w-0 relative">
            <div className="h-full glass rounded-3xl overflow-hidden">
              <ImagePreview
                currentImage={currentVersion}
                isGenerating={isGenerating}
                progress={progress}
                onUpload={handleUpload}
                onGalleryOpen={() => setIsGalleryOpen(true)}
                onExport={() => {}}
              />

              {/* 底部悬浮栏 */}
              {(versions.length > 0 || canvases.length > 0 || generationStep !== 'idle') && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-subtle rounded-xl px-4 h-12 flex items-center">
                    <VersionBar
                      canvases={canvases}
                      currentCanvasId={currentCanvasId || undefined}
                      onSelectCanvas={handleSelectCanvas}
                      onCreateCanvas={handleCreateCanvas}
                      versions={versions}
                      currentId={currentVersionId}
                      onSelect={handleSelectVersion}
                      onDelete={handleDeleteVersion}
                      onCreateBlankVersion={handleCreateBlankVersion}
                      isBlankMode={isBlankMode}
                      generationStep={generationStep}
                      error={generationError}
                      showRating={showRating}
                      userRating={userRating}
                      onRate={setUserRating}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 中栏 - 分析 (20%) */}
          <div className="flex-1 min-w-0 relative">
            <div className="h-full glass rounded-3xl overflow-hidden">
              <div className="h-full overflow-y-auto no-scrollbar p-4 pb-20 space-y-4">
                {/* 图像分析面板 */}
                {currentAnalysis ? (
                  <ImageAnalysisPanel
                    analysis={currentAnalysis}
                    isAnalyzing={generationStep === 'analyzing'}
                    versionId={currentVersionId || undefined}
                    similarItems={currentAnalysis.similarItems?.map(item => ({
                      id: item.id,
                      url: item.imageUrl,  // 相对路径由 Vite 代理处理
                      similarity: item.similarity
                    }))}
                    onStyleSelect={(style) => {
                      setSelectedStyle(style);
                      const styleInfo = getStyleInfo(style);
                      // 添加风格切换消息
                      const styleMessage: ChatMessage = {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `已切换到「${styleInfo.name}」风格。${styleInfo.description}。推荐配色：${styleInfo.colors.slice(0, 3).join('、')}。`,
                        timestamp: new Date(),
                        status: 'complete'
                      };
                      setMessages(prev => [...prev, styleMessage]);
                    }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 text-sm gap-2">
                    <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>上传图片后显示分析</span>
                  </div>
                )}
              </div>

              {/* 底部成本 */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass-subtle rounded-xl px-4 h-12 flex items-center">
                  <CostPanelEnhanced
                    breakdown={costBreakdown}
                    isEstimating={isEstimatingCost}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 右栏 - 对话 (20%) */}
          <div className="flex-1 min-w-0 relative">
            <div className="h-full glass rounded-3xl overflow-hidden">
              {compatibilityCheck && (
                <div className="absolute top-4 left-4 right-4 z-20">
                  <CompatibilityWarning
                    check={compatibilityCheck}
                    onContinue={handleCompatibilityContinue}
                    onCancel={handleCompatibilityCancel}
                    onSelectAlternative={handleCompatibilityAlternative}
                  />
                </div>
              )}
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onDirectGenerate={handleDirectGenerate}
                isProcessing={isGenerating}
                isChatting={isChatting}
              />
            </div>
          </div>

        </div>
      </main>

      {/* 底部状态栏 */}
      <footer className="h-7 px-6 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${apiConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {apiConnected ? 'API 已连接' : 'API 未连接'}
          </span>
          <span className="text-gray-300">·</span>
          <span>生成 {Math.max(0, versions.length - 1)} 次</span>
        </div>
        <span>API ¥{(Math.max(0, versions.length - 1) * 0.15).toFixed(2)}</span>
      </footer>

      {/* 图库抽屉 */}
      <GalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
      />
    </div>
  );
}
