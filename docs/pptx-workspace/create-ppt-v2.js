const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/g/.claude/plugins/cache/anthropic-agent-skills/document-skills/f06b1c0701b2/document-skills/pptx/scripts/html2pptx');
const fs = require('fs');
const path = require('path');

const slidesDir = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/slides';

const slides = [
  // 封面页
  {
    name: 'slide01-cover',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #ffffff; }
.header-bar { position: absolute; top: 0; left: 0; right: 0; height: 8pt; background: #3B82F6; }
h1 { font-size: 40pt; color: #1E293B; margin: 0 0 15pt 0; text-align: center; }
.subtitle { font-size: 20pt; color: #3B82F6; margin: 0 0 30pt 0; text-align: center; }
.tagline { font-size: 13pt; color: #64748B; text-align: center; max-width: 480pt; line-height: 1.5; margin: 0; }
</style></head>
<body>
<div class="header-bar"></div>
<h1>AI 挂饰设计平台</h1>
<p class="subtitle">自进化的智能设计系统</p>
<p class="tagline">传统 AI 绘图工具的问题在于：用户不满意只能重新生成，每次从零开始，知识无法沉淀。我们构建的是一套持续学习的闭环系统——用得越多，越懂您的设计需求。</p>
</body></html>`
  },

  // 第二页：行业痛点
  {
    name: 'slide02-pain-points',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 25pt; flex: 1; display: flex; gap: 20pt; }
.left, .right { flex: 1; }
h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 10pt 0; border-left: 3pt solid #3B82F6; padding-left: 8pt; }
.flow-box { background: #F1F5F9; border-radius: 5pt; padding: 10pt; margin-bottom: 12pt; }
.flow-box p { font-size: 9pt; color: #1E293B; margin: 3pt 0; line-height: 1.4; }
.highlight { color: #DC2626; font-weight: bold; }
.table-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; overflow: hidden; }
.table-header { background: #1E3A8A; padding: 6pt 10pt; }
.table-header p { font-size: 9pt; color: #ffffff; margin: 0; }
.table-row { padding: 6pt 10pt; border-bottom: 1pt solid #E2E8F0; }
.table-row:last-child { border-bottom: none; }
.table-row p { font-size: 8pt; color: #1E293B; margin: 0; }
.table-row b { color: #1E3A8A; }
</style></head>
<body>
<div class="header"><h1>现有 AI 设计工具的根本缺陷</h1></div>
<div class="content">
<div class="left">
<h2>通用 AI 绘图的困境</h2>
<div class="flow-box">
<p>传统模式流程：用户 → 提示词 → 黑盒模型 → 结果</p>
<p class="highlight">断裂点：用户不满意只能重写提示词，知识无法沉淀</p>
</div>
<h2>核心问题</h2>
<p style="font-size: 9pt; color: #1E293B; line-height: 1.5; margin: 0;">通用 AI 绘图工具是"一次性"的。每次生成都是独立的，系统不会记住您的偏好，不会学习什么样的设计更受欢迎。</p>
</div>
<div class="right">
<h2>挂饰设计的特殊挑战</h2>
<div class="table-box">
<div class="table-header"><p>挑战类型 | 具体表现</p></div>
<div class="table-row"><p><b>物理约束</b> | 材料属性、工艺可行性、承重限制</p></div>
<div class="table-row"><p><b>风格一致性</b> | 元素搭配协调、整体美感把控</p></div>
<div class="table-row"><p><b>商业适配</b> | 目标人群匹配、季节趋势把握</p></div>
<div class="table-row"><p><b>迭代效率</b> | 反复修改耗时、沟通成本高</p></div>
</div>
</div>
</div>
</body></html>`
  },

  // 第三页：解决方案概览
  {
    name: 'slide03-solution',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 15pt 25pt; flex: 1; }
h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 10pt 0; }
.flow-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 12pt; margin-bottom: 12pt; }
.flow-row { display: flex; align-items: center; justify-content: center; gap: 6pt; margin-bottom: 6pt; }
.flow-box { background: #3B82F6; padding: 5pt 10pt; border-radius: 4pt; }
.flow-box p { font-size: 9pt; color: white; margin: 0; }
.flow-arrow { font-size: 11pt; color: #64748B; }
.feedback-row { display: flex; justify-content: center; gap: 15pt; }
.feedback-item { background: #0EA5E9; padding: 4pt 8pt; border-radius: 3pt; }
.feedback-item p { font-size: 8pt; color: white; margin: 0; }
h3 { font-size: 11pt; color: #1E3A8A; margin: 12pt 0 8pt 0; }
.arch-table { display: flex; gap: 12pt; }
.arch-card { flex: 1; background: #F1F5F9; border-radius: 5pt; padding: 10pt; border-left: 3pt solid #3B82F6; }
.arch-card h4 { font-size: 10pt; color: #1E3A8A; margin: 0 0 4pt 0; }
.arch-card p { font-size: 8pt; color: #64748B; margin: 0 0 3pt 0; }
.arch-card .detail { color: #1E293B; }
</style></head>
<body>
<div class="header"><h1>自进化设计系统 — 范式转变</h1></div>
<div class="content">
<h2>核心理念：从"单次生成"到"持续学习闭环"</h2>
<div class="flow-container">
<div class="flow-row">
<div class="flow-box"><p>用户意图</p></div><p class="flow-arrow">→</p>
<div class="flow-box"><p>知识检索</p></div><p class="flow-arrow">→</p>
<div class="flow-box"><p>Prompt编排</p></div><p class="flow-arrow">→</p>
<div class="flow-box"><p>图像生成</p></div><p class="flow-arrow">→</p>
<div class="flow-box"><p>质量评估</p></div>
</div>
<div class="feedback-row">
<div class="feedback-item"><p>选择行为反馈</p></div>
<div class="feedback-item"><p>知识库更新</p></div>
<div class="feedback-item"><p>Prompt优化 + Agent进化</p></div>
</div>
</div>
<h3>三层技术架构</h3>
<div class="arch-table">
<div class="arch-card"><h4>应用层</h4><p>用户交互</p><p class="detail">多模式输入、实时反馈采集</p></div>
<div class="arch-card"><h4>智能层</h4><p>Agent 决策</p><p class="detail">知识图谱查询、Prompt动态编排</p></div>
<div class="arch-card"><h4>执行层</h4><p>图像生成</p><p class="detail">多模型调度、质量预检、结果评估</p></div>
</div>
</div>
</body></html>`
  },

  // 第四页：双模式设计能力
  {
    name: 'slide04-dual-mode',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 15pt 25pt; flex: 1; display: flex; gap: 18pt; }
.mode-card { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 12pt; }
.mode-card h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 4pt 0; }
.mode-card .subtitle { font-size: 9pt; color: #64748B; margin: 0 0 10pt 0; }
.mode-flow { background: #ffffff; border-radius: 4pt; padding: 8pt; margin-bottom: 8pt; }
.flow-step { display: flex; align-items: center; gap: 4pt; }
.step-box { background: #3B82F6; padding: 3pt 6pt; border-radius: 3pt; }
.step-box p { font-size: 8pt; color: white; margin: 0; }
.step-arrow { font-size: 9pt; color: #94A3B8; }
.mode-flow .hint { font-size: 7pt; color: #64748B; margin: 5pt 0 0 0; text-align: center; }
h3 { font-size: 9pt; color: #1E3A8A; margin: 8pt 0 5pt 0; }
ul { margin: 0; padding-left: 14pt; }
li { font-size: 8pt; color: #1E293B; margin: 2pt 0; }
</style></head>
<body>
<div class="header"><h1>精确修改 + 探索创新，双轮驱动</h1></div>
<div class="content">
<div class="mode-card">
<h2>模式一：图生图</h2>
<p class="subtitle">基于参考的精确编辑</p>
<div class="mode-flow">
<div class="flow-step">
<div class="step-box"><p>上传参考图</p></div><p class="step-arrow">→</p>
<div class="step-box"><p>对话式修改</p></div><p class="step-arrow">→</p>
<div class="step-box"><p>精确输出</p></div>
</div>
<p class="hint">适用：已有设计基础，需要局部调整</p>
</div>
<h3>核心优势</h3>
<ul>
<li>继承参考图的物理结构和工艺可行性</li>
<li>只修改指定部分，其他保持不变</li>
<li>渐进式迭代，2-3次达到满意</li>
</ul>
</div>
<div class="mode-card">
<h2>模式二：文生图</h2>
<p class="subtitle">智能参考匹配探索</p>
<div class="mode-flow">
<div class="flow-step">
<div class="step-box"><p>描述需求</p></div><p class="step-arrow">→</p>
<div class="step-box"><p>智能匹配参考</p></div><p class="step-arrow">→</p>
<div class="step-box"><p>多方案输出</p></div>
</div>
<p class="hint">适用：创意探索阶段，不确定具体方向</p>
</div>
<h3>核心优势</h3>
<ul>
<li>自动从图库检索最匹配的参考图</li>
<li>结合参考特征生成新设计</li>
<li>输出多个差异化方案供探索</li>
<li>兼顾创意发散和可行性约束</li>
</ul>
</div>
</div>
</body></html>`
  },

  // 第五页：对话式精确编辑
  {
    name: 'slide05-dialog-edit',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 15pt 25pt; flex: 1; display: flex; gap: 18pt; }
.left { flex: 1.2; }
.right { flex: 1; }
h2 { font-size: 11pt; color: #1E3A8A; margin: 0 0 8pt 0; }
.dialog-box { background: #F1F5F9; border-radius: 5pt; padding: 8pt; margin-bottom: 6pt; }
.user-msg { font-size: 9pt; color: #1E293B; margin: 0 0 4pt 0; }
.user-label { background: #3B82F6; color: white; padding: 1pt 4pt; border-radius: 2pt; font-size: 7pt; }
.agent-step { font-size: 8pt; color: #64748B; margin: 2pt 0 2pt 15pt; }
.result-box { background: #0EA5E9; display: inline-block; padding: 3pt 6pt; border-radius: 3pt; margin-top: 4pt; }
.result-box p { font-size: 7pt; color: white; margin: 0; }
.table-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; overflow: hidden; }
.table-header { background: #1E3A8A; padding: 5pt 8pt; }
.table-header p { font-size: 8pt; color: white; margin: 0; }
.table-row { padding: 4pt 8pt; border-bottom: 1pt solid #E2E8F0; display: flex; }
.table-row:last-child { border-bottom: none; }
.td1 { flex: 1; font-size: 8pt; color: #1E293B; margin: 0; }
.td2 { flex: 1.5; font-size: 8pt; color: #64748B; margin: 0; }
</style></head>
<body>
<div class="header"><h1>自然语言控制，精确到每个元素</h1></div>
<div class="content">
<div class="left">
<h2>对话式迭代流程</h2>
<div class="dialog-box">
<p class="user-msg"><b class="user-label">用户</b> "把粉色贝壳换成水晶"</p>
<p class="agent-step">→ Agent 解析：替换操作，目标=贝壳，新元素=水晶</p>
<p class="agent-step">→ 知识库查询：水晶变体、兼容性检查</p>
<p class="agent-step">→ Prompt 编排：动态生成最优 Prompt</p>
<div class="result-box"><p>生成图片 v1</p></div>
</div>
<div class="dialog-box">
<p class="user-msg"><b class="user-label">用户</b> "水晶大一点，更闪亮些"</p>
<p class="agent-step">→ Agent 解析：修改操作，scale=1.3，brightness=+20%</p>
<div class="result-box"><p>基于 v1 精确调整，生成 v2</p></div>
</div>
</div>
<div class="right">
<h2>语义理解能力</h2>
<div class="table-container">
<div class="table-header"><p>用户表达 → 执行操作</p></div>
<div class="table-row"><p class="td1">"贝壳大一点"</p><p class="td2">只放大贝壳，保持其他</p></div>
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

  // 第六页：智能参考图库
  {
    name: 'slide06-reference-lib',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 15pt 25pt; flex: 1; display: flex; gap: 18pt; }
.left, .right { flex: 1; }
h2 { font-size: 11pt; color: #1E3A8A; margin: 0 0 8pt 0; }
.compare-box { display: flex; gap: 8pt; margin-bottom: 10pt; }
.compare-item { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; padding: 8pt; }
.compare-item h3 { font-size: 9pt; color: #64748B; margin: 0 0 4pt 0; }
.compare-item p { font-size: 7pt; color: #1E293B; margin: 2pt 0; line-height: 1.3; }
.compare-item.highlight { background: #EFF6FF; border-color: #3B82F6; }
.compare-item.highlight h3 { color: #1E3A8A; font-weight: bold; }
.flow-box { background: #F1F5F9; border-radius: 5pt; padding: 8pt; }
.flow-box h3 { font-size: 9pt; color: #1E3A8A; margin: 0 0 5pt 0; }
.flow-box p { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.meta-box { background: #F1F5F9; border-radius: 5pt; padding: 8pt; font-family: Courier New, monospace; }
.meta-box p { font-size: 7pt; color: #1E293B; margin: 1pt 0; }
.meta-key { color: #1E3A8A; }
</style></head>
<body>
<div class="header"><h1>结构化知识资产，驱动精准生成</h1></div>
<div class="content">
<div class="left">
<h2>从"图片集合"到"知识资产"</h2>
<div class="compare-box">
<div class="compare-item">
<h3>传统图库</h3>
<p>image_001.jpg</p>
<p>image_002.jpg</p>
<p>... (只有图片)</p>
</div>
<div class="compare-item highlight">
<h3>结构化图库</h3>
<p>image.jpg ← 视觉资产</p>
<p>elements: [贝壳,海星]</p>
<p>style: kawaii_ocean</p>
<p>prompt_template: "..."</p>
</div>
</div>
<div class="flow-box">
<h3>智能检索机制</h3>
<p>1. 语义向量检索 → 风格相似度排序</p>
<p>2. 元素标签匹配 → 过滤海洋元素</p>
<p>3. 色彩分析匹配 → 筛选粉色系</p>
<p>4. 业务标签匹配 → 目标人群筛选</p>
<p>→ 结合最佳参考的 prompt 生成新设计</p>
</div>
</div>
<div class="right">
<h2>图库元数据结构示例</h2>
<div class="meta-box">
<p><b class="meta-key">"product_id"</b>: "ref_023"</p>
<p><b class="meta-key">"visual_elements"</b>: {</p>
<p>  "primary": ["pink_shell", "starfish"]</p>
<p>  "secondary": ["pearl_beads"]</p>
<p>}</p>
<p><b class="meta-key">"style_attributes"</b>: {</p>
<p>  "aesthetic": ["kawaii", "romantic"]</p>
<p>  "color_palette": ["#FFB6C1"]</p>
<p>}</p>
<p><b class="meta-key">"physical_specs"</b>: {</p>
<p>  "length_cm": 12, "weight_g": 15</p>
<p>}</p>
<p><b class="meta-key">"prompt_template"</b>: {</p>
<p>  "base": "ocean theme charm..."</p>
<p>  "success_rate": 0.89</p>
<p>}</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第七页：Prompt动态编排
  {
    name: 'slide07-prompt-engine',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 12pt 25pt; flex: 1; display: flex; gap: 15pt; }
.left { flex: 1; }
.right { flex: 1.1; }
h2 { font-size: 11pt; color: #1E3A8A; margin: 0 0 6pt 0; }
.gene-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; padding: 8pt; }
.gene-section { margin-bottom: 6pt; }
.gene-title { font-size: 8pt; color: #1E3A8A; margin: 0 0 3pt 0; background: #EFF6FF; display: inline-block; padding: 2pt 5pt; border-radius: 2pt; }
.gene-row { display: flex; gap: 4pt; flex-wrap: wrap; }
.gene-item { background: #3B82F6; padding: 2pt 5pt; border-radius: 2pt; }
.gene-item p { font-size: 7pt; color: white; margin: 0; }
.gene-item.style { background: #0EA5E9; }
.gene-item.quality { background: #10B981; }
.gene-item.element { background: #F59E0B; }
.flow-box { background: #F1F5F9; border-radius: 5pt; padding: 8pt; }
.flow-box h3 { font-size: 9pt; color: #1E3A8A; margin: 0 0 4pt 0; }
.flow-box p { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.arrow { color: #3B82F6; font-weight: bold; }
.result-box { background: #1E3A8A; padding: 6pt; border-radius: 3pt; margin-top: 6pt; }
.result-box p { font-size: 7pt; color: white; margin: 0; line-height: 1.4; font-style: italic; }
</style></head>
<body>
<div class="header"><h1>不是固定模板，而是智能组装</h1></div>
<div class="content">
<div class="left">
<h2>Prompt 基因库结构</h2>
<div class="gene-container">
<div class="gene-section">
<p class="gene-title">主题描述块 (Theme)</p>
<div class="gene-row">
<div class="gene-item"><p>ocean_theme</p></div>
<div class="gene-item"><p>crystal_theme</p></div>
<div class="gene-item"><p>vintage_theme</p></div>
</div>
</div>
<div class="gene-section">
<p class="gene-title">风格描述块 (Style)</p>
<div class="gene-row">
<div class="gene-item style"><p>kawaii</p></div>
<div class="gene-item style"><p>minimalist</p></div>
<div class="gene-item style"><p>bohemian</p></div>
</div>
</div>
<div class="gene-section">
<p class="gene-title">质量控制块 (Quality)</p>
<div class="gene-row">
<div class="gene-item quality"><p>lighting_A</p></div>
<div class="gene-item quality"><p>lighting_B</p></div>
<div class="gene-item quality"><p>detail_high</p></div>
</div>
</div>
<div class="gene-section">
<p class="gene-title">元素描述块 (Element)</p>
<div class="gene-row">
<div class="gene-item element"><p>seashell</p></div>
<div class="gene-item element"><p>crystal</p></div>
<div class="gene-item element"><p>pearl</p></div>
</div>
</div>
</div>
</div>
<div class="right">
<h2>动态编排流程</h2>
<div class="flow-box">
<h3>用户需求："海洋风 + 可爱风格 + 水晶元素"</h3>
<p><b class="arrow">→</b> Agent 分析：主题=ocean, 风格=kawaii, 元素=crystal</p>
<p><b class="arrow">→</b> 知识库查询：最佳组合、最优描述词、高成功率质量块</p>
<p><b class="arrow">→</b> Prompt 组装：ocean_theme + kawaii + crystal + lighting_A + 参考图成功因子</p>
</div>
<div class="result-box">
<p>"A kawaii ocean-inspired charm keychain with raw rose quartz crystal point, soft rounded shapes, studio lighting with soft shadows, intricate details, 8K"</p>
</div>
<p style="font-size: 8pt; color: #64748B; margin: 6pt 0 0 0;">这种机制确保了生成质量的稳定性和可控性</p>
</div>
</div>
</body></html>`
  },

  // 第八页：Agent自进化机制
  {
    name: 'slide08-agent-evolution',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; display: flex; align-items: center; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.badge { background: #DC2626; padding: 2pt 6pt; border-radius: 3pt; margin-left: 10pt; }
.badge p { font-size: 9pt; color: white; margin: 0; }
.content { padding: 12pt 25pt; flex: 1; display: flex; gap: 15pt; }
.left { flex: 1.3; }
.right { flex: 1; }
h2 { font-size: 10pt; color: #1E3A8A; margin: 0 0 6pt 0; }
.loop-container { background: #F8FAFC; border: 2pt solid #3B82F6; border-radius: 6pt; padding: 8pt; }
.loop-step { display: flex; align-items: flex-start; margin-bottom: 5pt; }
.step-num { background: #3B82F6; color: white; width: 14pt; height: 14pt; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; margin-right: 6pt; flex-shrink: 0; }
.step-content h3 { font-size: 8pt; color: #1E3A8A; margin: 0; }
.step-content p { font-size: 7pt; color: #64748B; margin: 1pt 0 0 0; }
.feedback-table { background: #F1F5F9; border-radius: 4pt; margin-top: 6pt; overflow: hidden; }
.fb-header { background: #1E3A8A; padding: 4pt 6pt; }
.fb-header p { font-size: 7pt; color: white; margin: 0; }
.fb-row { padding: 3pt 6pt; border-bottom: 1pt solid #E2E8F0; }
.fb-row:last-child { border-bottom: none; }
.fb-row p { font-size: 6pt; color: #1E293B; margin: 0; }
.example-box { background: #EFF6FF; border: 1pt solid #3B82F6; border-radius: 5pt; padding: 8pt; }
.example-box h3 { font-size: 8pt; color: #1E3A8A; margin: 0 0 4pt 0; }
.example-box p { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.dim { color: #94A3B8; }
.highlight { color: #10B981; font-weight: bold; }
</style></head>
<body>
<div class="header"><h1>生成结果评分驱动的持续优化</h1><div class="badge"><p>核心</p></div></div>
<div class="content">
<div class="left">
<h2>自进化闭环</h2>
<div class="loop-container">
<div class="loop-step"><div class="step-num"><p>1</p></div><div class="step-content"><h3>生成请求</h3><p>用户发起设计请求</p></div></div>
<div class="loop-step"><div class="step-num"><p>2</p></div><div class="step-content"><h3>Agent 决策</h3><p>检索参考 → 查询知识图谱 → 编排 Prompt</p></div></div>
<div class="loop-step"><div class="step-num"><p>3</p></div><div class="step-content"><h3>图像生成 + 质量评估</h3><p>元素完整性、风格一致性、物理合理性评分</p></div></div>
<div class="loop-step"><div class="step-num"><p>4</p></div><div class="step-content"><h3>反馈数据采集</h3><p>系统评分 + 用户选择行为 + 显式反馈</p></div></div>
<div class="loop-step"><div class="step-num"><p>5</p></div><div class="step-content"><h3>知识库更新</h3><p>Prompt模板权重、元素规则、Agent策略更新</p></div></div>
</div>
<div class="feedback-table">
<div class="fb-header"><p>反馈类型 | 数据来源 | 学习内容</p></div>
<div class="fb-row"><p>系统评分 | AI自动评估 | 元素完整性、风格一致性</p></div>
<div class="fb-row"><p>行为反馈 | 用户操作 | 选择偏好、修改模式</p></div>
<div class="fb-row"><p>显式反馈 | 用户评价 | 满意度、问题标注</p></div>
</div>
</div>
<div class="right">
<h2>进化示例：Prompt 模板优化</h2>
<div class="example-box">
<h3>基于 1000 次生成数据</h3>
<p class="dim">Template_A (详细风格):</p>
<p>评分: 72 | 采用率: 35% | 修改: 3.2次</p>
<p class="dim">Template_B (光影质量):</p>
<p>评分: 85 | 采用率: 58% | 修改: 1.8次</p>
<p class="highlight">Template_C (A+B变异):</p>
<p class="highlight">评分: 89 | 采用率: 71% | 修改: 1.3次</p>
<h3>系统学习结果</h3>
<p>→ Template_A 降级（减少使用）</p>
<p>→ Template_B 保持（稳定表现）</p>
<p class="highlight">→ Template_C 晋升为默认</p>
<p>→ 提取成功因子: "studio lighting" +0.15</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第九页：知识图谱
  {
    name: 'slide09-knowledge-graph',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 12pt 25pt; flex: 1; display: flex; gap: 15pt; }
.left, .right { flex: 1; }
h2 { font-size: 10pt; color: #1E3A8A; margin: 0 0 6pt 0; }
.graph-container { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 10pt; text-align: center; }
.node-main { background: #3B82F6; display: inline-block; padding: 5pt 12pt; border-radius: 15pt; margin-bottom: 6pt; }
.node-main p { font-size: 10pt; color: white; margin: 0; }
.node-row { display: flex; justify-content: center; gap: 10pt; }
.node-item { background: #EFF6FF; border: 1pt solid #3B82F6; padding: 4pt 8pt; border-radius: 10pt; }
.node-item p { font-size: 8pt; color: #1E3A8A; margin: 0; }
.node-item .score { font-size: 6pt; color: #64748B; }
.rules-box { background: #F1F5F9; border-radius: 5pt; padding: 8pt; margin-top: 8pt; }
.rules-box h3 { font-size: 8pt; color: #1E3A8A; margin: 0 0 4pt 0; }
.rules-box p { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.check-box { background: #FEF3C7; border: 1pt solid #F59E0B; border-radius: 5pt; padding: 8pt; }
.check-box h3 { font-size: 9pt; color: #92400E; margin: 0 0 4pt 0; }
.check-box p { font-size: 7pt; color: #B45309; margin: 2pt 0; }
.suggest-box { background: #ffffff; border-radius: 3pt; padding: 6pt; margin-top: 6pt; }
.suggest-box h4 { font-size: 7pt; color: #1E3A8A; margin: 0 0 3pt 0; }
.suggest-box p { font-size: 6pt; color: #1E293B; margin: 1pt 0; }
</style></head>
<body>
<div class="header"><h1>设计决策的智能约束</h1></div>
<div class="content">
<div class="left">
<h2>元素知识图谱</h2>
<div class="graph-container">
<div class="node-main"><p>seashell 贝壳</p></div>
<div class="node-row">
<div class="node-item"><p>starfish 海星<br/><b class="score">兼容: 0.95</b></p></div>
<div class="node-item"><p>pearl 珍珠<br/><b class="score">兼容: 0.92</b></p></div>
<div class="node-item"><p>crystal 水晶<br/><b class="score">兼容: 0.78</b></p></div>
</div>
</div>
<div class="rules-box">
<h3>兼容性规则:</h3>
<p>seashell + starfish → 经典海洋组合 (0.95)</p>
<p>seashell + pearl → 优雅搭配 (0.92)</p>
<p>seashell + crystal → 风格冲突风险 (0.78)</p>
<h3>物理约束:</h3>
<p>总重量 &lt; 挂钩承重 × 0.8</p>
<p>元素尺寸比例 1:0.3~0.7</p>
</div>
</div>
<div class="right">
<h2>兼容性检查示例</h2>
<div class="check-box">
<h3>⚠ 用户请求："把贝壳换成大水晶"</h3>
<p>水晶与现有海星风格差异较大 (兼容度 78%)</p>
<p>大水晶可能超过挂钩承重限制</p>
<div class="suggest-box">
<h4>建议方案:</h4>
<p>A. 使用小号水晶 (解决承重问题)</p>
<p>B. 使用海洋风水晶 (提升风格兼容)</p>
<p>C. 同时更换海星为更现代的元素</p>
</div>
</div>
<p style="font-size: 7pt; color: #64748B; margin: 8pt 0 0 0; line-height: 1.4;">知识图谱会根据用户行为数据持续优化，元素兼容性规则越来越符合实际市场偏好</p>
</div>
</div>
</body></html>`
  },

  // 第十页：分层更新策略
  {
    name: 'slide10-update-strategy',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 12pt 25pt; flex: 1; display: flex; gap: 15pt; }
.left { flex: 1.4; }
.right { flex: 1; }
h2 { font-size: 10pt; color: #1E3A8A; margin: 0 0 6pt 0; }
.layer-container { display: flex; flex-direction: column; gap: 6pt; }
.layer-card { background: #F8FAFC; border-left: 3pt solid #3B82F6; border-radius: 0 5pt 5pt 0; padding: 8pt 10pt; }
.layer-card.l2 { border-color: #0EA5E9; }
.layer-card.l3 { border-color: #10B981; }
.layer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4pt; }
.layer-header h3 { font-size: 9pt; color: #1E3A8A; margin: 0; }
.layer-freq { background: #E2E8F0; padding: 1pt 4pt; border-radius: 2pt; }
.layer-freq p { font-size: 7pt; color: #64748B; margin: 0; }
.layer-card p { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.layer-card .detail { color: #64748B; }
.safety-table { background: #F1F5F9; border-radius: 5pt; overflow: hidden; }
.safety-header { background: #1E3A8A; padding: 5pt 8pt; }
.safety-header p { font-size: 7pt; color: white; margin: 0; }
.safety-row { padding: 5pt 8pt; border-bottom: 1pt solid #E2E8F0; }
.safety-row:last-child { border-bottom: none; }
.safety-row p { font-size: 7pt; color: #1E293B; margin: 0; }
.safety-row b { color: #1E3A8A; }
</style></head>
<body>
<div class="header"><h1>确保系统稳定进化</h1></div>
<div class="content">
<div class="left">
<h2>三层更新机制</h2>
<div class="layer-container">
<div class="layer-card">
<div class="layer-header"><h3>Layer 1: 核心本体</h3><div class="layer-freq"><p>月度 · 人工审核</p></div></div>
<p>元素定义、物理约束规则、基础风格分类</p>
<p class="detail">流程: 自动候选 → 专家审核 → 回归测试 → 灰度发布</p>
</div>
<div class="layer-card l2">
<div class="layer-header"><h3>Layer 2: 组合规则</h3><div class="layer-freq"><p>周度 · 自动+抽检</p></div></div>
<p>元素兼容性分数、风格组合效果、Prompt模板成功率</p>
<p class="detail">条件: 样本量 ≥ 30 且 统计显著性 p &lt; 0.05</p>
</div>
<div class="layer-card l3">
<div class="layer-header"><h3>Layer 3: 动态参数</h3><div class="layer-freq"><p>每日 · 全自动</p></div></div>
<p>元素推荐权重、Prompt基因块权重、个性化偏好</p>
<p class="detail">方式: 基于滑动窗口 (最近7天) 实时计算</p>
</div>
</div>
</div>
<div class="right">
<h2>安全保障机制</h2>
<div class="safety-table">
<div class="safety-header"><p>机制 | 作用</p></div>
<div class="safety-row"><p><b>置信度门槛</b> | 新规则需30+样本支持</p></div>
<div class="safety-row"><p><b>金丝雀发布</b> | 5%→20%→100%渐进</p></div>
<div class="safety-row"><p><b>异常回滚</b> | 质量下降自动触发</p></div>
<div class="safety-row"><p><b>冲突检测</b> | 新旧规则矛盾检查</p></div>
</div>
<p style="font-size: 7pt; color: #64748B; margin: 10pt 0 0 0; line-height: 1.4;">确保系统越用越好，而不会因为错误学习导致退化</p>
</div>
</div>
</body></html>`
  },

  // 第十一页：应用场景
  {
    name: 'slide11-scenarios',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 12pt 20pt; flex: 1; display: flex; flex-wrap: wrap; gap: 10pt; align-content: flex-start; }
.scenario-card { width: calc(33.33% - 8pt); background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; padding: 8pt; }
.scenario-card h2 { font-size: 10pt; color: #1E3A8A; margin: 0 0 3pt 0; }
.scenario-card .desc { font-size: 7pt; color: #64748B; margin: 0 0 5pt 0; }
.scenario-card ul { margin: 0; padding-left: 10pt; }
.scenario-card li { font-size: 6pt; color: #1E293B; margin: 1pt 0; }
.highlight-box { background: #EFF6FF; display: inline-block; padding: 2pt 4pt; border-radius: 2pt; margin-top: 4pt; }
.highlight-box p { font-size: 6pt; color: #1E3A8A; margin: 0; }
</style></head>
<body>
<div class="header"><h1>覆盖设计全流程的场景支持</h1></div>
<div class="content">
<div class="scenario-card">
<h2>🎨 新品快速探索</h2>
<p class="desc">为下季度开发新品系列</p>
<ul>
<li>输入目标人群和风格需求</li>
<li>自动匹配12个相关参考</li>
<li>生成4个差异化方案对比</li>
</ul>
<div class="highlight-box"><p>选择方案后进入精修模式</p></div>
</div>
<div class="scenario-card">
<h2>⚡ 客户即时定制</h2>
<p class="desc">客户现场提出定制需求</p>
<ul>
<li>0:00 输入需求</li>
<li>0:15 生成4个候选方案</li>
<li>0:45 精修输出</li>
</ul>
<div class="highlight-box"><p>全程1分钟内完成</p></div>
</div>
<div class="scenario-card">
<h2>📈 爆款系列衍生</h2>
<p class="desc">基于热销款快速扩展</p>
<ul>
<li>配色变体 (6款)</li>
<li>元素变体 (4款)</li>
<li>尺寸变体 (3款)</li>
</ul>
<div class="highlight-box"><p>一键生成13个SKU变体</p></div>
</div>
<div class="scenario-card">
<h2>🎄 节日主题快速响应</h2>
<p class="desc">节日/热点主题快速出品</p>
<ul>
<li>圣诞: 红绿金 + 雪花铃铛</li>
<li>春节: 红金 + 锦鲤福字</li>
<li>情人节: 粉红 + 爱心玫瑰</li>
</ul>
<div class="highlight-box"><p>预设模板一键生成</p></div>
</div>
<div class="scenario-card">
<h2>🔄 风格迁移尝试</h2>
<p class="desc">探索同一产品不同风格</p>
<ul>
<li>Kawaii 可爱版</li>
<li>极简主义简约版</li>
<li>复古怀旧版</li>
</ul>
<div class="highlight-box"><p>保持核心元素，调整表达</p></div>
</div>
</div>
</body></html>`
  },

  // 第十二页：技术架构
  {
    name: 'slide12-architecture',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 10pt 25pt; flex: 1; display: flex; flex-direction: column; gap: 5pt; }
.arch-layer { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 4pt; padding: 6pt 10pt; display: flex; align-items: center; }
.layer-label { width: 70pt; }
.layer-label h3 { font-size: 9pt; color: #1E3A8A; margin: 0; }
.layer-label p { font-size: 6pt; color: #64748B; margin: 1pt 0 0 0; }
.layer-content { flex: 1; display: flex; gap: 6pt; }
.layer-box { background: #3B82F6; padding: 4pt 8pt; border-radius: 3pt; }
.layer-box p { font-size: 7pt; color: white; margin: 0; }
.layer-box.accent { background: #0EA5E9; }
.layer-box.green { background: #10B981; }
.arrow-row { text-align: center; padding: 2pt 0; }
.arrow-row p { font-size: 10pt; color: #3B82F6; margin: 0; }
.feedback-layer { background: #FEF3C7; border-color: #F59E0B; }
.feedback-layer .layer-box { background: #F59E0B; }
.update-layer { background: #DCFCE7; border-color: #10B981; }
.update-layer .layer-box { background: #10B981; }
</style></head>
<body>
<div class="header"><h1>完整数据流与模块协作</h1></div>
<div class="content">
<div class="arch-layer">
<div class="layer-label"><h3>用户交互层</h3><p>输入方式</p></div>
<div class="layer-content">
<div class="layer-box"><p>上传参考图</p></div>
<div class="layer-box"><p>文字描述需求</p></div>
<div class="layer-box"><p>选择场景预设</p></div>
<div class="layer-box"><p>对话式修改</p></div>
</div>
</div>
<div class="arrow-row"><p>↓</p></div>
<div class="arch-layer">
<div class="layer-label"><h3>Agent 智能层</h3><p>核心决策</p></div>
<div class="layer-content">
<div class="layer-box accent"><p>意图理解</p></div>
<div class="layer-box accent"><p>知识图谱查询</p></div>
<div class="layer-box accent"><p>参考图检索</p></div>
<div class="layer-box accent"><p>Prompt 编排</p></div>
</div>
</div>
<div class="arrow-row"><p>↓</p></div>
<div class="arch-layer">
<div class="layer-label"><h3>图像生成层</h3><p>执行引擎</p></div>
<div class="layer-content">
<div class="layer-box green"><p>Nano Banana-2</p></div>
<div class="layer-box green"><p>图生图: 参考+编辑</p></div>
<div class="layer-box green"><p>文生图: Prompt+匹配</p></div>
</div>
</div>
<div class="arrow-row"><p>↓</p></div>
<div class="arch-layer feedback-layer">
<div class="layer-label"><h3>质量评估层</h3><p>反馈采集</p></div>
<div class="layer-content">
<div class="layer-box"><p>自动质量评分</p></div>
<div class="layer-box"><p>用户行为采集</p></div>
<div class="layer-box"><p>显式反馈收集</p></div>
</div>
</div>
<div class="arrow-row"><p>↓</p></div>
<div class="arch-layer update-layer">
<div class="layer-label"><h3>知识库更新</h3><p>持续进化</p></div>
<div class="layer-content">
<div class="layer-box"><p>Prompt权重调整</p></div>
<div class="layer-box"><p>兼容性更新</p></div>
<div class="layer-box"><p>Agent策略优化</p></div>
</div>
</div>
</div>
</body></html>`
  },

  // 第十三页：总结
  {
    name: 'slide13-summary',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 12pt 25pt; flex: 1; display: flex; gap: 20pt; }
.left { flex: 1.2; }
.right { flex: 1; }
h2 { font-size: 10pt; color: #1E3A8A; margin: 0 0 8pt 0; }
.cap-table { display: flex; flex-direction: column; gap: 4pt; }
.cap-row { display: flex; gap: 6pt; align-items: center; }
.cap-label { width: 70pt; }
.cap-label p { font-size: 8pt; color: #1E3A8A; font-weight: bold; margin: 0; }
.cap-value { flex: 1; background: #F1F5F9; padding: 4pt 8pt; border-radius: 3pt; }
.cap-value p { font-size: 7pt; color: #1E293B; margin: 0; }
.evolution-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; padding: 8pt; }
.evo-stage { display: flex; align-items: flex-start; margin-bottom: 6pt; }
.evo-stage:last-child { margin-bottom: 0; }
.evo-num { background: #3B82F6; color: white; width: 16pt; height: 16pt; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; margin-right: 8pt; flex-shrink: 0; }
.evo-content h3 { font-size: 9pt; color: #1E3A8A; margin: 0; }
.evo-content p { font-size: 7pt; color: #64748B; margin: 1pt 0 0 0; }
.quote-box { background: #1E3A8A; padding: 10pt 20pt; border-radius: 5pt; margin: 0 25pt 15pt 25pt; }
.quote-box p { font-size: 8pt; color: white; margin: 0; line-height: 1.5; font-style: italic; }
</style></head>
<body>
<div class="header"><h1>自进化设计系统的核心价值</h1></div>
<div class="content">
<div class="left">
<h2>核心能力总结</h2>
<div class="cap-table">
<div class="cap-row"><div class="cap-label"><p>双模式生成</p></div><div class="cap-value"><p>图生图精修 + 文生图探索，覆盖设计全流程</p></div></div>
<div class="cap-row"><div class="cap-label"><p>对话式控制</p></div><div class="cap-value"><p>自然语言精确编辑，降低使用门槛</p></div></div>
<div class="cap-row"><div class="cap-label"><p>智能参考库</p></div><div class="cap-value"><p>结构化知识 + Prompt模板，确保生成质量</p></div></div>
<div class="cap-row"><div class="cap-label"><p>动态编排</p></div><div class="cap-value"><p>Prompt基因库智能组装，灵活应对需求</p></div></div>
<div class="cap-row"><div class="cap-label"><p>兼容性约束</p></div><div class="cap-value"><p>知识图谱驱动决策，保障设计可行性</p></div></div>
<div class="cap-row"><div class="cap-label"><p>自进化闭环</p></div><div class="cap-value"><p>反馈驱动持续优化，用得越多越智能</p></div></div>
</div>
</div>
<div class="right">
<h2>系统进化路径</h2>
<div class="evolution-box">
<div class="evo-stage"><div class="evo-num"><p>1</p></div><div class="evo-content"><h3>工具赋能</h3><p>提供高效设计生成能力</p></div></div>
<div class="evo-stage"><div class="evo-num"><p>2</p></div><div class="evo-content"><h3>知识沉淀</h3><p>形成企业专属知识库</p></div></div>
<div class="evo-stage"><div class="evo-num"><p>3</p></div><div class="evo-content"><h3>智能决策</h3><p>主动推荐设计方向</p></div></div>
<div class="evo-stage"><div class="evo-num"><p>4</p></div><div class="evo-content"><h3>设计大脑</h3><p>自主完成设计探索</p></div></div>
</div>
</div>
</div>
<div class="quote-box">
<p>我们构建的不是一个简单的 AI 绘图工具，而是一套持续进化的智能设计系统。它理解挂饰行业的专业知识，通过对话精确执行您的设计意图，从每一次使用中学习进步。用得越多，它越懂您的需求。</p>
</div>
</body></html>`
  }
];

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AI Design Platform';
  pptx.title = 'AI 挂饰设计平台 - 方案展示';

  if (!fs.existsSync(slidesDir)) {
    fs.mkdirSync(slidesDir, { recursive: true });
  }

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const htmlPath = path.join(slidesDir, `${slide.name}.html`);
    fs.writeFileSync(htmlPath, slide.html);
    console.log(`Created: ${slide.name}.html`);

    try {
      await html2pptx(htmlPath, pptx);
      console.log(`Converted: ${slide.name}`);
    } catch (err) {
      console.error(`Error converting ${slide.name}:`, err.message);
    }
  }

  const outputPath = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/AI挂饰设计平台方案.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);
}

createPresentation().catch(console.error);
