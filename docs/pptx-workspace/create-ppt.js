const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/g/.claude/plugins/cache/anthropic-agent-skills/document-skills/f06b1c0701b2/document-skills/pptx/scripts/html2pptx');
const fs = require('fs');
const path = require('path');

// 浅色风格配色
const colors = {
  primary: '3B82F6',      // 专业蓝
  primaryDark: '1E3A8A',  // 深蓝
  text: '1E293B',         // 深灰文字
  textLight: '64748B',    // 次要文字
  bg: 'FFFFFF',           // 白色背景
  bgLight: 'F1F5F9',      // 浅灰背景
  border: 'E2E8F0',       // 边框
  accent: '0EA5E9',       // 强调色
};

const slidesDir = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/slides';

// 幻灯片内容
const slides = [
  // 封面页
  {
    name: 'slide01-cover',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #ffffff; }
.header-bar { position: absolute; top: 0; left: 0; right: 0; height: 8pt; background: #3B82F6; }
.title { font-size: 42pt; color: #1E293B; font-weight: bold; margin-bottom: 20pt; text-align: center; }
.subtitle { font-size: 22pt; color: #3B82F6; margin-bottom: 40pt; text-align: center; }
.tagline { font-size: 14pt; color: #64748B; text-align: center; max-width: 500pt; line-height: 1.6; }
.bottom-bar { position: absolute; bottom: 30pt; left: 50pt; right: 50pt; border-top: 1pt solid #E2E8F0; padding-top: 15pt; }
.company { font-size: 11pt; color: #94A3B8; text-align: center; }
</style></head>
<body>
<div class="header-bar"></div>
<h1 class="title">AI 挂饰设计平台</h1>
<p class="subtitle">自进化的智能设计系统</p>
<p class="tagline">传统 AI 绘图工具的问题在于：用户不满意只能重新生成，每次从零开始，知识无法沉淀。我们构建的是一套持续学习的闭环系统——用得越多，越懂您的设计需求。</p>
<div class="bottom-bar"><p class="company">方案展示</p></div>
</body></html>`
  },

  // 第一页：行业痛点
  {
    name: 'slide02-pain-points',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 25pt 30pt; flex: 1; display: flex; gap: 25pt; }
.left { flex: 1; }
.right { flex: 1; }
.section-title { font-size: 14pt; color: #1E3A8A; font-weight: bold; margin-bottom: 12pt; border-left: 4pt solid #3B82F6; padding-left: 10pt; }
.flow-box { background: #F1F5F9; border-radius: 6pt; padding: 12pt; margin-bottom: 15pt; }
.flow-text { font-size: 10pt; color: #1E293B; line-height: 1.5; margin: 0; }
.flow-highlight { font-size: 10pt; color: #DC2626; font-weight: bold; }
.table-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; overflow: hidden; }
.table-header { background: #1E3A8A; padding: 8pt 12pt; display: flex; }
.table-header p { font-size: 10pt; color: #ffffff; font-weight: bold; margin: 0; flex: 1; }
.table-row { padding: 8pt 12pt; display: flex; border-bottom: 1pt solid #E2E8F0; }
.table-row:last-child { border-bottom: none; }
.table-cell { font-size: 9pt; color: #1E293B; margin: 0; flex: 1; }
.table-cell-bold { font-size: 9pt; color: #1E3A8A; font-weight: bold; margin: 0; flex: 1; }
</style></head>
<body>
<div class="header"><h1>现有 AI 设计工具的根本缺陷</h1></div>
<div class="content">
<div class="left">
<p class="section-title">通用 AI 绘图的困境</p>
<div class="flow-box">
<p class="flow-text">传统模式流程：</p>
<p class="flow-text">用户 → 提示词 → 黑盒模型 → 结果</p>
<p class="flow-highlight">↑ 断裂点：用户不满意只能重写提示词</p>
<p class="flow-text">知识无法沉淀，每次从零开始</p>
</div>
<p class="section-title">核心问题</p>
<p class="flow-text">通用 AI 绘图工具是"一次性"的。每次生成都是独立的，系统不会记住您的偏好，不会学习什么样的设计更受欢迎。</p>
</div>
<div class="right">
<p class="section-title">挂饰设计的特殊挑战</p>
<div class="table-box">
<div class="table-header"><p>挑战类型</p><p>具体表现</p></div>
<div class="table-row"><p class="table-cell-bold">物理约束</p><p class="table-cell">材料属性、工艺可行性、承重限制</p></div>
<div class="table-row"><p class="table-cell-bold">风格一致性</p><p class="table-cell">元素搭配协调、整体美感把控</p></div>
<div class="table-row"><p class="table-cell-bold">商业适配</p><p class="table-cell">目标人群匹配、季节趋势把握</p></div>
<div class="table-row"><p class="table-cell-bold">迭代效率</p><p class="table-cell">反复修改耗时、沟通成本高</p></div>
</div>
</div>
</div>
</body></html>`
  },

  // 第二页：解决方案概览
  {
    name: 'slide03-solution',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 20pt 30pt; flex: 1; }
.subtitle { font-size: 14pt; color: #1E3A8A; font-weight: bold; margin-bottom: 15pt; }
.flow-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 15pt; margin-bottom: 18pt; }
.flow-row { display: flex; align-items: center; justify-content: center; gap: 8pt; margin-bottom: 8pt; }
.flow-box { background: #3B82F6; color: white; padding: 6pt 12pt; border-radius: 4pt; font-size: 9pt; }
.flow-arrow { color: #64748B; font-size: 12pt; }
.flow-feedback { display: flex; justify-content: center; gap: 20pt; margin-top: 8pt; }
.feedback-item { background: #0EA5E9; color: white; padding: 5pt 10pt; border-radius: 4pt; font-size: 8pt; }
.arch-title { font-size: 12pt; color: #1E3A8A; font-weight: bold; margin: 15pt 0 10pt 0; }
.arch-table { display: flex; gap: 15pt; }
.arch-card { flex: 1; background: #F1F5F9; border-radius: 6pt; padding: 12pt; border-left: 3pt solid #3B82F6; }
.arch-card-title { font-size: 11pt; color: #1E3A8A; font-weight: bold; margin: 0 0 6pt 0; }
.arch-card-subtitle { font-size: 9pt; color: #64748B; margin: 0 0 4pt 0; }
.arch-card-text { font-size: 9pt; color: #1E293B; margin: 0; }
</style></head>
<body>
<div class="header"><h1>自进化设计系统 — 范式转变</h1></div>
<div class="content">
<p class="subtitle">核心理念：从"单次生成"到"持续学习闭环"</p>
<div class="flow-container">
<div class="flow-row">
<p class="flow-box">用户意图</p><p class="flow-arrow">→</p>
<p class="flow-box">知识检索</p><p class="flow-arrow">→</p>
<p class="flow-box">Prompt编排</p><p class="flow-arrow">→</p>
<p class="flow-box">图像生成</p><p class="flow-arrow">→</p>
<p class="flow-box">质量评估</p>
</div>
<div class="flow-feedback">
<p class="feedback-item">选择行为反馈</p>
<p class="feedback-item">知识库更新</p>
<p class="feedback-item">Prompt优化 + Agent进化</p>
</div>
</div>
<p class="arch-title">三层技术架构</p>
<div class="arch-table">
<div class="arch-card">
<p class="arch-card-title">应用层</p>
<p class="arch-card-subtitle">用户交互</p>
<p class="arch-card-text">多模式输入、实时反馈采集</p>
</div>
<div class="arch-card">
<p class="arch-card-title">智能层</p>
<p class="arch-card-subtitle">Agent 决策</p>
<p class="arch-card-text">知识图谱查询、Prompt动态编排、兼容性检查</p>
</div>
<div class="arch-card">
<p class="arch-card-title">执行层</p>
<p class="arch-card-subtitle">图像生成</p>
<p class="arch-card-text">多模型调度、质量预检、结果评估</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第三页：双模式设计能力
  {
    name: 'slide04-dual-mode',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.mode-card { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 15pt; }
.mode-title { font-size: 14pt; color: #1E3A8A; font-weight: bold; margin: 0 0 8pt 0; }
.mode-subtitle { font-size: 10pt; color: #64748B; margin: 0 0 12pt 0; }
.mode-flow { background: #ffffff; border-radius: 4pt; padding: 10pt; margin-bottom: 10pt; }
.flow-step { display: flex; align-items: center; gap: 6pt; margin-bottom: 4pt; }
.step-box { background: #3B82F6; color: white; padding: 4pt 8pt; border-radius: 3pt; font-size: 8pt; }
.step-arrow { color: #94A3B8; font-size: 10pt; }
.advantage-title { font-size: 10pt; color: #1E3A8A; font-weight: bold; margin: 8pt 0 6pt 0; }
.advantage-item { font-size: 9pt; color: #1E293B; margin: 0 0 3pt 0; padding-left: 12pt; }
</style></head>
<body>
<div class="header"><h1>精确修改 + 探索创新，双轮驱动</h1></div>
<div class="content">
<div class="mode-card">
<p class="mode-title">模式一：图生图</p>
<p class="mode-subtitle">基于参考的精确编辑</p>
<div class="mode-flow">
<div class="flow-step"><p class="step-box">上传参考图</p><p class="step-arrow">→</p><p class="step-box">对话式修改</p><p class="step-arrow">→</p><p class="step-box">精确输出</p></div>
<p style="font-size: 8pt; color: #64748B; margin: 6pt 0 0 0; text-align: center;">适用：已有设计基础，需要局部调整</p>
</div>
<p class="advantage-title">核心优势</p>
<p class="advantage-item">✓ 继承参考图的物理结构和工艺可行性</p>
<p class="advantage-item">✓ 只修改指定部分，其他保持不变</p>
<p class="advantage-item">✓ 渐进式迭代，2-3次达到满意</p>
</div>
<div class="mode-card">
<p class="mode-title">模式二：文生图</p>
<p class="mode-subtitle">智能参考匹配探索</p>
<div class="mode-flow">
<div class="flow-step"><p class="step-box">描述需求</p><p class="step-arrow">→</p><p class="step-box">智能匹配参考</p><p class="step-arrow">→</p><p class="step-box">多方案输出</p></div>
<p style="font-size: 8pt; color: #64748B; margin: 6pt 0 0 0; text-align: center;">适用：创意探索阶段，不确定具体方向</p>
</div>
<p class="advantage-title">核心优势</p>
<p class="advantage-item">✓ 自动从图库检索最匹配的参考图</p>
<p class="advantage-item">✓ 结合参考特征生成新设计</p>
<p class="advantage-item">✓ 输出多个差异化方案供探索</p>
<p class="advantage-item">✓ 兼顾创意发散和可行性约束</p>
</div>
</div>
</body></html>`
  },

  // 第四页：对话式精确编辑
  {
    name: 'slide05-dialog-edit',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left { flex: 1.2; }
.right { flex: 1; }
.section-title { font-size: 12pt; color: #1E3A8A; font-weight: bold; margin-bottom: 10pt; }
.dialog-box { background: #F1F5F9; border-radius: 6pt; padding: 10pt; margin-bottom: 8pt; }
.user-msg { font-size: 9pt; color: #1E293B; margin: 0 0 6pt 0; }
.user-msg span { background: #3B82F6; color: white; padding: 2pt 6pt; border-radius: 3pt; font-size: 8pt; margin-right: 6pt; }
.agent-step { font-size: 8pt; color: #64748B; margin: 2pt 0 2pt 20pt; }
.result-box { background: #0EA5E9; color: white; padding: 4pt 8pt; border-radius: 3pt; font-size: 8pt; margin-top: 6pt; display: inline-block; }
.table-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; overflow: hidden; }
.table-header { background: #1E3A8A; padding: 6pt 10pt; display: flex; }
.table-header p { font-size: 9pt; color: #ffffff; font-weight: bold; margin: 0; }
.th1 { flex: 1.2; }
.th2 { flex: 1.8; }
.table-row { padding: 5pt 10pt; display: flex; border-bottom: 1pt solid #E2E8F0; }
.table-row:last-child { border-bottom: none; }
.td1 { flex: 1.2; font-size: 8pt; color: #1E293B; margin: 0; }
.td2 { flex: 1.8; font-size: 8pt; color: #64748B; margin: 0; }
</style></head>
<body>
<div class="header"><h1>自然语言控制，精确到每个元素</h1></div>
<div class="content">
<div class="left">
<p class="section-title">对话式迭代流程</p>
<div class="dialog-box">
<p class="user-msg"><span>用户</span>"把粉色贝壳换成水晶"</p>
<p class="agent-step">→ Agent 解析：替换操作，目标=贝壳，新元素=水晶</p>
<p class="agent-step">→ 知识库查询：水晶变体、兼容性检查、物理约束</p>
<p class="agent-step">→ Prompt 编排：动态生成最优 Prompt</p>
<p class="result-box">生成图片 v1</p>
</div>
<div class="dialog-box">
<p class="user-msg"><span>用户</span>"水晶大一点，更闪亮些"</p>
<p class="agent-step">→ Agent 解析：修改操作，scale=1.3，brightness=+20%</p>
<p class="result-box">基于 v1 精确调整，生成 v2</p>
</div>
</div>
<div class="right">
<p class="section-title">语义理解能力</p>
<div class="table-container">
<div class="table-header"><p class="th1">用户表达</p><p class="th2">执行操作</p></div>
<div class="table-row"><p class="td1">"贝壳大一点"</p><p class="td2">只放大贝壳，保持其他元素</p></div>
<div class="table-row"><p class="td1">"整体更温暖"</p><p class="td2">调整色调，不改变结构</p></div>
<div class="table-row"><p class="td1">"换成蓝色系"</p><p class="td2">智能替换配色方案</p></div>
<div class="table-row"><p class="td1">"简化一下"</p><p class="td2">移除次要装饰元素</p></div>
<div class="table-row"><p class="td1">"更精致一些"</p><p class="td2">提升细节精细度</p></div>
<div class="table-row"><p class="td1">"风格再甜一点"</p><p class="td2">增加可爱元素特征</p></div>
</div>
</div>
</div>
</body></html>`
  },

  // 第五页：智能参考图库
  {
    name: 'slide06-reference-lib',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left { flex: 1; }
.right { flex: 1.2; }
.section-title { font-size: 12pt; color: #1E3A8A; font-weight: bold; margin-bottom: 10pt; }
.compare-box { display: flex; gap: 10pt; margin-bottom: 12pt; }
.compare-item { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 10pt; }
.compare-title { font-size: 10pt; color: #64748B; margin: 0 0 6pt 0; }
.compare-content { font-size: 8pt; color: #1E293B; margin: 0; line-height: 1.4; }
.compare-item.highlight { background: #EFF6FF; border-color: #3B82F6; }
.compare-item.highlight .compare-title { color: #1E3A8A; font-weight: bold; }
.meta-box { background: #F1F5F9; border-radius: 6pt; padding: 10pt; font-family: Courier New, monospace; }
.meta-line { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.meta-key { color: #1E3A8A; }
.flow-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 12pt; margin-top: 10pt; }
.flow-title { font-size: 10pt; color: #1E3A8A; font-weight: bold; margin: 0 0 8pt 0; }
.flow-step { font-size: 8pt; color: #1E293B; margin: 4pt 0; padding-left: 10pt; }
</style></head>
<body>
<div class="header"><h1>结构化知识资产，驱动精准生成</h1></div>
<div class="content">
<div class="left">
<p class="section-title">从"图片集合"到"知识资产"</p>
<div class="compare-box">
<div class="compare-item">
<p class="compare-title">传统图库</p>
<p class="compare-content">image_001.jpg<br/>image_002.jpg<br/>...<br/>(只有图片文件)</p>
</div>
<div class="compare-item highlight">
<p class="compare-title">结构化图库</p>
<p class="compare-content">image.jpg ← 视觉资产<br/>elements: [贝壳,海星]<br/>style: kawaii_ocean<br/>prompt_template: "..."</p>
</div>
</div>
<div class="flow-box">
<p class="flow-title">智能检索机制</p>
<p class="flow-step">1. 语义向量检索 → 风格相似度排序</p>
<p class="flow-step">2. 元素标签匹配 → 过滤海洋元素</p>
<p class="flow-step">3. 色彩分析匹配 → 筛选粉色系</p>
<p class="flow-step">4. 业务标签匹配 → 目标人群筛选</p>
<p class="flow-step">→ 结合最佳参考的 prompt 生成新设计</p>
</div>
</div>
<div class="right">
<p class="section-title">图库元数据结构示例</p>
<div class="meta-box">
<p class="meta-line"><span class="meta-key">"product_id"</span>: "ref_023"</p>
<p class="meta-line"><span class="meta-key">"visual_elements"</span>: {</p>
<p class="meta-line">  "primary": ["pink_shell", "starfish"]</p>
<p class="meta-line">  "secondary": ["pearl_beads"]</p>
<p class="meta-line">}</p>
<p class="meta-line"><span class="meta-key">"style_attributes"</span>: {</p>
<p class="meta-line">  "aesthetic": ["kawaii", "romantic"]</p>
<p class="meta-line">  "color_palette": ["#FFB6C1", "#FFFFFF"]</p>
<p class="meta-line">}</p>
<p class="meta-line"><span class="meta-key">"physical_specs"</span>: {</p>
<p class="meta-line">  "length_cm": 12, "weight_g": 15</p>
<p class="meta-line">}</p>
<p class="meta-line"><span class="meta-key">"prompt_template"</span>: {</p>
<p class="meta-line">  "base": "ocean theme charm..."</p>
<p class="meta-line">  "success_rate": 0.89</p>
<p class="meta-line">}</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第六页：Prompt动态编排
  {
    name: 'slide07-prompt-engine',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left { flex: 1; }
.right { flex: 1.1; }
.section-title { font-size: 12pt; color: #1E3A8A; font-weight: bold; margin-bottom: 10pt; }
.gene-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 10pt; }
.gene-title { font-size: 10pt; color: #1E3A8A; font-weight: bold; margin: 0 0 6pt 0; background: #EFF6FF; padding: 4pt 8pt; border-radius: 3pt; display: inline-block; }
.gene-row { display: flex; gap: 6pt; margin: 6pt 0; flex-wrap: wrap; }
.gene-item { background: #3B82F6; color: white; padding: 3pt 8pt; border-radius: 3pt; font-size: 8pt; }
.gene-item.style { background: #0EA5E9; }
.gene-item.quality { background: #10B981; }
.gene-item.element { background: #F59E0B; }
.flow-box { background: #F1F5F9; border-radius: 6pt; padding: 12pt; margin-top: 10pt; }
.flow-title { font-size: 10pt; color: #1E3A8A; font-weight: bold; margin: 0 0 8pt 0; }
.flow-step { font-size: 8pt; color: #1E293B; margin: 4pt 0; }
.flow-arrow { color: #3B82F6; font-weight: bold; }
.result-box { background: #1E3A8A; color: white; padding: 8pt; border-radius: 4pt; margin-top: 8pt; }
.result-text { font-size: 8pt; margin: 0; line-height: 1.5; font-style: italic; }
</style></head>
<body>
<div class="header"><h1>不是固定模板，而是智能组装</h1></div>
<div class="content">
<div class="left">
<p class="section-title">Prompt 基因库结构</p>
<div class="gene-container">
<p class="gene-title">主题描述块 (Theme)</p>
<div class="gene-row">
<p class="gene-item">ocean_theme</p>
<p class="gene-item">crystal_theme</p>
<p class="gene-item">vintage_theme</p>
</div>
<p class="gene-title" style="margin-top: 8pt;">风格描述块 (Style)</p>
<div class="gene-row">
<p class="gene-item style">kawaii</p>
<p class="gene-item style">minimalist</p>
<p class="gene-item style">bohemian</p>
</div>
<p class="gene-title" style="margin-top: 8pt;">质量控制块 (Quality)</p>
<div class="gene-row">
<p class="gene-item quality">lighting_A</p>
<p class="gene-item quality">lighting_B</p>
<p class="gene-item quality">detail_high</p>
</div>
<p class="gene-title" style="margin-top: 8pt;">元素描述块 (Element)</p>
<div class="gene-row">
<p class="gene-item element">seashell</p>
<p class="gene-item element">crystal</p>
<p class="gene-item element">pearl</p>
</div>
</div>
</div>
<div class="right">
<p class="section-title">动态编排流程</p>
<div class="flow-box">
<p class="flow-title">用户需求："海洋风 + 可爱风格 + 水晶元素"</p>
<p class="flow-step"><span class="flow-arrow">→</span> Agent 分析：主题=ocean, 风格=kawaii, 元素=crystal</p>
<p class="flow-step"><span class="flow-arrow">→</span> 知识库查询：最佳组合模板、最优描述词、高成功率质量块</p>
<p class="flow-step"><span class="flow-arrow">→</span> Prompt 组装：</p>
<p class="flow-step" style="padding-left: 20pt;">ocean_theme.base + kawaii.style + crystal.element + lighting_A + detail_high + 参考图成功因子</p>
</div>
<div class="result-box">
<p class="result-text">"A kawaii ocean-inspired charm keychain with raw rose quartz crystal point, soft rounded shapes, studio lighting with soft shadows, intricate details, 8K, commercial photography"</p>
</div>
<p style="font-size: 9pt; color: #64748B; margin-top: 10pt;">这种机制确保了生成质量的稳定性和可控性</p>
</div>
</div>
</body></html>`
  },

  // 第七页：Agent自进化机制
  {
    name: 'slide08-agent-evolution',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.badge { background: #DC2626; color: white; padding: 3pt 8pt; border-radius: 3pt; font-size: 10pt; margin-left: 10pt; }
.content { padding: 15pt 30pt; flex: 1; display: flex; gap: 18pt; }
.left { flex: 1.3; }
.right { flex: 1; }
.section-title { font-size: 11pt; color: #1E3A8A; font-weight: bold; margin-bottom: 8pt; }
.loop-container { background: #F8FAFC; border: 2pt solid #3B82F6; border-radius: 8pt; padding: 12pt; }
.loop-step { display: flex; align-items: flex-start; margin-bottom: 8pt; }
.step-icon { background: #3B82F6; color: white; width: 18pt; height: 18pt; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: bold; margin-right: 8pt; flex-shrink: 0; }
.step-content { flex: 1; }
.step-title { font-size: 9pt; color: #1E3A8A; font-weight: bold; margin: 0; }
.step-detail { font-size: 8pt; color: #64748B; margin: 2pt 0 0 0; }
.arrow-down { text-align: center; color: #3B82F6; font-size: 14pt; margin: 4pt 0; }
.feedback-table { background: #F1F5F9; border-radius: 6pt; overflow: hidden; margin-top: 10pt; }
.fb-header { background: #1E3A8A; padding: 6pt 10pt; display: flex; }
.fb-header p { font-size: 8pt; color: white; font-weight: bold; margin: 0; flex: 1; }
.fb-row { padding: 5pt 10pt; display: flex; border-bottom: 1pt solid #E2E8F0; }
.fb-row p { font-size: 7pt; color: #1E293B; margin: 0; flex: 1; }
.example-box { background: #EFF6FF; border: 1pt solid #3B82F6; border-radius: 6pt; padding: 10pt; }
.ex-title { font-size: 9pt; color: #1E3A8A; font-weight: bold; margin: 0 0 6pt 0; }
.ex-item { font-size: 7pt; color: #1E293B; margin: 3pt 0; }
.ex-highlight { color: #10B981; font-weight: bold; }
.ex-dim { color: #94A3B8; }
</style></head>
<body>
<div class="header"><h1>生成结果评分驱动的持续优化<span class="badge">核心</span></h1></div>
<div class="content">
<div class="left">
<p class="section-title">自进化闭环</p>
<div class="loop-container">
<div class="loop-step">
<p class="step-icon">1</p>
<div class="step-content"><p class="step-title">生成请求</p><p class="step-detail">用户发起设计请求</p></div>
</div>
<div class="loop-step">
<p class="step-icon">2</p>
<div class="step-content"><p class="step-title">Agent 决策</p><p class="step-detail">检索参考 → 查询知识图谱 → 编排 Prompt</p></div>
</div>
<div class="loop-step">
<p class="step-icon">3</p>
<div class="step-content"><p class="step-title">图像生成 + 质量评估</p><p class="step-detail">元素完整性、风格一致性、物理合理性评分</p></div>
</div>
<div class="loop-step">
<p class="step-icon">4</p>
<div class="step-content"><p class="step-title">反馈数据采集</p><p class="step-detail">系统评分 + 用户选择行为 + 显式反馈</p></div>
</div>
<div class="loop-step">
<p class="step-icon">5</p>
<div class="step-content"><p class="step-title">知识库更新</p><p class="step-detail">Prompt模板权重调整、元素组合规则优化、Agent决策策略更新</p></div>
</div>
</div>
<div class="feedback-table">
<div class="fb-header"><p>反馈类型</p><p>数据来源</p><p>学习内容</p></div>
<div class="fb-row"><p>系统评分</p><p>AI自动评估</p><p>元素完整性、风格一致性</p></div>
<div class="fb-row"><p>行为反馈</p><p>用户操作记录</p><p>选择偏好、修改模式</p></div>
<div class="fb-row"><p>显式反馈</p><p>用户主动评价</p><p>满意度、问题标注</p></div>
</div>
</div>
<div class="right">
<p class="section-title">进化示例：Prompt 模板优化</p>
<div class="example-box">
<p class="ex-title">基于 1000 次生成数据</p>
<p class="ex-item"><span class="ex-dim">Template_A (详细风格):</span></p>
<p class="ex-item">质量评分: 72 | 采用率: 35% | 修改次数: 3.2</p>
<p class="ex-item"><span class="ex-dim">Template_B (光影质量):</span></p>
<p class="ex-item">质量评分: 85 | 采用率: 58% | 修改次数: 1.8</p>
<p class="ex-item"><span class="ex-highlight">Template_C (A+B变异):</span></p>
<p class="ex-item"><span class="ex-highlight">质量评分: 89 | 采用率: 71% | 修改次数: 1.3</span></p>
<p class="ex-title" style="margin-top: 10pt;">系统学习结果</p>
<p class="ex-item">→ Template_A 降级（减少使用）</p>
<p class="ex-item">→ Template_B 保持（稳定表现）</p>
<p class="ex-item">→ <span class="ex-highlight">Template_C 晋升为默认</span></p>
<p class="ex-item">→ 提取成功因子: "studio lighting" 权重 +0.15</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第八页：知识图谱
  {
    name: 'slide09-knowledge-graph',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left { flex: 1; }
.right { flex: 1.1; }
.section-title { font-size: 12pt; color: #1E3A8A; font-weight: bold; margin-bottom: 10pt; }
.graph-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 15pt; text-align: center; }
.node-main { background: #3B82F6; color: white; padding: 8pt 16pt; border-radius: 20pt; font-size: 11pt; display: inline-block; margin-bottom: 10pt; }
.node-row { display: flex; justify-content: center; gap: 15pt; margin-top: 8pt; }
.node-item { background: #EFF6FF; border: 1pt solid #3B82F6; padding: 6pt 12pt; border-radius: 15pt; font-size: 9pt; color: #1E3A8A; }
.node-score { font-size: 7pt; color: #64748B; display: block; }
.rules-box { background: #F1F5F9; border-radius: 6pt; padding: 10pt; margin-top: 12pt; }
.rule-item { font-size: 8pt; color: #1E293B; margin: 4pt 0; }
.check-box { background: #FEF3C7; border: 1pt solid #F59E0B; border-radius: 6pt; padding: 12pt; }
.check-title { font-size: 10pt; color: #92400E; font-weight: bold; margin: 0 0 8pt 0; }
.check-warn { font-size: 8pt; color: #B45309; margin: 4pt 0; }
.check-suggest { background: #ffffff; border-radius: 4pt; padding: 8pt; margin-top: 8pt; }
.suggest-title { font-size: 8pt; color: #1E3A8A; font-weight: bold; margin: 0 0 4pt 0; }
.suggest-item { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.btn-row { display: flex; gap: 6pt; margin-top: 6pt; }
.btn { background: #3B82F6; color: white; padding: 3pt 8pt; border-radius: 3pt; font-size: 7pt; }
</style></head>
<body>
<div class="header"><h1>设计决策的智能约束</h1></div>
<div class="content">
<div class="left">
<p class="section-title">元素知识图谱</p>
<div class="graph-container">
<p class="node-main">seashell 贝壳</p>
<div class="node-row">
<p class="node-item">starfish 海星<span class="node-score">兼容: 0.95</span></p>
<p class="node-item">pearl 珍珠<span class="node-score">兼容: 0.92</span></p>
<p class="node-item">crystal 水晶<span class="node-score">兼容: 0.78</span></p>
</div>
</div>
<div class="rules-box">
<p class="rule-item"><b>兼容性规则:</b></p>
<p class="rule-item">• seashell + starfish → 经典海洋组合 (0.95)</p>
<p class="rule-item">• seashell + pearl → 优雅搭配 (0.92)</p>
<p class="rule-item">• seashell + crystal → 风格冲突风险 (0.78)</p>
<p class="rule-item"><b>物理约束:</b></p>
<p class="rule-item">• 总重量 &lt; 挂钩承重 × 0.8</p>
<p class="rule-item">• 元素尺寸比例 1:0.3~0.7</p>
</div>
</div>
<div class="right">
<p class="section-title">兼容性检查示例</p>
<div class="check-box">
<p class="check-title">⚠️ 用户请求："把贝壳换成大水晶"</p>
<p class="check-warn">• 水晶与现有海星风格差异较大 (兼容度 78%)</p>
<p class="check-warn">• 大水晶可能超过挂钩承重限制</p>
<div class="check-suggest">
<p class="suggest-title">建议方案:</p>
<p class="suggest-item">A. 使用小号水晶 (解决承重问题)</p>
<p class="suggest-item">B. 使用海洋风水晶 (提升风格兼容)</p>
<p class="suggest-item">C. 同时更换海星为更现代的元素</p>
<div class="btn-row">
<p class="btn">继续原方案</p>
<p class="btn">采用建议A</p>
<p class="btn">采用建议B</p>
</div>
</div>
</div>
<p style="font-size: 8pt; color: #64748B; margin-top: 10pt;">知识图谱会根据用户行为数据持续优化，元素兼容性规则越来越符合实际市场偏好</p>
</div>
</div>
</body></html>`
  },

  // 第九页：分层更新策略
  {
    name: 'slide10-update-strategy',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left { flex: 1.4; }
.right { flex: 1; }
.section-title { font-size: 12pt; color: #1E3A8A; font-weight: bold; margin-bottom: 10pt; }
.layer-container { display: flex; flex-direction: column; gap: 8pt; }
.layer-card { background: #F8FAFC; border-left: 4pt solid #3B82F6; border-radius: 0 6pt 6pt 0; padding: 10pt 12pt; }
.layer-card.l2 { border-color: #0EA5E9; }
.layer-card.l3 { border-color: #10B981; }
.layer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6pt; }
.layer-title { font-size: 10pt; color: #1E3A8A; font-weight: bold; margin: 0; }
.layer-freq { font-size: 8pt; color: #64748B; background: #E2E8F0; padding: 2pt 6pt; border-radius: 3pt; }
.layer-content { font-size: 8pt; color: #1E293B; margin: 0; }
.layer-detail { font-size: 7pt; color: #64748B; margin: 4pt 0 0 0; }
.safety-table { background: #F1F5F9; border-radius: 6pt; overflow: hidden; }
.safety-header { background: #1E3A8A; padding: 6pt 10pt; display: flex; }
.safety-header p { font-size: 8pt; color: white; font-weight: bold; margin: 0; flex: 1; }
.safety-row { padding: 6pt 10pt; display: flex; border-bottom: 1pt solid #E2E8F0; }
.safety-row:last-child { border-bottom: none; }
.safety-cell { font-size: 7pt; color: #1E293B; margin: 0; flex: 1; }
.safety-cell-bold { font-size: 7pt; color: #1E3A8A; font-weight: bold; margin: 0; flex: 1; }
</style></head>
<body>
<div class="header"><h1>确保系统稳定进化</h1></div>
<div class="content">
<div class="left">
<p class="section-title">三层更新机制</p>
<div class="layer-container">
<div class="layer-card">
<div class="layer-header">
<p class="layer-title">Layer 1: 核心本体</p>
<p class="layer-freq">月度更新 · 人工审核</p>
</div>
<p class="layer-content">元素定义、物理约束规则、基础风格分类</p>
<p class="layer-detail">更新流程: 自动候选提取 → 专家审核 → 回归测试 → 灰度发布</p>
</div>
<div class="layer-card l2">
<div class="layer-header">
<p class="layer-title">Layer 2: 组合规则</p>
<p class="layer-freq">周度更新 · 自动+抽检</p>
</div>
<p class="layer-content">元素搭配兼容性分数、风格组合效果、Prompt模板成功率</p>
<p class="layer-detail">更新条件: 样本量 ≥ 30 且 统计显著性 p &lt; 0.05</p>
</div>
<div class="layer-card l3">
<div class="layer-header">
<p class="layer-title">Layer 3: 动态参数</p>
<p class="layer-freq">每日更新 · 全自动</p>
</div>
<p class="layer-content">元素推荐权重、Prompt基因块权重、个性化偏好参数</p>
<p class="layer-detail">更新方式: 基于滑动窗口 (最近7天数据) 实时计算</p>
</div>
</div>
</div>
<div class="right">
<p class="section-title">安全保障机制</p>
<div class="safety-table">
<div class="safety-header"><p>机制</p><p>作用</p></div>
<div class="safety-row"><p class="safety-cell-bold">置信度门槛</p><p class="safety-cell">新规则需30+样本支持，防止小样本误判</p></div>
<div class="safety-row"><p class="safety-cell-bold">金丝雀发布</p><p class="safety-cell">5%→20%→100%渐进，控制更新风险</p></div>
<div class="safety-row"><p class="safety-cell-bold">异常回滚</p><p class="safety-cell">质量指标下降自动触发，快速恢复</p></div>
<div class="safety-row"><p class="safety-cell-bold">冲突检测</p><p class="safety-cell">新规则与现有规则矛盾检查</p></div>
</div>
<p style="font-size: 8pt; color: #64748B; margin-top: 15pt; line-height: 1.5;">确保系统越用越好，而不会因为错误学习导致退化</p>
</div>
</div>
</body></html>`
  },

  // 第十页：应用场景
  {
    name: 'slide11-scenarios',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 15pt 25pt; flex: 1; display: flex; flex-wrap: wrap; gap: 12pt; }
.scenario-card { width: calc(33.33% - 10pt); background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 12pt; }
.scenario-icon { font-size: 18pt; margin-bottom: 6pt; }
.scenario-title { font-size: 11pt; color: #1E3A8A; font-weight: bold; margin: 0 0 6pt 0; }
.scenario-desc { font-size: 8pt; color: #64748B; margin: 0 0 8pt 0; }
.scenario-detail { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.scenario-highlight { background: #EFF6FF; padding: 4pt 6pt; border-radius: 3pt; font-size: 7pt; color: #1E3A8A; margin-top: 6pt; display: inline-block; }
</style></head>
<body>
<div class="header"><h1>覆盖设计全流程的场景支持</h1></div>
<div class="content">
<div class="scenario-card">
<p class="scenario-icon">🎨</p>
<p class="scenario-title">新品快速探索</p>
<p class="scenario-desc">为下季度开发新品系列</p>
<p class="scenario-detail">• 输入目标人群和风格需求</p>
<p class="scenario-detail">• 自动匹配12个相关参考</p>
<p class="scenario-detail">• 生成4个差异化方案对比</p>
<p class="scenario-highlight">选择方案后进入精修模式</p>
</div>
<div class="scenario-card">
<p class="scenario-icon">⚡</p>
<p class="scenario-title">客户即时定制</p>
<p class="scenario-desc">客户现场提出定制需求</p>
<p class="scenario-detail">• 0:00 输入需求</p>
<p class="scenario-detail">• 0:15 生成4个候选方案</p>
<p class="scenario-detail">• 0:45 精修输出</p>
<p class="scenario-highlight">全程1分钟内完成</p>
</div>
<div class="scenario-card">
<p class="scenario-icon">📈</p>
<p class="scenario-title">爆款系列衍生</p>
<p class="scenario-desc">基于热销款快速扩展产品线</p>
<p class="scenario-detail">• 配色变体 (6款)</p>
<p class="scenario-detail">• 元素变体 (4款)</p>
<p class="scenario-detail">• 尺寸变体 (3款)</p>
<p class="scenario-highlight">一键生成13个SKU变体</p>
</div>
<div class="scenario-card">
<p class="scenario-icon">🎄</p>
<p class="scenario-title">节日主题快速响应</p>
<p class="scenario-desc">节日/热点主题快速出品</p>
<p class="scenario-detail">• 圣诞: 红绿金 + 雪花铃铛</p>
<p class="scenario-detail">• 春节: 红金 + 锦鲤福字</p>
<p class="scenario-detail">• 情人节: 粉红 + 爱心玫瑰</p>
<p class="scenario-highlight">预设模板一键生成</p>
</div>
<div class="scenario-card">
<p class="scenario-icon">🔄</p>
<p class="scenario-title">风格迁移尝试</p>
<p class="scenario-desc">探索同一产品的不同风格</p>
<p class="scenario-detail">• Kawaii 可爱版</p>
<p class="scenario-detail">• 极简主义简约版</p>
<p class="scenario-detail">• 复古怀旧版</p>
<p class="scenario-highlight">保持核心元素，调整表达</p>
</div>
</div>
</body></html>`
  },

  // 第十一页：技术架构
  {
    name: 'slide12-architecture',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 15pt 30pt; flex: 1; display: flex; flex-direction: column; gap: 8pt; }
.arch-layer { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 10pt 15pt; display: flex; align-items: center; }
.layer-label { width: 90pt; }
.layer-title { font-size: 11pt; color: #1E3A8A; font-weight: bold; margin: 0; }
.layer-subtitle { font-size: 8pt; color: #64748B; margin: 2pt 0 0 0; }
.layer-content { flex: 1; display: flex; gap: 10pt; }
.layer-box { background: #3B82F6; color: white; padding: 6pt 12pt; border-radius: 4pt; font-size: 8pt; }
.layer-box.accent { background: #0EA5E9; }
.layer-box.green { background: #10B981; }
.arrow-container { text-align: center; padding: 3pt 0; }
.arrow { color: #3B82F6; font-size: 14pt; }
.feedback-layer { background: #FEF3C7; border: 1pt solid #F59E0B; }
.feedback-layer .layer-box { background: #F59E0B; }
.update-layer { background: #DCFCE7; border: 1pt solid #10B981; }
.update-layer .layer-box { background: #10B981; }
</style></head>
<body>
<div class="header"><h1>完整数据流与模块协作</h1></div>
<div class="content">
<div class="arch-layer">
<div class="layer-label"><p class="layer-title">用户交互层</p><p class="layer-subtitle">输入方式</p></div>
<div class="layer-content">
<p class="layer-box">上传参考图</p>
<p class="layer-box">文字描述需求</p>
<p class="layer-box">选择场景预设</p>
<p class="layer-box">对话式修改</p>
</div>
</div>
<div class="arrow-container"><p class="arrow">↓</p></div>
<div class="arch-layer">
<div class="layer-label"><p class="layer-title">Agent 智能层</p><p class="layer-subtitle">核心决策</p></div>
<div class="layer-content">
<p class="layer-box accent">意图理解 (Claude)</p>
<p class="layer-box accent">知识图谱查询</p>
<p class="layer-box accent">参考图检索</p>
<p class="layer-box accent">Prompt 动态编排</p>
</div>
</div>
<div class="arrow-container"><p class="arrow">↓</p></div>
<div class="arch-layer">
<div class="layer-label"><p class="layer-title">图像生成层</p><p class="layer-subtitle">执行引擎</p></div>
<div class="layer-content">
<p class="layer-box green">Nano Banana-2 引擎</p>
<p class="layer-box green">图生图: 参考图+编辑指令</p>
<p class="layer-box green">文生图: Prompt+匹配参考</p>
</div>
</div>
<div class="arrow-container"><p class="arrow">↓</p></div>
<div class="arch-layer feedback-layer">
<div class="layer-label"><p class="layer-title">质量评估层</p><p class="layer-subtitle">反馈采集</p></div>
<div class="layer-content">
<p class="layer-box">自动质量评分</p>
<p class="layer-box">用户行为采集</p>
<p class="layer-box">显式反馈收集</p>
</div>
</div>
<div class="arrow-container"><p class="arrow">↓</p></div>
<div class="arch-layer update-layer">
<div class="layer-label"><p class="layer-title">知识库更新</p><p class="layer-subtitle">持续进化</p></div>
<div class="layer-content">
<p class="layer-box">Prompt模板权重调整</p>
<p class="layer-box">元素兼容性更新</p>
<p class="layer-box">Agent决策策略优化</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第十二页：总结
  {
    name: 'slide13-summary',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 15pt 30pt; }
.header h1 { font-size: 24pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 25pt; }
.left { flex: 1.2; }
.right { flex: 1; }
.section-title { font-size: 12pt; color: #1E3A8A; font-weight: bold; margin-bottom: 12pt; }
.cap-table { display: flex; flex-direction: column; gap: 6pt; }
.cap-row { display: flex; gap: 8pt; align-items: center; }
.cap-label { width: 80pt; font-size: 9pt; color: #1E3A8A; font-weight: bold; }
.cap-value { flex: 1; font-size: 8pt; color: #1E293B; background: #F1F5F9; padding: 6pt 10pt; border-radius: 4pt; }
.evolution-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 12pt; }
.evo-stage { display: flex; align-items: flex-start; margin-bottom: 10pt; }
.evo-num { background: #3B82F6; color: white; width: 20pt; height: 20pt; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10pt; font-weight: bold; margin-right: 10pt; flex-shrink: 0; }
.evo-content { flex: 1; }
.evo-title { font-size: 10pt; color: #1E3A8A; font-weight: bold; margin: 0; }
.evo-detail { font-size: 8pt; color: #64748B; margin: 2pt 0 0 0; }
.quote-box { background: #1E3A8A; color: white; padding: 15pt; border-radius: 8pt; margin-top: 15pt; }
.quote-text { font-size: 9pt; margin: 0; line-height: 1.6; font-style: italic; }
</style></head>
<body>
<div class="header"><h1>自进化设计系统的核心价值</h1></div>
<div class="content">
<div class="left">
<p class="section-title">核心能力总结</p>
<div class="cap-table">
<div class="cap-row"><p class="cap-label">双模式生成</p><p class="cap-value">图生图精修 + 文生图探索，覆盖设计全流程</p></div>
<div class="cap-row"><p class="cap-label">对话式控制</p><p class="cap-value">自然语言精确编辑，降低使用门槛</p></div>
<div class="cap-row"><p class="cap-label">智能参考库</p><p class="cap-value">结构化知识 + Prompt模板，确保生成质量</p></div>
<div class="cap-row"><p class="cap-label">动态编排</p><p class="cap-value">Prompt基因库智能组装，灵活应对需求</p></div>
<div class="cap-row"><p class="cap-label">兼容性约束</p><p class="cap-value">知识图谱驱动决策，保障设计可行性</p></div>
<div class="cap-row"><p class="cap-label">自进化闭环</p><p class="cap-value">反馈驱动持续优化，用得越多越智能</p></div>
</div>
</div>
<div class="right">
<p class="section-title">系统进化路径</p>
<div class="evolution-box">
<div class="evo-stage">
<p class="evo-num">1</p>
<div class="evo-content"><p class="evo-title">工具赋能</p><p class="evo-detail">提供高效设计生成能力，降低重复劳动</p></div>
</div>
<div class="evo-stage">
<p class="evo-num">2</p>
<div class="evo-content"><p class="evo-title">知识沉淀</p><p class="evo-detail">积累行业设计规律，形成专属知识库</p></div>
</div>
<div class="evo-stage">
<p class="evo-num">3</p>
<div class="evo-content"><p class="evo-title">智能决策</p><p class="evo-detail">主动推荐设计方向，预测趋势偏好</p></div>
</div>
<div class="evo-stage" style="margin-bottom: 0;">
<p class="evo-num">4</p>
<div class="evo-content"><p class="evo-title">设计大脑</p><p class="evo-detail">自主完成设计探索，持续创造价值</p></div>
</div>
</div>
</div>
</div>
<div class="quote-box" style="margin: 0 30pt 20pt 30pt;">
<p class="quote-text">我们构建的不是一个简单的 AI 绘图工具，而是一套持续进化的智能设计系统。它理解挂饰行业的专业知识，它通过对话精确执行您的设计意图，它从每一次使用中学习进步。用得越多，它越懂您的需求。</p>
</div>
</body></html>`
  }
];

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AI Design Platform';
  pptx.title = 'AI 挂饰设计平台 - 方案展示';
  pptx.subject = '自进化的智能设计系统';

  // 确保slides目录存在
  if (!fs.existsSync(slidesDir)) {
    fs.mkdirSync(slidesDir, { recursive: true });
  }

  // 创建HTML文件并转换为PPT
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const htmlPath = path.join(slidesDir, `${slide.name}.html`);

    // 写入HTML文件
    fs.writeFileSync(htmlPath, slide.html);
    console.log(`Created: ${slide.name}.html`);

    // 转换为PPT幻灯片
    try {
      await html2pptx(htmlPath, pptx);
      console.log(`Converted: ${slide.name}`);
    } catch (err) {
      console.error(`Error converting ${slide.name}:`, err.message);
    }
  }

  // 保存PPT
  const outputPath = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/AI挂饰设计平台方案.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

createPresentation().catch(console.error);
