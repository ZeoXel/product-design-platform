# 产品设计台

AI 驱动的产品设计工具，基于 Claude AI 提供智能设计辅助。

## 技术栈

**前端**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS

**后端**
- FastAPI + Python
- LangChain + Claude AI
- Pillow 图像处理

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

### 运行

```bash
# 启动前端开发服务器
bun run dev

# 启动后端服务器（另一终端）
bun run dev:backend

# 或同时启动
bun run dev:all
```

前端默认运行在 http://localhost:5173

## 项目结构

```
├── src/                  # 前端源码
│   ├── components/       # React 组件
│   ├── pages/           # 页面组件
│   ├── services/        # API 服务
│   └── types/           # TypeScript 类型
├── backend/             # 后端源码
│   ├── agents/          # AI Agent
│   ├── api/             # API 路由
│   ├── services/        # 服务层
│   └── models/          # 数据模型
└── docs/                # 文档
```

## License

MIT
