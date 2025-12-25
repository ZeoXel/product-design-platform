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
import { addHistoryItem, type HistoryItem } from '../services/historyService';
import { detectStyleFromTags, getStyleInfo, type StyleKey } from '../components/style/StyleSelector';
import type {
  ChatMessage,
  ImageVersion,
  ImageAnalysis,
  GenerationStep,
  CompatibilityCheck,
  CostBreakdown,
  ReferenceProduct,
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
  const [isEstimatingCost, setIsEstimatingCost] = useState(false);
  const [generationError, setGenerationError] = useState<string | undefined>();
  const [userRating, setUserRating] = useState<number | undefined>();
  const [showRating, setShowRating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleKey | null>(null);

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

    setIsGenerating(true);
    setProgress(0);
    setShowRating(false);
    setUserRating(undefined);
    setCompatibilityCheck(null);
    setGenerationError(undefined);

    const simulateWorkflow = async () => {
      setGenerationStep('analyzing');
      await new Promise(resolve => setTimeout(resolve, 800));

      setGenerationStep('searching');
      await new Promise(resolve => setTimeout(resolve, 600));

      setGenerationStep('checking');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (Math.random() < 0.2) {
        const mockCheck: CompatibilityCheck = {
          compatible: true,
          score: 65,
          targetElement: content.match(/换成(.+?)(?:$|，|。)/)?.[1] || '新元素',
          existingElements: ['贝壳', '珍珠'],
          warnings: ['该元素组合在历史数据中出现较少', '建议进行小批量测试'],
          alternatives: [
            { element: '水晶珠', score: 88 },
            { element: '玻璃珠', score: 82 }
          ]
        };
        setCompatibilityCheck(mockCheck);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setCompatibilityCheck(null);

      setGenerationStep('generating');
      setProgress(0);

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
        // 使用自然语言模式的设计生成
        const result = await api.generateDesign({
          instruction: content,
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

          // 创建新版本，包含生成结果的分析
          const newVersion: ImageVersion = {
            id: `v${versions.length}`,
            url: result.image_url,
            timestamp: new Date(),
            instruction: content,
            analysis: result.analysis,  // 保存版本对应的分析结果
          };

          setVersions(prev => [...prev, newVersion]);
          setCurrentVersionId(newVersion.id);

          // 更新全局分析状态（用于兼容）
          if (result.analysis) {
            setImageAnalysis(result.analysis);
          }

          setIsEstimatingCost(true);
          await new Promise(resolve => setTimeout(resolve, 500));

          const mockCost: CostBreakdown = {
            materials: [
              { name: '主材料', quantity: 1, unitPrice: 8.5, total: 8.5 },
              { name: '配件', quantity: 3, unitPrice: 1.2, total: 3.6 },
              { name: '五金', quantity: 1, unitPrice: 2.0, total: 2.0 }
            ],
            labor: {
              timeMinutes: 25,
              hourlyRate: 30,
              total: 12.5
            },
            apiCost: 0.15,
            totalCost: 26.75,
            currency: 'CNY'
          };
          setCostBreakdown(mockCost);
          setIsEstimatingCost(false);

          setGenerationStep('complete');
          setShowRating(true);
          setUserRating(undefined);

          // 保存到历史记录
          const updatedVersions = [...versions, newVersion];
          addHistoryItem({
            timestamp: new Date(),
            instruction: content,
            referenceUrl: referenceImage || '',
            generatedUrl: result.image_url,
            versions: updatedVersions,
            versionsCount: updatedVersions.length,
            status: 'success',
            cost: mockCost.apiCost,
            costBreakdown: mockCost,
          });

          setMessages(prev => prev.map(msg =>
            msg.id === thinkingMessage.id
              ? {
                ...msg,
                content: `已完成「${content}」的修改。\n\n你可以继续调整，或点击「导出」保存设计。`,
                status: 'complete' as const
              }
              : msg
          ));
        } else {
          setGenerationStep('error');
          setGenerationError(result.message);
          setMessages(prev => prev.map(msg =>
            msg.id === thinkingMessage.id
              ? {
                ...msg,
                content: `抱歉，生成失败：${result.message}。请稍后重试。`,
                status: 'complete' as const
              }
              : msg
          ));
        }
      } catch (error) {
        clearInterval(progressInterval);
        setGenerationStep('error');
        setGenerationError(error instanceof Error ? error.message : '未知错误');
        setMessages(prev => prev.map(msg =>
          msg.id === thinkingMessage.id
            ? {
              ...msg,
              content: `抱歉，发生错误：${error instanceof Error ? error.message : '未知错误'}。请检查网络连接后重试。`,
              status: 'complete' as const
            }
            : msg
        ));
      }
    };

    await simulateWorkflow();
    setIsGenerating(false);
    setProgress(0);
  }, [versions, referenceBase64, sessionId, activeStyle, referenceImage]);

  const currentVersion = versions.find(v => v.id === currentVersionId) || null;

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
              {(versions.length > 0 || generationStep !== 'idle') && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-subtle rounded-xl px-4 h-12 flex items-center">
                    <VersionBar
                      versions={versions}
                      currentId={currentVersionId}
                      onSelect={setCurrentVersionId}
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
                isProcessing={isGenerating}
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
