const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/g/.claude/plugins/cache/anthropic-agent-skills/document-skills/f06b1c0701b2/document-skills/pptx/scripts/html2pptx');
const fs = require('fs');
const path = require('path');

const slidesDir = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/slides-v3';

const slides = [
  // 封面页
  {
    name: 'slide01-cover',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #ffffff; }
.header-bar { position: absolute; top: 0; left: 0; right: 0; height: 8pt; background: #3B82F6; }
h1 { font-size: 38pt; color: #1E293B; margin: 0 0 12pt 0; text-align: center; }
.subtitle { font-size: 20pt; color: #3B82F6; margin: 0 0 25pt 0; text-align: center; }
.tagline { font-size: 14pt; color: #64748B; text-align: center; max-width: 450pt; line-height: 1.5; margin: 0; }
.highlight { color: #1E3A8A; font-weight: bold; }
</style></head>
<body>
<div class="header-bar"></div>
<h1>AI 挂饰设计台</h1>
<p class="subtitle">您的专属智能设计助手</p>
<p class="tagline">基于您的产品库，<b class="highlight">分钟级</b>生成设计稿<br/>无需AI经验，对话即可操作</p>
</body></html>`
  },

  // 第二页：客户痛点
  {
    name: 'slide02-pain',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 20pt 30pt; flex: 1; }
h2 { font-size: 14pt; color: #1E3A8A; margin: 0 0 15pt 0; }
.pain-grid { display: flex; gap: 15pt; }
.pain-card { flex: 1; background: #FEF2F2; border: 1pt solid #FECACA; border-radius: 6pt; padding: 15pt; }
.pain-card h3 { font-size: 12pt; color: #DC2626; margin: 0 0 8pt 0; }
.pain-card p { font-size: 9pt; color: #1E293B; margin: 0; line-height: 1.5; }
.bottom-text { margin-top: 20pt; text-align: center; }
.bottom-text p { font-size: 11pt; color: #64748B; margin: 0; }
.bottom-text b { color: #1E3A8A; }
</style></head>
<body>
<div class="header"><h1>设计出图，是不是经常遇到这些问题？</h1></div>
<div class="content">
<div class="pain-grid">
<div class="pain-card">
<h3>设计周期长</h3>
<p>从创意到定稿需要反复沟通，一个设计可能耗时数天甚至数周</p>
</div>
<div class="pain-card">
<h3>沟通成本高</h3>
<p>设计师理解偏差，需要多轮修改，"再调一下颜色""元素再大点"反复循环</p>
</div>
<div class="pain-card">
<h3>新品开发慢</h3>
<p>市场热点转瞬即逝，等设计稿出来，最佳销售窗口已经错过</p>
</div>
<div class="pain-card">
<h3>设计难落地</h3>
<p>好看的设计做不出来，材料不支持、工艺实现不了、成本太高</p>
</div>
</div>
<div class="bottom-text">
<p>如果有一个工具，能让您<b>几分钟就拿到可生产的设计稿</b>呢？</p>
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
.content { padding: 20pt 30pt; flex: 1; display: flex; gap: 25pt; }
.left { flex: 1; }
.right { flex: 1.2; }
h2 { font-size: 14pt; color: #1E3A8A; margin: 0 0 12pt 0; }
.feature-item { display: flex; align-items: flex-start; margin-bottom: 12pt; }
.feature-icon { background: #3B82F6; color: white; width: 24pt; height: 24pt; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12pt; margin-right: 10pt; flex-shrink: 0; }
.feature-text h3 { font-size: 11pt; color: #1E293B; margin: 0 0 3pt 0; }
.feature-text p { font-size: 9pt; color: #64748B; margin: 0; }
.demo-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 15pt; }
.demo-title { font-size: 10pt; color: #64748B; margin: 0 0 10pt 0; }
.demo-flow { display: flex; align-items: center; gap: 8pt; margin-bottom: 8pt; }
.demo-step { background: #EFF6FF; border: 1pt solid #3B82F6; padding: 8pt 12pt; border-radius: 5pt; text-align: center; }
.demo-step p { font-size: 9pt; color: #1E3A8A; margin: 0; }
.demo-step .time { font-size: 7pt; color: #64748B; margin-top: 2pt; }
.demo-arrow { font-size: 14pt; color: #3B82F6; }
</style></head>
<body>
<div class="header"><h1>为您打造的专属 AI 设计台</h1></div>
<div class="content">
<div class="left">
<h2>核心价值</h2>
<div class="feature-item">
<div class="feature-icon"><p>1</p></div>
<div class="feature-text"><h3>分钟级出图</h3><p>从想法到设计稿，只需几分钟</p></div>
</div>
<div class="feature-item">
<div class="feature-icon"><p>2</p></div>
<div class="feature-text"><h3>基于您的产品</h3><p>学习您的产品库，生成符合品牌风格的设计</p></div>
</div>
<div class="feature-item">
<div class="feature-icon"><p>3</p></div>
<div class="feature-text"><h3>对话式操作</h3><p>像聊天一样描述需求，无需专业技能</p></div>
</div>
<div class="feature-item">
<div class="feature-icon"><p>4</p></div>
<div class="feature-text"><h3>设计可落地</h3><p>自动检查材料工艺，确保能生产出来</p></div>
</div>
</div>
<div class="right">
<div class="demo-box">
<p class="demo-title">典型工作流程</p>
<div class="demo-flow">
<div class="demo-step"><p>描述需求</p><p class="time">"海洋风少女款"</p></div>
<p class="demo-arrow">→</p>
<div class="demo-step"><p>AI 生成</p><p class="time">4个方案</p></div>
<p class="demo-arrow">→</p>
<div class="demo-step"><p>对话修改</p><p class="time">"颜色淡一点"</p></div>
<p class="demo-arrow">→</p>
<div class="demo-step"><p>确认输出</p><p class="time">可生产设计稿</p></div>
</div>
<p style="font-size: 10pt; color: #10B981; text-align: center; margin: 10pt 0 0 0; font-weight: bold;">全程约 2-3 分钟</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第四页：核心能力 - 快速出图
  {
    name: 'slide04-speed',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left, .right { flex: 1; }
h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 12pt 0; }
.compare-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 12pt; margin-bottom: 10pt; }
.compare-box h3 { font-size: 10pt; color: #64748B; margin: 0 0 8pt 0; }
.compare-box.highlight { background: #EFF6FF; border-color: #3B82F6; }
.compare-box.highlight h3 { color: #1E3A8A; font-weight: bold; }
.step-row { display: flex; align-items: center; margin-bottom: 5pt; }
.step-label { font-size: 8pt; color: #1E293B; width: 80pt; }
.step-bar { height: 12pt; background: #E2E8F0; border-radius: 2pt; }
.step-bar.long { width: 150pt; background: #FCA5A5; }
.step-bar.medium { width: 100pt; background: #FCD34D; }
.step-bar.short { width: 40pt; background: #86EFAC; }
.step-time { font-size: 7pt; color: #64748B; margin-left: 6pt; }
.scenario-list { display: flex; flex-direction: column; gap: 8pt; }
.scenario-item { background: #F1F5F9; border-radius: 5pt; padding: 10pt; }
.scenario-item h4 { font-size: 10pt; color: #1E3A8A; margin: 0 0 4pt 0; }
.scenario-item p { font-size: 8pt; color: #64748B; margin: 0; }
.scenario-item b { color: #10B981; }
</style></head>
<body>
<div class="header"><h1>分钟级出图，效率提升 10 倍</h1></div>
<div class="content">
<div class="left">
<h2>传统 vs AI 设计台</h2>
<div class="compare-box">
<h3>传统流程</h3>
<div class="step-row"><p class="step-label">沟通需求</p><div class="step-bar long"></div><p class="step-time">0.5-1天</p></div>
<div class="step-row"><p class="step-label">初稿设计</p><div class="step-bar long"></div><p class="step-time">1-2天</p></div>
<div class="step-row"><p class="step-label">修改调整</p><div class="step-bar medium"></div><p class="step-time">1-3天</p></div>
<div class="step-row"><p class="step-label">最终定稿</p><div class="step-bar medium"></div><p class="step-time">0.5-1天</p></div>
</div>
<div class="compare-box highlight">
<h3>AI 设计台</h3>
<div class="step-row"><p class="step-label">描述需求</p><div class="step-bar short"></div><p class="step-time">30秒</p></div>
<div class="step-row"><p class="step-label">AI 生成</p><div class="step-bar short"></div><p class="step-time">30秒</p></div>
<div class="step-row"><p class="step-label">对话修改</p><div class="step-bar short"></div><p class="step-time">1-2分钟</p></div>
<div class="step-row"><p class="step-label">确认输出</p><div class="step-bar short"></div><p class="step-time">即时</p></div>
</div>
</div>
<div class="right">
<h2>快速响应各类场景</h2>
<div class="scenario-list">
<div class="scenario-item">
<h4>客户临时定制</h4>
<p>客户现场提需求，<b>当场就能看到设计稿</b></p>
</div>
<div class="scenario-item">
<h4>热点快速跟进</h4>
<p>网络爆款、节日主题，<b>当天出设计当天打样</b></p>
</div>
<div class="scenario-item">
<h4>批量方案探索</h4>
<p>一个需求生成多个方案，<b>快速筛选最优方向</b></p>
</div>
<div class="scenario-item">
<h4>系列产品开发</h4>
<p>基于爆款快速衍生，<b>一键生成配色/尺寸变体</b></p>
</div>
</div>
</div>
</div>
</body></html>`
  },

  // 第五页：核心能力 - 基于您的产品库
  {
    name: 'slide05-custom',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left, .right { flex: 1; }
h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 10pt 0; }
.diff-box { display: flex; gap: 10pt; margin-bottom: 12pt; }
.diff-item { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; padding: 10pt; }
.diff-item h3 { font-size: 9pt; color: #64748B; margin: 0 0 6pt 0; }
.diff-item p { font-size: 8pt; color: #1E293B; margin: 2pt 0; }
.diff-item.bad { background: #FEF2F2; border-color: #FECACA; }
.diff-item.bad h3 { color: #DC2626; }
.diff-item.good { background: #F0FDF4; border-color: #86EFAC; }
.diff-item.good h3 { color: #16A34A; }
.process-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 12pt; }
.process-box h3 { font-size: 10pt; color: #1E3A8A; margin: 0 0 8pt 0; }
.process-step { display: flex; align-items: flex-start; margin-bottom: 8pt; }
.process-num { background: #3B82F6; color: white; width: 16pt; height: 16pt; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; margin-right: 8pt; flex-shrink: 0; }
.process-text p { font-size: 8pt; color: #1E293B; margin: 0; }
.process-text .sub { color: #64748B; font-size: 7pt; }
</style></head>
<body>
<div class="header"><h1>不是通用AI，是您的专属设计台</h1></div>
<div class="content">
<div class="left">
<h2>通用 AI vs 专属设计台</h2>
<div class="diff-box">
<div class="diff-item bad">
<h3>通用 AI 绘图</h3>
<p>不了解您的产品风格</p>
<p>不知道材料工艺限制</p>
<p>每次都要详细描述</p>
<p>生成结果难以落地</p>
</div>
<div class="diff-item good">
<h3>您的专属设计台</h3>
<p>学习您现有产品库</p>
<p>内置您的工艺约束</p>
<p>理解您的品牌语言</p>
<p>输出可直接生产</p>
</div>
</div>
<p style="font-size: 9pt; color: #64748B; margin: 0; line-height: 1.5;">系统基于您的产品数据训练，越用越懂您的设计偏好</p>
</div>
<div class="right">
<h2>如何建立您的专属设计台</h2>
<div class="process-box">
<h3>初始化流程</h3>
<div class="process-step">
<div class="process-num"><p>1</p></div>
<div class="process-text"><p>导入产品图库</p><p class="sub">您现有的产品照片、设计稿</p></div>
</div>
<div class="process-step">
<div class="process-num"><p>2</p></div>
<div class="process-text"><p>配置工艺参数</p><p class="sub">材料、尺寸、工艺限制等</p></div>
</div>
<div class="process-step">
<div class="process-num"><p>3</p></div>
<div class="process-text"><p>系统自动学习</p><p class="sub">分析风格、元素、配色规律</p></div>
</div>
<div class="process-step">
<div class="process-num"><p>4</p></div>
<div class="process-text"><p>开始使用</p><p class="sub">生成符合您品牌风格的设计</p></div>
</div>
</div>
</div>
</div>
</body></html>`
  },

  // 第六页：核心能力 - 对话式操作
  {
    name: 'slide06-dialog',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left { flex: 1.2; }
.right { flex: 1; }
h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 10pt 0; }
.chat-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 12pt; }
.chat-msg { margin-bottom: 8pt; }
.chat-msg.user { text-align: right; }
.chat-bubble { display: inline-block; padding: 6pt 10pt; border-radius: 8pt; max-width: 200pt; }
.chat-msg.user .chat-bubble { background: #3B82F6; color: white; text-align: left; }
.chat-msg.ai .chat-bubble { background: #E2E8F0; color: #1E293B; }
.chat-bubble p { font-size: 9pt; margin: 0; }
.chat-result { background: #F0FDF4; border: 1pt solid #86EFAC; border-radius: 5pt; padding: 8pt; margin-top: 8pt; text-align: center; }
.chat-result p { font-size: 8pt; color: #16A34A; margin: 0; }
.example-grid { display: flex; flex-direction: column; gap: 6pt; }
.example-item { background: #F1F5F9; border-radius: 4pt; padding: 8pt; }
.example-item .cmd { font-size: 9pt; color: #1E3A8A; margin: 0 0 3pt 0; font-weight: bold; }
.example-item .desc { font-size: 8pt; color: #64748B; margin: 0; }
</style></head>
<body>
<div class="header"><h1>像聊天一样做设计，无需专业技能</h1></div>
<div class="content">
<div class="left">
<h2>对话式设计流程</h2>
<div class="chat-box">
<div class="chat-msg user"><div class="chat-bubble"><p>我想要一款海洋风的少女系挂饰</p></div></div>
<div class="chat-msg ai"><div class="chat-bubble"><p>好的，我为您生成了4个方案，请查看</p></div></div>
<div class="chat-msg user"><div class="chat-bubble"><p>第二个不错，但贝壳能大一点吗</p></div></div>
<div class="chat-msg ai"><div class="chat-bubble"><p>已调整贝壳尺寸，请确认</p></div></div>
<div class="chat-msg user"><div class="chat-bubble"><p>颜色再粉嫩一些</p></div></div>
<div class="chat-msg ai"><div class="chat-bubble"><p>已调整配色，更加粉嫩柔和</p></div></div>
<div class="chat-result"><p>✓ 设计确认，可导出生产稿</p></div>
</div>
</div>
<div class="right">
<h2>支持的操作指令</h2>
<div class="example-grid">
<div class="example-item">
<p class="cmd">"换成蓝色系"</p>
<p class="desc">智能替换整体配色方案</p>
</div>
<div class="example-item">
<p class="cmd">"元素再大一点"</p>
<p class="desc">精确调整指定元素尺寸</p>
</div>
<div class="example-item">
<p class="cmd">"风格更可爱些"</p>
<p class="desc">调整整体风格走向</p>
</div>
<div class="example-item">
<p class="cmd">"加一些珍珠点缀"</p>
<p class="desc">添加装饰元素</p>
</div>
<div class="example-item">
<p class="cmd">"简化一下设计"</p>
<p class="desc">减少复杂度，更简洁</p>
</div>
</div>
</div>
</div>
</body></html>`
  },

  // 第七页：核心能力 - 设计可落地
  {
    name: 'slide07-production',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 18pt 30pt; flex: 1; display: flex; gap: 20pt; }
.left, .right { flex: 1; }
h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 10pt 0; }
.check-list { display: flex; flex-direction: column; gap: 8pt; }
.check-item { background: #F0FDF4; border: 1pt solid #86EFAC; border-radius: 5pt; padding: 10pt; display: flex; align-items: flex-start; }
.check-icon { color: #16A34A; font-size: 12pt; margin-right: 8pt; }
.check-text h3 { font-size: 10pt; color: #1E293B; margin: 0 0 3pt 0; }
.check-text p { font-size: 8pt; color: #64748B; margin: 0; }
.warn-box { background: #FEF3C7; border: 1pt solid #FCD34D; border-radius: 6pt; padding: 12pt; }
.warn-box h3 { font-size: 10pt; color: #92400E; margin: 0 0 8pt 0; }
.warn-item { display: flex; align-items: flex-start; margin-bottom: 6pt; }
.warn-icon { color: #F59E0B; font-size: 10pt; margin-right: 6pt; }
.warn-text p { font-size: 8pt; color: #78350F; margin: 0 0 2pt 0; }
.warn-text .suggest { color: #16A34A; }
.output-box { background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 5pt; padding: 10pt; margin-top: 10pt; }
.output-box h3 { font-size: 9pt; color: #1E3A8A; margin: 0 0 6pt 0; }
.output-box p { font-size: 8pt; color: #1E293B; margin: 2pt 0; }
</style></head>
<body>
<div class="header"><h1>确保每个设计都能生产出来</h1></div>
<div class="content">
<div class="left">
<h2>自动检查项</h2>
<div class="check-list">
<div class="check-item">
<p class="check-icon">✓</p>
<div class="check-text"><h3>材料可用性</h3><p>检查设计中的材料是否在您的供应范围内</p></div>
</div>
<div class="check-item">
<p class="check-icon">✓</p>
<div class="check-text"><h3>工艺可行性</h3><p>验证设计是否符合现有生产工艺能力</p></div>
</div>
<div class="check-item">
<p class="check-icon">✓</p>
<div class="check-text"><h3>尺寸合理性</h3><p>确保元素比例、整体尺寸在合理范围</p></div>
</div>
<div class="check-item">
<p class="check-icon">✓</p>
<div class="check-text"><h3>结构稳定性</h3><p>检查承重、连接点等物理约束</p></div>
</div>
</div>
</div>
<div class="right">
<h2>智能提示与建议</h2>
<div class="warn-box">
<h3>⚠ 检测到潜在问题</h3>
<div class="warn-item">
<p class="warn-icon">!</p>
<div class="warn-text"><p>大号水晶可能超过挂钩承重</p><p class="suggest">建议：使用小号水晶或加固挂钩</p></div>
</div>
<div class="warn-item">
<p class="warn-icon">!</p>
<div class="warn-text"><p>该配色组合染料成本较高</p><p class="suggest">建议：可替换为相近色号降低成本</p></div>
</div>
</div>
<div class="output-box">
<h3>输出内容</h3>
<p>✓ 高清设计效果图</p>
<p>✓ 元素清单及规格</p>
<p>✓ 工艺说明及注意事项</p>
<p>✓ 可直接用于打样生产</p>
</div>
</div>
</div>
</body></html>`
  },

  // 第八页：丰富场景
  {
    name: 'slide08-scenarios',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 15pt 25pt; flex: 1; display: flex; flex-wrap: wrap; gap: 12pt; align-content: flex-start; }
.scenario-card { width: calc(33.33% - 10pt); background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 12pt; }
.scenario-card h2 { font-size: 11pt; color: #1E3A8A; margin: 0 0 6pt 0; }
.scenario-card .desc { font-size: 8pt; color: #64748B; margin: 0 0 8pt 0; }
.scenario-card ul { margin: 0; padding-left: 12pt; }
.scenario-card li { font-size: 7pt; color: #1E293B; margin: 2pt 0; }
.highlight-tag { background: #EFF6FF; display: inline-block; padding: 2pt 6pt; border-radius: 3pt; margin-top: 6pt; }
.highlight-tag p { font-size: 7pt; color: #1E3A8A; margin: 0; font-weight: bold; }
</style></head>
<body>
<div class="header"><h1>覆盖您的各类设计场景</h1></div>
<div class="content">
<div class="scenario-card">
<h2>🎨 新品开发</h2>
<p class="desc">为新季度开发产品系列</p>
<ul>
<li>输入主题和目标人群</li>
<li>快速生成多个方案对比</li>
<li>选定后继续细化调整</li>
</ul>
<div class="highlight-tag"><p>探索阶段首选</p></div>
</div>
<div class="scenario-card">
<h2>⚡ 客户定制</h2>
<p class="desc">客户现场提出个性需求</p>
<ul>
<li>当场描述需求生成方案</li>
<li>客户参与实时调整</li>
<li>满意后直接下单</li>
</ul>
<div class="highlight-tag"><p>1分钟内响应</p></div>
</div>
<div class="scenario-card">
<h2>📈 爆款衍生</h2>
<p class="desc">基于热销款扩展产品线</p>
<ul>
<li>上传爆款图片</li>
<li>一键生成配色/尺寸变体</li>
<li>快速丰富SKU</li>
</ul>
<div class="highlight-tag"><p>批量生成10+变体</p></div>
</div>
<div class="scenario-card">
<h2>🎄 节日主题</h2>
<p class="desc">快速响应节日/热点</p>
<ul>
<li>内置圣诞/春节/情人节模板</li>
<li>选择主题一键生成</li>
<li>当天出设计当天打样</li>
</ul>
<div class="highlight-tag"><p>抓住销售窗口</p></div>
</div>
<div class="scenario-card">
<h2>🔄 风格探索</h2>
<p class="desc">同一产品多种风格尝试</p>
<ul>
<li>可爱风 / 极简风 / 复古风</li>
<li>快速对比不同方向</li>
<li>找到最佳市场定位</li>
</ul>
<div class="highlight-tag"><p>降低试错成本</p></div>
</div>
<div class="scenario-card">
<h2>📋 批量出图</h2>
<p class="desc">产品目录/电商图片</p>
<ul>
<li>统一风格批量生成</li>
<li>多角度展示图</li>
<li>适配各平台尺寸</li>
</ul>
<div class="highlight-tag"><p>电商运营利器</p></div>
</div>
</div>
</body></html>`
  },

  // 第九页：技术亮点（简化）
  {
    name: 'slide09-tech',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 20pt 30pt; flex: 1; }
h2 { font-size: 14pt; color: #1E3A8A; margin: 0 0 15pt 0; text-align: center; }
.tech-grid { display: flex; gap: 20pt; }
.tech-card { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 8pt; padding: 15pt; text-align: center; }
.tech-icon { font-size: 28pt; margin-bottom: 10pt; }
.tech-card h3 { font-size: 12pt; color: #1E3A8A; margin: 0 0 8pt 0; }
.tech-card p { font-size: 9pt; color: #64748B; margin: 0; line-height: 1.5; }
.bottom-note { margin-top: 20pt; text-align: center; }
.bottom-note p { font-size: 10pt; color: #64748B; margin: 0; }
.bottom-note b { color: #1E3A8A; }
</style></head>
<body>
<div class="header"><h1>技术亮点：越用越懂您</h1></div>
<div class="content">
<h2>系统会持续学习，不断提升设计质量</h2>
<div class="tech-grid">
<div class="tech-card">
<p class="tech-icon">📚</p>
<h3>智能产品库</h3>
<p>分析您的产品风格规律<br/>自动提取成功设计经验<br/>新设计延续品牌基因</p>
</div>
<div class="tech-card">
<p class="tech-icon">🎯</p>
<h3>偏好学习</h3>
<p>记录您的选择和修改<br/>理解您的审美偏好<br/>推荐越来越精准</p>
</div>
<div class="tech-card">
<p class="tech-icon">🔧</p>
<h3>工艺知识库</h3>
<p>内置材料工艺约束<br/>自动检查生产可行性<br/>避免设计无法落地</p>
</div>
<div class="tech-card">
<p class="tech-icon">📈</p>
<h3>持续优化</h3>
<p>收集使用反馈数据<br/>自动优化生成效果<br/>系统越用越好用</p>
</div>
</div>
<div class="bottom-note">
<p>这是一套<b>会成长的系统</b>，而不是一成不变的工具</p>
</div>
</div>
</body></html>`
  },

  // 第十页：实施方案
  {
    name: 'slide10-implement',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 20pt 30pt; flex: 1; }
h2 { font-size: 13pt; color: #1E3A8A; margin: 0 0 15pt 0; }
.timeline { display: flex; gap: 12pt; margin-bottom: 20pt; }
.phase { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 12pt; position: relative; }
.phase-num { position: absolute; top: -8pt; left: 12pt; background: #3B82F6; color: white; padding: 2pt 8pt; border-radius: 10pt; font-size: 8pt; }
.phase h3 { font-size: 10pt; color: #1E3A8A; margin: 8pt 0 6pt 0; }
.phase p { font-size: 8pt; color: #64748B; margin: 2pt 0; }
.phase .highlight { color: #1E293B; font-weight: bold; }
.deliverables { background: #F0FDF4; border: 1pt solid #86EFAC; border-radius: 6pt; padding: 12pt; }
.deliverables h3 { font-size: 11pt; color: #16A34A; margin: 0 0 8pt 0; }
.del-grid { display: flex; gap: 15pt; }
.del-item { flex: 1; }
.del-item h4 { font-size: 9pt; color: #1E293B; margin: 0 0 4pt 0; }
.del-item p { font-size: 8pt; color: #64748B; margin: 0; }
</style></head>
<body>
<div class="header"><h1>落地实施方案</h1></div>
<div class="content">
<h2>项目实施流程</h2>
<div class="timeline">
<div class="phase">
<p class="phase-num">第1阶段</p>
<h3>需求调研</h3>
<p>了解产品品类特点</p>
<p>梳理工艺材料约束</p>
<p>确定功能优先级</p>
<p class="highlight">约1周</p>
</div>
<div class="phase">
<p class="phase-num">第2阶段</p>
<h3>数据准备</h3>
<p>收集产品图库</p>
<p>整理元素素材</p>
<p>配置工艺参数</p>
<p class="highlight">约1-2周</p>
</div>
<div class="phase">
<p class="phase-num">第3阶段</p>
<h3>系统搭建</h3>
<p>部署AI设计台</p>
<p>导入产品数据</p>
<p>系统训练调优</p>
<p class="highlight">约2-3周</p>
</div>
<div class="phase">
<p class="phase-num">第4阶段</p>
<h3>上线运营</h3>
<p>团队培训使用</p>
<p>试运行调整</p>
<p>正式投入使用</p>
<p class="highlight">约1周</p>
</div>
</div>
<div class="deliverables">
<h3>交付内容</h3>
<div class="del-grid">
<div class="del-item"><h4>专属设计台系统</h4><p>基于您产品库训练的AI设计工具</p></div>
<div class="del-item"><h4>操作培训</h4><p>团队使用培训及操作手册</p></div>
<div class="del-item"><h4>持续服务</h4><p>系统维护及功能迭代支持</p></div>
</div>
</div>
</div>
</body></html>`
  },

  // 第十一页：总结
  {
    name: 'slide11-summary',
    html: `<!DOCTYPE html>
<html><head><style>
html { background: #ffffff; }
body { width: 720pt; height: 405pt; margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; background: #ffffff; }
.header { background: #3B82F6; padding: 12pt 25pt; }
.header h1 { font-size: 22pt; color: #ffffff; margin: 0; }
.content { padding: 20pt 30pt; flex: 1; display: flex; flex-direction: column; }
.summary-grid { display: flex; gap: 15pt; margin-bottom: 20pt; }
.summary-card { flex: 1; background: #F8FAFC; border: 1pt solid #E2E8F0; border-radius: 6pt; padding: 15pt; text-align: center; }
.summary-card .icon { font-size: 24pt; margin-bottom: 8pt; }
.summary-card h3 { font-size: 12pt; color: #1E3A8A; margin: 0 0 6pt 0; }
.summary-card p { font-size: 9pt; color: #64748B; margin: 0; }
.cta-box { background: #1E3A8A; border-radius: 8pt; padding: 20pt; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; }
.cta-box h2 { font-size: 18pt; color: #ffffff; margin: 0 0 10pt 0; }
.cta-box p { font-size: 11pt; color: #93C5FD; margin: 0; }
</style></head>
<body>
<div class="header"><h1>您的专属 AI 设计助手</h1></div>
<div class="content">
<div class="summary-grid">
<div class="summary-card">
<p class="icon">⚡</p>
<h3>快</h3>
<p>分钟级出图<br/>效率提升10倍</p>
</div>
<div class="summary-card">
<p class="icon">🎯</p>
<h3>准</h3>
<p>基于您的产品库<br/>符合品牌风格</p>
</div>
<div class="summary-card">
<p class="icon">💬</p>
<h3>易</h3>
<p>对话式操作<br/>无需专业技能</p>
</div>
<div class="summary-card">
<p class="icon">✓</p>
<h3>实</h3>
<p>设计可落地<br/>直接用于生产</p>
</div>
</div>
<div class="cta-box">
<h2>让设计不再成为产品开发的瓶颈</h2>
<p>从想法到可生产的设计稿，只需几分钟</p>
</div>
</div>
</body></html>`
  }
];

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AI Design Platform';
  pptx.title = 'AI 挂饰设计台 - 方案展示';

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
      console.error(`Error: ${slide.name}:`, err.message);
    }
  }

  const outputPath = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/AI挂饰设计平台方案_v2.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nSaved: ${outputPath}`);
}

createPresentation().catch(console.error);
