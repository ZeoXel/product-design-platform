# 项目管理系统 - 功能文档

## ✅ 功能概述

已成功实现完整的项目管理系统，支持在前端工作台创建、管理和切换多个设计项目。

---

## 🎯 核心功能

### 1. 项目列表页面
- **路径**: 应用启动后默认进入项目列表
- **功能**:
  - 展示所有已创建的项目（网格布局）
  - 实时搜索项目（按名称/描述）
  - 多种排序方式（最近修改、创建时间、名称）
  - 空状态提示引导

### 2. 创建新项目
- **触发**: 点击"创建新项目"按钮
- **表单字段**:
  - 项目名称（必填）
  - 项目描述（可选）
- **操作**: 创建后自动进入工作台

### 3. 项目卡片
每个项目显示：
- 缩略图（自动使用当前版本图片）
- 项目名称
- 项目描述（如有）
- 版本数量
- 最后修改日期
- 操作按钮：
  - 点击卡片 → 打开项目
  - 复制按钮 → 快速复制项目
  - 删除按钮 → 删除项目（需确认）

### 4. 工作台集成
- **项目加载**: 打开项目时自动加载所有状态
  - 对话消息
  - 图片版本
  - 参考图
  - 分析结果
  - 会话 ID
- **自动保存**: 工作区状态变化时自动保存（1秒防抖）
- **项目标识**: 顶部显示当前项目名称
- **快速返回**: "返回项目列表"按钮

---

## 📊 数据模型

### Project 接口
```typescript
interface Project {
  id: string;                    // 唯一标识
  name: string;                  // 项目名称
  description?: string;          // 项目描述
  thumbnail?: string;            // 缩略图 URL
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间

  // 工作区状态
  messages: ChatMessage[];       // 对话历史
  versions: ImageVersion[];      // 图片版本
  currentVersionId: string | null;
  referenceImage: string | null;
  referenceBase64: string | null;
  imageAnalysis: ImageAnalysis | null;
  sessionId: string | null;
}
```

### ProjectMetadata 接口
```typescript
interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  versionCount: number;          // 版本数量
  messageCount: number;          // 消息数量
}
```

---

## 💾 存储方案

### localStorage 存储结构
```javascript
// 主存储 Key
"design_projects": {
  "project_xxx": "{serialized_project_data}",
  "project_yyy": "{serialized_project_data}",
  ...
}

// 当前活跃项目 Key
"current_project_id": "project_xxx"
```

### 序列化处理
- **保存时**: Date 对象 → ISO 字符串
- **加载时**: ISO 字符串 → Date 对象
- 防止数据类型丢失

---

## 🔧 核心服务 API

### projectService.ts

#### 项目 CRUD
```typescript
// 列出所有项目
listProjects(): ProjectMetadata[]

// 获取单个项目
getProject(projectId: string): Project | null

// 创建新项目
createProject(name: string, description?: string): Project

// 保存项目
saveProject(project: Project): void

// 删除项目
deleteProject(projectId: string): boolean
```

#### 项目操作
```typescript
// 复制项目
duplicateProject(projectId: string, newName?: string): Project | null

// 导出项目为 JSON
exportProject(projectId: string): string | null

// 导入项目 JSON
importProject(jsonData: string): Project | null
```

#### 状态管理
```typescript
// 获取当前活跃项目 ID
getCurrentProjectId(): string | null

// 设置当前活跃项目
setCurrentProjectId(projectId: string): void

// 清除当前项目标记
clearCurrentProjectId(): void
```

---

## 🎨 用户界面

### 项目列表页面 (Projects.tsx)
**布局**:
```
┌─────────────────────────────────────┐
│ 我的项目        [创建新项目]         │
│ [搜索框]  [排序下拉]                │
├─────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐            │
│  │项目│  │项目│  │项目│  ...        │
│  │ 1  │  │ 2  │  │ 3  │            │
│  └────┘  └────┘  └────┘            │
└─────────────────────────────────────┘
```

### 工作台页面 (Workspace.tsx)
**顶部导航**:
```
┌─────────────────────────────────────┐
│ [←] [Logo] 春季新品手链设计          │
│                工作台    [API已连接] │
└─────────────────────────────────────┘
```

---

## 🚀 使用流程

### 新用户首次使用
1. 应用启动 → 自动进入项目列表（空状态）
2. 点击"创建新项目"
3. 输入项目名称和描述
4. 点击"创建" → 进入工作台
5. 开始设计工作

### 已有项目的使用
1. 应用启动 → 显示项目列表
2. 点击项目卡片 → 打开项目
3. 继续之前的设计工作
4. 所有修改自动保存
5. 点击"返回项目列表" → 返回列表

### 项目管理
- **搜索**: 在搜索框输入关键词过滤
- **排序**: 选择排序方式（最近修改/创建时间/名称）
- **复制**: 悬停项目卡片 → 点击复制按钮
- **删除**: 悬停项目卡片 → 点击删除按钮 → 确认

---

## ⚙️ 技术实现细节

### 自动保存机制
```typescript
// 使用 useEffect + setTimeout 实现防抖
React.useEffect(() => {
  if (!currentProjectId) return;

  const timer = setTimeout(() => {
    projectService.saveProject({...projectData});
  }, 1000); // 1秒防抖

  return () => clearTimeout(timer);
}, [dependencies]); // 监听所有状态变化
```

### 项目加载
```typescript
// 组件加载时根据 projectId 加载数据
React.useEffect(() => {
  if (projectId) {
    const project = projectService.getProject(projectId);
    if (project) {
      // 恢复所有状态
      setMessages(project.messages);
      setVersions(project.versions);
      // ...
    }
  }
}, [projectId]);
```

### 缩略图自动生成
```typescript
// 保存时自动使用当前版本的图片作为缩略图
if (!project.thumbnail && project.currentVersionId) {
  const currentVersion = project.versions.find(
    v => v.id === project.currentVersionId
  );
  if (currentVersion) {
    project.thumbnail = currentVersion.url;
  }
}
```

---

## 📝 文件清单

### 新增文件
```
src/
├── pages/
│   └── Projects.tsx              # 项目列表页面
├── services/
│   └── projectService.ts         # 项目管理服务
└── types/
    └── index.ts                  # 新增 Project 和 ProjectMetadata 类型
```

### 修改文件
```
src/
├── App.tsx                       # 添加 Projects 路由
├── components/layout/
│   └── Header.tsx                # 添加"项目"导航
└── pages/
    └── Workspace.tsx             # 集成项目加载/保存
```

---

## 🔄 未来扩展

### 可选增强功能
1. **云端同步**
   - 替换 localStorage 为后端 API
   - 支持多设备访问

2. **项目协作**
   - 分享项目链接
   - 多人同时编辑

3. **版本历史**
   - 查看历史版本
   - 回滚到指定版本

4. **项目模板**
   - 预设项目模板
   - 快速开始常见设计

5. **批量操作**
   - 批量删除项目
   - 批量导出

6. **高级搜索**
   - 按风格标签过滤
   - 按元素类型过滤
   - 按时间范围过滤

---

## ✅ 测试验证

### 已验证功能
- ✅ 创建新项目
- ✅ 项目自动保存到 localStorage
- ✅ 项目列表正确显示
- ✅ 打开项目并加载状态
- ✅ 工作区修改自动保存
- ✅ 返回项目列表
- ✅ 项目元数据（版本数、日期）正确显示

### 待测试场景
- 🔲 复制项目功能
- 🔲 删除项目功能
- 🔲 搜索过滤功能
- 🔲 排序功能
- 🔲 长时间使用后的性能
- 🔲 localStorage 容量限制处理

---

**更新时间**: 2025-12-24
**状态**: ✅ 核心功能已完成并验证
