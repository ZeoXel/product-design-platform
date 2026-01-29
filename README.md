# AI 产品设计平台

基于 Claude AI 和 Seedream 图像生成模型的挂饰/配饰设计辅助工具，通过自然语言交互生成产品设计图像。

## 核心功能

- **智能图像分析** - 使用 Claude Vision 分析参考图的元素、材质、风格和物理规格
- **自然语言设计** - 通过对话式交互描述设计需求，AI 自动生成优化的 Prompt
- **预设系统** - 支持多种产品类型（钥匙扣、包挂、手机挂绳等）和风格预设（海洋风、波西米亚、极简风等）
- **图像生成** - 基于 Seedream 模型的文生图和图生图能力
- **版本管理** - 树状版本控制，支持从任意版本创建新分支
- **相似搜索** - 基于向量嵌入的图库相似产品推荐

## 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (React + TypeScript)                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │ Workspace │  │  Gallery  │  │  History  │  │  Canvas   │    │
│  │  主工作台  │  │   图库    │  │  历史记录  │  │  多画布   │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │ API
┌─────────────────────────────────────────────────────────────────┐
│                       后端 (FastAPI + Python)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Design Agent                          │   │
│  │         (核心业务逻辑 - 协调分析、生成、预设)              │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                    │                    │               │
│  ┌────▼────┐         ┌─────▼─────┐        ┌────▼────┐         │
│  │ Claude  │         │ Seedream  │        │ Gallery │         │
│  │ Service │         │  Service  │        │ Service │         │
│  │ 图像分析 │         │  图像生成  │        │ 图库管理 │         │
│  └─────────┘         └───────────┘        └─────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

**前端技术栈**
- React 18 + TypeScript 5
- Vite 5 (开发服务器)
- Tailwind CSS

**后端技术栈**
- FastAPI + Uvicorn
- Claude 3.5 Sonnet (图像分析)
- Seedream 4.5 (图像生成)
- NumPy (向量运算)
- Pillow (图像处理)

## 项目结构

```
product-design-platform/
├── src/                          # 前端源码
│   ├── components/               # React 组件
│   │   ├── chat/                 # 对话交互组件
│   │   ├── preview/              # 图像预览和分析面板
│   │   ├── canvas/               # 画布管理
│   │   ├── gallery/              # 图库抽屉
│   │   ├── cost/                 # 成本计算
│   │   ├── style/                # 风格选择器
│   │   └── ui/                   # 通用 UI 组件
│   ├── pages/                    # 页面组件
│   │   ├── Workspace.tsx         # 主工作台
│   │   ├── Gallery.tsx           # 图库页面
│   │   └── History.tsx           # 历史记录
│   ├── services/                 # 前端服务
│   │   ├── api.ts                # API 客户端
│   │   ├── canvasService.ts      # 画布持久化
│   │   └── historyService.ts     # 历史记录管理
│   └── types/                    # TypeScript 类型定义
│       └── index.ts              # 核心类型
│
├── backend/                      # 后端源码
│   ├── main.py                   # FastAPI 应用入口
│   ├── agents/
│   │   └── design_agent.py       # 设计 Agent (核心业务逻辑)
│   ├── api/
│   │   └── routes.py             # API 路由定义
│   ├── services/
│   │   ├── claude_service.py     # Claude Vision API
│   │   ├── seedream_service.py   # 图像生成服务
│   │   ├── gallery_service.py    # 图库管理
│   │   ├── preset_service.py     # 预设系统
│   │   └── embedding_service.py  # 向量嵌入
│   ├── models/
│   │   └── schemas.py            # Pydantic 数据模型
│   ├── config/
│   │   └── settings.py           # 配置管理
│   └── data/
│       ├── presets.json          # 产品类型和风格预设
│       ├── few_shot_examples.json # Few-Shot 学习示例
│       └── gallery/              # 参考图库存储
│           ├── images/           # 图像文件
│           ├── embeddings/       # 向量缓存 (.npy)
│           └── metadata.json     # 元数据索引
│
└── docs/                         # 文档
```

## 核心模块说明

### 1. Design Agent (`backend/agents/design_agent.py`)

设计 Agent 是整个系统的核心，负责协调各个服务完成设计任务：

```python
# 主要方法
analyze_reference(image_base64)     # 分析参考图，提取设计元素
generate_design(instruction, ...)   # 根据指令生成设计图像
chat(messages, session_id, ...)     # 对话交互
```

**设计生成流程**：
1. 接收用户指令和可选的参考图
2. 调用 Claude Vision 分析参考图（如有）
3. 自动检测产品类型和风格预设
4. 组装分层 Prompt（6 层结构）
5. 调用 Seedream 生成图像
6. 返回完整响应（图像、分析、成本）

### 2. 预设系统 (`backend/services/preset_service.py`)

**产品类型预设**：
| 类型 | 名称 | 典型尺寸 |
|------|------|----------|
| keychain | 钥匙扣 | 8-12cm |
| bag_charm | 包挂 | 12-18cm |
| phone_strap | 手机挂绳 | 15-25cm |
| car_charm | 车挂 | 20-35cm |
| generic | 通用挂饰 | 8-15cm |

**风格预设**：
- ocean_kawaii - 海洋风少女系
- bohemian - 波西米亚民族风
- bohemian_natural - 波西米亚自然系
- candy_playful - 糖果色童趣系
- dreamy_star - 梦幻星空系
- minimalist - 极简现代风
- vintage_elegant - 复古典雅风

### 3. 分层 Prompt 系统

生成图像时使用 6 层递进式 Prompt 结构：

```
Layer 1: 产品身份锁定 - 定义产品类型和基本属性
Layer 2: 结构约束    - 描述物理结构和组成方式
Layer 3: 材质描述    - 主体/辅助元素的材质细节
Layer 4: 风格定义    - 视觉风格和配色方案
Layer 5: 用户修改    - 用户的自然语言指令
Layer 6: 技术参数    - 图像规格和输出要求
```

### 4. 图像分析系统 (`backend/services/claude_service.py`)

使用 Claude Vision 从参考图中提取：

```typescript
ImageAnalysis {
  elements: {
    primary: ElementItem[]    // 主体元素（贝壳、水晶、吊坠等）
    secondary: ElementItem[]  // 辅助元素（珠子、流苏等）
    hardware: ElementItem[]   // 五金配件（龙虾扣、钥匙环等）
  }
  style: {
    tags: string[]            // 风格标签
    mood: string              // 情绪/氛围
  }
  physicalSpecs: {
    lengthCm: number          // 长度
    weightG: number           // 重量
  }
  suggestions: string[]       // 设计建议
}
```

### 5. 图库与相似搜索 (`backend/services/gallery_service.py`)

- 参考图上传时自动生成分析和向量嵌入
- 基于多模态向量的相似度搜索
- 支持按风格、产品类型筛选

## API 路由

基础 URL: `http://localhost:8010/api/v1`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/generate` | 生成设计图像 |
| POST | `/generate/v2` | V2 版本（支持预设） |
| POST | `/analyze` | 分析参考图像 |
| GET | `/presets` | 获取所有预设 |
| GET | `/presets/product-types` | 获取产品类型 |
| GET | `/presets/styles` | 获取风格预设 |
| POST | `/chat` | 对话交互 |
| GET | `/gallery/references` | 获取图库列表 |
| POST | `/gallery/references` | 上传参考图 |
| POST | `/gallery/similar` | 相似图搜索 |
| GET | `/health` | 健康检查 |

## 数据流程

```
用户操作                     系统处理                      结果
─────────────────────────────────────────────────────────────────
1. 上传参考图 ──────▶ Claude Vision 分析 ──────▶ 结构化分析结果
                            │
2. 输入设计指令 ────▶ 预设自动检测 ───────────▶ 匹配产品类型+风格
                            │
3. 点击生成 ────────▶ 分层 Prompt 组装 ───────▶ 优化的生成 Prompt
                            │
                     Seedream 图像生成 ────────▶ 设计图像
                            │
4. 查看结果 ────────▶ 版本树更新 ───────────────▶ v1.0, v1.1...
                            │
5. 继续迭代 ────────▶ 保留上下文，重复流程
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.10+
- Bun (推荐) 或 npm

### 安装

```bash
# 安装前端依赖
bun install

# 安装后端依赖
cd backend
pip install -r requirements.txt
```

### 配置

复制环境变量文件并填写 API 密钥：

```bash
cp .env.example .env
```

需要配置的环境变量：
- `OPENAI_API_KEY` - API 密钥（用于 Claude 和 Seedream）

### 运行

```bash
# 启动前端开发服务器 (端口 5173)
bun run dev

# 启动后端服务器 (端口 8010)
bun run dev:backend

# 或同时启动
bun run dev:all
```

访问 http://localhost:5173 开始使用。

## 数据持久化

**前端 (LocalStorage)**
- `design_canvases` - 画布数据
- `design_history` - 历史记录
- `current_canvas_id` - 当前画布 ID

**后端 (文件系统)**
- `/backend/data/gallery/images/` - 图库图像
- `/backend/data/gallery/embeddings/` - 向量缓存
- `/backend/data/gallery/metadata.json` - 元数据

## License

MIT
