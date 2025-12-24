const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType,
        VerticalAlign, HeadingLevel, PageBreak } = require('docx');
const fs = require('fs');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 48, bold: true, color: "1E3A8A", font: "Arial" },
        paragraph: { spacing: { before: 400, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "1E3A8A", font: "Arial" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "3B82F6", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-1",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-2",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      // Title
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("AI 挂饰设计台")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
        children: [new TextRun({ text: "智能设计解决方案", size: 28, color: "64748B" })] }),

      // Executive Summary
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("方案概述")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("AI 挂饰设计台是一款专为产品生产厂商打造的智能设计工具。它基于您的产品库进行专属训练，让设计师能够通过简单的对话描述，在分钟内完成从创意到可落地生产的设计稿。无需AI技术背景，即可享受人工智能带来的效率提升。")
      ]}),

      // Pain Points
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("当前设计困境")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("产品设计开发过程中，厂商普遍面临以下挑战：")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "设计周期长：", bold: true }), new TextRun("从需求沟通到定稿通常需要3-7天，响应速度慢")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "沟通成本高：", bold: true }), new TextRun("设计师难以准确理解产品特性，反复修改耗费大量时间")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "快速响应难：", bold: true }), new TextRun("热点跟进、客户临时需求难以及时满足")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "落地可行性：", bold: true }), new TextRun("设计稿常忽略材料、工艺约束，生产时需大幅调整")] }),

      // Solution Overview
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("解决方案")] }),
      new Paragraph({ spacing: { after: 200 }, children: [
        new TextRun("AI 挂饰设计台通过四大核心能力，全面解决上述问题：")
      ]}),

      // Core Capabilities Table
      createCapabilitiesTable(),

      new Paragraph({ children: [new PageBreak()] }),

      // Detailed Capabilities
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("核心能力详解")] }),

      // 1. Fast Output
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("一、分钟级出图")] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun("传统设计流程与AI设计台效率对比：")] }),
      createComparisonTable(),
      new Paragraph({ spacing: { before: 100, after: 200 }, children: [
        new TextRun("效率提升"),
        new TextRun({ text: " 10倍以上", bold: true, color: "16A34A" }),
        new TextRun("，设计周期从「天」缩短到「分钟」。")
      ]}),

      // 2. Customization
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("二、专属定制")] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun("这不是通用的AI绘画工具，而是基于您产品库专门训练的设计系统：")
      ]}),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "产品风格学习：", bold: true }), new TextRun("深入理解您产品的设计语言和品牌调性")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "元素库匹配：", bold: true }), new TextRun("自动使用您现有的图案、配件、材质元素")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "约束条件配置：", bold: true }), new TextRun("内置您的材料参数、工艺限制、尺寸规格")] }),

      // 3. Dialog Operation
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("三、对话式操作")] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun("无需专业设计软件技能，像聊天一样完成设计：")
      ]}),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "自然语言输入：", bold: true }), new TextRun("\"设计一款圣诞主题的雪花挂饰，红绿配色\"")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "对话式修改：", bold: true }), new TextRun("\"把雪花换成更复杂的图案\"、\"颜色再亮一点\"")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "上传参考图：", bold: true }), new TextRun("支持以图生图，基于参考快速出设计")] }),

      // 4. Production Ready
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("四、可落地生产")] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun("设计稿不只是好看，更能直接投产：")
      ]}),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "自动校验：", bold: true }), new TextRun("实时检查材料可用性、工艺可行性、尺寸合规性")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "成本预估：", bold: true }), new TextRun("生成设计同时提供材料成本和工时估算")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "生产文件：", bold: true }), new TextRun("一键导出生产图纸、工艺说明等文件")] }),

      new Paragraph({ children: [new PageBreak()] }),

      // Application Scenarios
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("应用场景")] }),
      createScenariosTable(),

      // Tech Highlights
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun("技术亮点")] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun("系统采用先进的AI技术架构，确保持续优化和稳定运行：")
      ]}),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "自学习机制：", bold: true }), new TextRun("系统会从每次设计反馈中学习，越用越懂您的需求")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "知识图谱：", bold: true }), new TextRun("构建产品、材料、工艺的关联关系，确保设计合理性")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "动态提示词：", bold: true }), new TextRun("智能组合设计指令，确保输出质量稳定")] }),

      // Implementation Plan
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("实施方案")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("项目分四个阶段推进，总周期约5-7周：")] }),
      createImplementationTable(),

      // Deliverables
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("交付内容")] }),
      new Paragraph({ numbering: { reference: "numbered-2", level: 0 },
        children: [new TextRun({ text: "专属设计台系统：", bold: true }), new TextRun("基于您产品库训练的AI设计工具")] }),
      new Paragraph({ numbering: { reference: "numbered-2", level: 0 },
        children: [new TextRun({ text: "操作培训：", bold: true }), new TextRun("团队使用培训及操作手册")] }),
      new Paragraph({ numbering: { reference: "numbered-2", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "持续服务：", bold: true }), new TextRun("系统维护及功能迭代支持")] }),

      // Summary
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("总结")] }),
      new Paragraph({ spacing: { after: 100 }, children: [
        new TextRun("AI 挂饰设计台为您提供：")
      ]}),
      createSummaryTable(),
      new Paragraph({ spacing: { before: 300 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "让设计变得简单，让创意快速落地。", size: 24, bold: true, color: "1E3A8A" })
      ]}),
    ]
  }]
});

function createCapabilitiesTable() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [2340, 2340, 2340, 2340],
    rows: [
      new TableRow({ children: [
        createCell("分钟级出图", "传统需3-7天\nAI只需几分钟", "EFF6FF", borders),
        createCell("专属定制", "基于您的产品库训练\n不是通用AI工具", "F0FDF4", borders),
        createCell("对话操作", "像聊天一样做设计\n无需专业技能", "FEF3C7", borders),
        createCell("可落地生产", "自动校验工艺约束\n设计即可投产", "FDF2F8", borders),
      ]})
    ]
  });
}

function createCell(title, desc, fill, borders) {
  return new TableCell({
    borders, width: { size: 2340, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
        children: [new TextRun({ text: title, bold: true, size: 22, color: "1E3A8A" })] }),
      ...desc.split('\n').map(line =>
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: line, size: 18, color: "64748B" })] }))
    ]
  });
}

function createComparisonTable() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    columnWidths: [3120, 3120, 3120],
    rows: [
      new TableRow({ tableHeader: true, children: [
        new TableCell({ borders, width: { size: 3120, type: WidthType.DXA },
          shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "环节", bold: true })] })] }),
        new TableCell({ borders, width: { size: 3120, type: WidthType.DXA },
          shading: { fill: "FEE2E2", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "传统流程", bold: true })] })] }),
        new TableCell({ borders, width: { size: 3120, type: WidthType.DXA },
          shading: { fill: "DCFCE7", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "AI设计台", bold: true })] })] }),
      ]}),
      createCompRow("需求沟通", "0.5-1天", "30秒", borders),
      createCompRow("初稿设计", "1-2天", "30秒", borders),
      createCompRow("修改调整", "1-3天", "1-2分钟", borders),
      createCompRow("最终定稿", "0.5-1天", "即时", borders),
    ]
  });
}

function createCompRow(step, trad, ai, borders) {
  return new TableRow({ children: [
    new TableCell({ borders, width: { size: 3120, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun(step)] })] }),
    new TableCell({ borders, width: { size: 3120, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: trad, color: "DC2626" })] })] }),
    new TableCell({ borders, width: { size: 3120, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: ai, color: "16A34A", bold: true })] })] }),
  ]});
}

function createScenariosTable() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const scenarios = [
    ["新品开发", "为新季度开发产品系列，快速生成多个方案对比"],
    ["客户定制", "客户现场提需求，当场生成设计稿，1分钟内响应"],
    ["爆款衍生", "基于热销款一键生成配色/尺寸变体，快速丰富SKU"],
    ["节日主题", "内置圣诞/春节/情人节模板，当天出设计当天打样"],
    ["风格探索", "同一产品尝试可爱/极简/复古等风格，降低试错成本"],
    ["批量出图", "统一风格批量生成产品目录、电商图片"],
  ];
  return new Table({
    columnWidths: [2000, 7360],
    rows: scenarios.map(([name, desc]) => new TableRow({ children: [
      new TableCell({ borders, width: { size: 2000, type: WidthType.DXA },
        shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: name, bold: true, color: "1E3A8A" })] })] }),
      new TableCell({ borders, width: { size: 7360, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun(desc)] })] }),
    ]}))
  });
}

function createImplementationTable() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const phases = [
    ["第1阶段", "需求调研", "了解产品品类特点，梳理工艺材料约束，确定功能优先级", "约1周"],
    ["第2阶段", "数据准备", "收集产品图库，整理元素素材，配置工艺参数", "约1-2周"],
    ["第3阶段", "系统搭建", "部署AI设计台，导入产品数据，系统训练调优", "约2-3周"],
    ["第4阶段", "上线运营", "团队培训使用，试运行调整，正式投入使用", "约1周"],
  ];
  return new Table({
    columnWidths: [1400, 1600, 4760, 1600],
    rows: [
      new TableRow({ tableHeader: true, children: [
        new TableCell({ borders, width: { size: 1400, type: WidthType.DXA },
          shading: { fill: "3B82F6", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "阶段", bold: true, color: "FFFFFF" })] })] }),
        new TableCell({ borders, width: { size: 1600, type: WidthType.DXA },
          shading: { fill: "3B82F6", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "名称", bold: true, color: "FFFFFF" })] })] }),
        new TableCell({ borders, width: { size: 4760, type: WidthType.DXA },
          shading: { fill: "3B82F6", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "主要工作", bold: true, color: "FFFFFF" })] })] }),
        new TableCell({ borders, width: { size: 1600, type: WidthType.DXA },
          shading: { fill: "3B82F6", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "周期", bold: true, color: "FFFFFF" })] })] }),
      ]}),
      ...phases.map(([phase, name, work, time]) => new TableRow({ children: [
        new TableCell({ borders, width: { size: 1400, type: WidthType.DXA },
          shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: phase, bold: true, color: "3B82F6" })] })] }),
        new TableCell({ borders, width: { size: 1600, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: name, bold: true })] })] }),
        new TableCell({ borders, width: { size: 4760, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun(work)] })] }),
        new TableCell({ borders, width: { size: 1600, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: time, color: "16A34A", bold: true })] })] }),
      ]}))
    ]
  });
}

function createSummaryTable() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const items = [
    ["快", "分钟级出图，效率提升10倍"],
    ["准", "专属训练，精准匹配产品风格"],
    ["易", "对话操作，无需专业技能"],
    ["实", "自动校验，设计即可投产"],
  ];
  return new Table({
    columnWidths: [1200, 8160],
    rows: items.map(([key, val]) => new TableRow({ children: [
      new TableCell({ borders, width: { size: 1200, type: WidthType.DXA },
        shading: { fill: "3B82F6", type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: key, bold: true, size: 28, color: "FFFFFF" })] })] }),
      new TableCell({ borders, width: { size: 8160, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: val, size: 22 })] })] }),
    ]}))
  });
}

const outputPath = '/Users/g/Desktop/探索/产品设计台/docs/pptx-workspace/AI挂饰设计平台方案.docx';
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved: ${outputPath}`);
}).catch(console.error);
