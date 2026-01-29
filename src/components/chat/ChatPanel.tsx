import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types';

// 设计方案结构
interface DesignProposal {
  title: string;
  elements: {
    primary: string[];
    secondary: string[];
    hardware: string[];
  };
  style: string[];
  colors: string[];
  prompt: string;
}

// 解析消息中的设计方案
function parseDesignProposals(content: string): { text: string; proposals: DesignProposal[] } {
  const proposals: DesignProposal[] = [];
  let textContent = content;

  // 匹配 ```design ... ``` 代码块
  const designBlockRegex = /```design\s*([\s\S]*?)```/g;
  let match;

  while ((match = designBlockRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const proposal = JSON.parse(jsonStr) as DesignProposal;
      proposals.push(proposal);
      // 从文本中移除设计块（后面会单独渲染）
      textContent = textContent.replace(match[0], '');
    } catch (e) {
      console.warn('Failed to parse design proposal:', e);
    }
  }

  return { text: textContent.trim(), proposals };
}

// 助手消息组件 - 解析并渲染设计方案
function AssistantMessage({
  content,
  onGenerate,
  isGenerating,
}: {
  content: string;
  onGenerate?: (prompt: string) => void;
  isGenerating: boolean;
}) {
  const { text, proposals } = useMemo(() => parseDesignProposals(content), [content]);

  return (
    <div>
      {/* 普通文本内容 */}
      {text && (
        <div className="prose prose-sm prose-gray max-w-none
          prose-p:my-1 prose-p:leading-relaxed
          prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
          prose-headings:my-2 prose-headings:font-medium
          prose-strong:font-medium prose-strong:text-gray-800
          prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded-lg prose-pre:text-xs
        ">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}

      {/* 设计方案卡片 */}
      {proposals.map((proposal, index) => (
        <DesignProposalCard
          key={index}
          proposal={proposal}
          onGenerate={onGenerate || (() => {})}
          isGenerating={isGenerating}
        />
      ))}
    </div>
  );
}

// 设计方案卡片组件
function DesignProposalCard({
  proposal,
  onGenerate,
  isGenerating,
}: {
  proposal: DesignProposal;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}) {
  return (
    <div className="mt-3 p-3 bg-gradient-to-br from-violet-50 to-primary-50 rounded-xl border border-violet-100">
      {/* 方案标题 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{proposal.title}</span>
      </div>

      {/* 元素标签 */}
      <div className="space-y-1.5 mb-3">
        {/* 主体元素 */}
        {proposal.elements.primary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-400 mr-1">主体</span>
            {proposal.elements.primary.map((el, i) => (
              <span key={`p-${i}`} className="px-1.5 py-0.5 bg-primary-100 text-primary-600 text-[10px] rounded-full">
                {el}
              </span>
            ))}
          </div>
        )}

        {/* 辅助元素 */}
        {proposal.elements.secondary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-400 mr-1">辅助</span>
            {proposal.elements.secondary.map((el, i) => (
              <span key={`s-${i}`} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">
                {el}
              </span>
            ))}
          </div>
        )}

        {/* 五金配件 */}
        {proposal.elements.hardware.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-400 mr-1">五金</span>
            {proposal.elements.hardware.map((el, i) => (
              <span key={`h-${i}`} className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded-full">
                {el}
              </span>
            ))}
          </div>
        )}

        {/* 风格标签 */}
        {proposal.style.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-400 mr-1">风格</span>
            {proposal.style.map((s, i) => (
              <span key={`st-${i}`} className="px-1.5 py-0.5 bg-violet-100 text-violet-600 text-[10px] rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* 配色 */}
        {proposal.colors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-400 mr-1">配色</span>
            {proposal.colors.map((c, i) => (
              <span key={`c-${i}`} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] rounded-full">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Prompt 区域 + 生成按钮 */}
      <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 mb-1">Prompt</p>
          <p className="text-xs text-gray-600 line-clamp-2">{proposal.prompt}</p>
        </div>
        <button
          onClick={() => onGenerate(proposal.prompt)}
          disabled={isGenerating}
          className={`
            shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1
            ${isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-violet-500 text-white hover:bg-violet-600 shadow-sm hover:shadow'
            }
          `}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {isGenerating ? '生成中...' : '生成'}
        </button>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onDirectGenerate?: (prompt: string) => void;
  isProcessing: boolean;  // 图片生成中
  isChatting?: boolean;   // Agent 对话中
  suggestions?: string[];
}

export function ChatPanel({
  messages,
  onSendMessage,
  onDirectGenerate,
  isProcessing,
  isChatting = false,
  suggestions = ['我想设计一款海洋风挂饰', '帮我探索可爱风格的钥匙扣', '把贝壳换成水晶', '颜色改成蓝色']
}: ChatPanelProps) {
  const isDisabled = isProcessing || isChatting;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (input.trim() && !isDisabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleGenerate = () => {
    if (input.trim() && !isDisabled && onDirectGenerate) {
      onDirectGenerate(input.trim());
      setInput('');
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm mb-1">和我聊聊你的设计想法</p>
            <p className="text-gray-300 text-xs">探索新方向，或基于参考图精修</p>

            {/* 快捷建议 */}
            <div className="mt-6">
              <div className="flex flex-wrap justify-center gap-1.5">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="px-2.5 py-1 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] px-3 py-2 text-sm
                  ${message.role === 'user'
                    ? 'bg-primary-500 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white/60 text-gray-700 rounded-2xl rounded-bl-sm'
                  }
                `}
              >
                {message.status === 'thinking' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">思考中</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                ) : message.role === 'assistant' ? (
                  <AssistantMessage
                    content={message.content}
                    onGenerate={onDirectGenerate}
                    isGenerating={isProcessing}
                  />
                ) : (
                  message.content
                )}

                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="生成结果"
                    className="mt-2 rounded-lg max-w-full"
                  />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入栏 - 悬浮样式 */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="glass-subtle rounded-xl px-3 py-2 flex flex-col gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="描述你的设计想法..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none px-1"
            disabled={isDisabled}
          />
          <div className="flex items-center justify-between">
            <button
              className="text-gray-300 hover:text-gray-500 transition-colors"
              title="添加图片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5">
              {/* 直接生图按钮 */}
              {onDirectGenerate && (
                <button
                  onClick={handleGenerate}
                  disabled={!input.trim() || isDisabled}
                  className={`
                    shrink-0 px-3 h-7 text-xs font-medium rounded-lg transition-colors flex items-center gap-1
                    ${!input.trim() || isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-violet-500 text-white hover:bg-violet-600'
                    }
                  `}
                  title="直接使用输入内容作为提示词生成图片"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isProcessing ? '...' : '生图'}
                </button>
              )}
              {/* 发送给 Agent 对话按钮 */}
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isDisabled}
                className={`
                  shrink-0 px-3 h-7 text-xs font-medium rounded-lg transition-colors flex items-center gap-1
                  ${!input.trim() || isDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                  }
                `}
                title="发送给 Agent 进行对话"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {isChatting ? '...' : '对话'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
