const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/g/.claude/plugins/cache/anthropic-agent-skills/document-skills/f06b1c0701b2/document-skills/pptx/scripts/html2pptx');
const fs = require('fs');
const path = require('path');

const slidesDir = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/slides-v3';

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AI Design Platform';
  pptx.title = 'AI 挂饰设计台 - 方案展示';

  const slideFiles = [
    'slide01-cover.html',
    'slide02-pain.html',
    'slide03-solution.html',
    'slide04-speed.html',
    'slide05-custom.html',
    'slide06-dialog.html',
    'slide07-production.html',
    'slide08-scenarios.html',
    'slide09-tech.html',
    'slide10-implement.html',
    'slide11-summary.html'
  ];

  for (const file of slideFiles) {
    const htmlPath = path.join(slidesDir, file);
    try {
      await html2pptx(htmlPath, pptx);
      console.log(`OK: ${file}`);
    } catch (err) {
      console.error(`ERR: ${file}:`, err.message);
    }
  }

  const outputPath = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/AI挂饰设计平台方案_v2.pptx';
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nSaved: ${outputPath}`);
}

createPresentation().catch(console.error);
