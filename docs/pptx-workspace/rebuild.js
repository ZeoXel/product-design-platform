const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/g/.claude/plugins/cache/anthropic-agent-skills/document-skills/f06b1c0701b2/document-skills/pptx/scripts/html2pptx');
const fs = require('fs');
const path = require('path');

const slidesDir = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/slides';

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AI Design Platform';
  pptx.title = 'AI 挂饰设计平台 - 方案展示';

  const slideFiles = [
    'slide01-cover.html',
    'slide02-pain-points.html',
    'slide03-solution.html',
    'slide04-dual-mode.html',
    'slide05-dialog-edit.html',
    'slide06-reference-lib.html',
    'slide07-prompt-engine.html',
    'slide08-agent-evolution.html',
    'slide09-knowledge-graph.html',
    'slide10-update-strategy.html',
    'slide11-scenarios.html',
    'slide12-architecture.html',
    'slide13-summary.html'
  ];

  for (const file of slideFiles) {
    const htmlPath = path.join(slidesDir, file);
    try {
      await html2pptx(htmlPath, pptx);
      console.log(`Converted: ${file}`);
    } catch (err) {
      console.error(`Error: ${file}:`, err.message);
    }
  }

  const outputPath = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/AI挂饰设计平台方案.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nSaved: ${outputPath}`);
}

createPresentation().catch(console.error);
