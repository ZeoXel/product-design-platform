const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/g/.claude/plugins/cache/anthropic-agent-skills/document-skills/f06b1c0701b2/document-skills/pptx/scripts/html2pptx');
const path = require('path');

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'AI Design Platform';
    pptx.title = 'AI 挂饰设计平台 - 商业方案';
    pptx.subject = '自进化的智能设计系统';

    const slidesDir = path.join(__dirname, 'slides');
    const slides = [
        'slide01-cover.html',
        'slide02-pain.html',
        'slide03-solution.html',
        'slide04-img2img.html',
        'slide05-dialog.html',
        'slide06-evolution.html',
        'slide07-library.html',
        'slide08-benefits.html',
        'slide09-differentiation.html',
        'slide10-cta.html'
    ];

    for (const slideFile of slides) {
        const htmlPath = path.join(slidesDir, slideFile);
        console.log(`Processing: ${slideFile}`);
        await html2pptx(htmlPath, pptx);
    }

    const outputPath = '/Users/g/Desktop/探索/产品设计台/docs/AI挂饰设计平台-商业方案.pptx';
    await pptx.writeFile({ fileName: outputPath });
    console.log(`Presentation saved to: ${outputPath}`);
}

createPresentation().catch(console.error);
