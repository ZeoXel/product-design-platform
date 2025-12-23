import React, { useState, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { ImagePreview } from '../components/preview/ImagePreview';
import { VersionBar } from '../components/preview/VersionBar';
import { ChatPanel } from '../components/chat/ChatPanel';
import { api, fileToBase64 } from '../services/api';
import { ImageAnalysisPanel } from '../components/preview/ImageAnalysisPanel';
import { CompatibilityWarning } from '../components/chat/CompatibilityWarning';
import { CostPanelEnhanced } from '../components/cost/CostPanelEnhanced';
import { GalleryDrawer } from '../components/gallery/GalleryDrawer';
import type {
  ChatMessage,
  ImageVersion,
  ImageAnalysis,
  GenerationStep,
  CompatibilityCheck,
  CostBreakdown,
  ReferenceProduct
} from '../types';

interface WorkspaceProps {
  onNavigate?: (page: 'workspace' | 'gallery' | 'history') => void;
}

export function Workspace({ onNavigate }: WorkspaceProps = {}) {
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

  React.useEffect(() => {
    api.healthCheck()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setReferenceImage(url);

    try {
      const base64 = await fileToBase64(file);
      setReferenceBase64(base64);
    } catch (e) {
      console.error('Failed to convert file to base64:', e);
    }

    const initialVersion: ImageVersion = {
      id: 'v0',
      url,
      timestamp: new Date(),
      instruction: '原始参考图'
    };
    setVersions([initialVersion]);
    setCurrentVersionId('v0');

    setGenerationStep('analyzing');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockAnalysis: ImageAnalysis = {
      elements: {
        primary: [
          { type: '贝壳', color: '粉色' },
          { type: '珍珠', color: '白色' }
        ],
        secondary: [
          { type: '小珠子', count: 12 }
        ],
        hardware: [
          { type: '龙虾扣', material: '合金' }
        ]
      },
      style: {
        tags: ['海洋风', '少女感', '夏日'],
        mood: '清新浪漫'
      },
      physicalSpecs: {
        lengthCm: 18,
        weightG: 15
      },
      suggestions: [
        '可尝试替换为水晶元素增加闪耀感',
        '添加金属链条可提升质感'
      ],
      similarItems: [
        { id: '1', imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=80&h=80&fit=crop', similarity: 92 },
        { id: '2', imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80&h=80&fit=crop', similarity: 85 }
      ]
    };
    setImageAnalysis(mockAnalysis);
    setGenerationStep('idle');

    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '已分析参考图：检测到贝壳、珍珠等海洋风元素。请告诉我你想要的修改，例如：「把粉色贝壳换成蓝色水晶」或「增加星星装饰」。',
      timestamp: new Date(),
      status: 'complete'
    };
    setMessages([systemMessage]);
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
        const result = await api.generateDesign({
          instruction: content,
          reference_image: referenceBase64 || undefined,
          session_id: sessionId || undefined,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (result.success && result.image_url) {
          if (!sessionId) {
            setSessionId(Date.now().toString());
          }

          const newVersion: ImageVersion = {
            id: `v${versions.length}`,
            url: result.image_url,
            timestamp: new Date(),
            instruction: content
          };

          setVersions(prev => [...prev, newVersion]);
          setCurrentVersionId(newVersion.id);

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
  }, [versions, referenceBase64, sessionId]);

  const currentVersion = versions.find(v => v.id === currentVersionId) || null;

  const handleGallerySelect = useCallback((product: ReferenceProduct) => {
    setReferenceImage(product.imageUrl);
    setReferenceBase64(null);

    const initialVersion: ImageVersion = {
      id: 'v0',
      url: product.imageUrl,
      timestamp: new Date(),
      instruction: '从图库选择'
    };
    setVersions([initialVersion]);
    setCurrentVersionId('v0');

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
    setImageAnalysis(mockAnalysis);

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

  const handleCompatibilityAlternative = useCallback((element: string) => {
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
              <div className="h-full overflow-y-auto no-scrollbar p-4 pb-20">
                {imageAnalysis ? (
                  <ImageAnalysisPanel
                    analysis={imageAnalysis}
                    isAnalyzing={generationStep === 'analyzing'}
                    similarItems={imageAnalysis.similarItems?.map(item => ({
                      id: item.id,
                      url: item.imageUrl,
                      similarity: item.similarity / 100
                    }))}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300 text-sm">
                    上传图片后显示分析
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
