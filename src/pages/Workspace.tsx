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

      // 生成系统消息，基于实际分析结果
      const primaryElements = analysis.elements.primary.map(el => el.type).join('、');
      const styleTags = analysis.style.tags.join('、');

      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `已分析参考图：检测到${primaryElements}等元素，风格为${styleTags}。${analysis.similarItems && analysis.similarItems.length > 0 ? `找到${analysis.similarItems.length}个相似产品。` : ''}请告诉我你想要的修改，例如：「替换主元素」或「调整配色」。`,
        timestamp: new Date(),
        status: 'complete'
      };
      setMessages([systemMessage]);
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

      const result = await api.chat({
        messages: chatMessages,
        session_id: sessionId || undefined,
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

      // 如果当前有选中的版本，更新该版本的对话快照
      if (currentVersionId && !isBlankMode) {
        const updatedMessages = [...messages, userMessage, assistantMessage];
        setVersions(prev => prev.map(v =>
          v.id === currentVersionId ? { ...v, messagesSnapshot: updatedMessages } : v
        ));
      }

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

    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `已选择 ${product.style} 风格的参考图。检测到元素：${product.elements.join('、')}。请告诉我你想要的修改。`,
      timestamp: new Date(),
      status: 'complete'
    };
    setMessages([systemMessage]);
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
  const handleSelectVersion = useCallback((versionId: string) => {
    setIsBlankMode(false);
    setCurrentVersionId(versionId);

    // 恢复该版本的对话历史快照
    const targetVersion = versions.find(v => v.id === versionId);
    if (targetVersion?.messagesSnapshot) {
      setMessages(targetVersion.messagesSnapshot);
    }
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
      // 直接调用文生图 API（无参考图）
      const result = await api.generateDesign({
        instruction: prompt,
        reference_image: referenceBase64 || undefined,
        session_id: sessionId || undefined,
        style_hint: activeStyle || undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.image_url) {
        if (!sessionId) {
          setSessionId(Date.now().toString());
        }

        // 创建新版本（稍后会更新对话快照）
        const newVersionId = `v${versions.length}`;
        const newVersion: ImageVersion = {
          id: newVersionId,
          url: result.image_url,
          timestamp: new Date(),
          instruction: prompt,
          analysis: result.analysis,
          messagesSnapshot: [...messages, userMessage],  // 先保存当前对话
        };

        setVersions(prev => [...prev, newVersion]);
        setCurrentVersionId(newVersion.id);
        setIsBlankMode(false);  // 退出空白模式

        // 如果生成结果没有附带分析，则主动调用分析 API
        if (!result.analysis) {
          setGenerationStep('analyzing');
          try {
            // 先尝试获取图片的 base64
            let imageBase64: string;
            try {
              imageBase64 = await urlToBase64(result.image_url);
            } catch (urlError) {
              console.error('图片转换失败，尝试直接使用URL:', urlError);
              // 如果 URL 是相对路径，尝试补全
              const fullUrl = result.image_url.startsWith('http')
                ? result.image_url
                : `${window.location.origin}${result.image_url}`;
              imageBase64 = await urlToBase64(fullUrl);
            }

            const analysisResult = await api.analyzeImage({
              image: imageBase64,
              include_similar: true,
            });
            setImageAnalysis(analysisResult);
            // 更新版本的分析结果
            setVersions(prev => prev.map(v =>
              v.id === newVersion.id ? { ...v, analysis: analysisResult } : v
            ));
          } catch (analysisError) {
            console.error('图像分析失败:', analysisError);
            // 即使分析失败也继续，不阻塞用户操作
          }
        } else {
          setImageAnalysis(result.analysis);
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
  }, [referenceBase64, sessionId, activeStyle, versions]);

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
