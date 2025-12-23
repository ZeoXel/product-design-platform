# AI挂饰设计平台技术规格 (LangChain)

## 1. 系统架构

```
User Input → LangChain Agent → Image Generation → Quality Check → Output
                ↓
         Knowledge Base
                ↓
         Feedback Loop (自进化)
```

## 2. 技术栈

### 核心框架
- **Backend**: FastAPI
- **Agent Framework**: LangChain
- **LLM**: Claude API (Anthropic)
- **Image Gen**: Nano Banana-2 API (Google Gemini)
- **Database**: PostgreSQL + pgvector
- **Vector DB**: Qdrant
- **Storage**: S3/OSS

### Python依赖
```
langchain==0.1.0
langchain-anthropic==0.1.0
fastapi==0.109.0
sqlalchemy==2.0.25
pgvector==0.2.4
qdrant-client==1.7.0
pillow==10.2.0
pydantic==2.5.0
```

## 3. 核心模块

### 3.1 LangChain Agent 设计

```python
# agents/design_agent.py

from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain_anthropic import ChatAnthropic
from langchain.tools import Tool

class DesignAgent:
    """主设计Agent"""
    
    tools = [
        analyze_reference_image,      # Claude Vision分析
        search_reference_library,     # 图库检索
        check_element_compatibility,  # 兼容性检查
        generate_image,               # Nano Banana生成
        verify_quality,               # 质量验证
        estimate_cost                 # 成本估算
    ]
    
    agent = create_structured_chat_agent(
        llm=ChatAnthropic(model="claude-sonnet-4-20250514"),
        tools=tools,
        prompt=design_agent_prompt
    )
```

### 3.2 LangChain Tools

#### Tool 1: 图像分析
```python
@tool
def analyze_reference_image(image_path: str) -> dict:
    """使用Claude Vision分析参考图"""
    # 返回: {elements: [], style: {}, physical_specs: {}}
```

#### Tool 2: 图库检索
```python
@tool
def search_reference_library(
    query: str,
    filters: dict
) -> List[ReferenceProduct]:
    """向量检索相似参考图"""
    # 使用Qdrant进行语义搜索
```

#### Tool 3: 兼容性检查
```python
@tool
def check_element_compatibility(
    target_element: str,
    existing_elements: List[str]
) -> dict:
    """检查元素组合可行性"""
    # 查询知识库中的兼容性规则
```

#### Tool 4: 图像生成
```python
@tool
def generate_image(
    reference_image: str,
    instruction: str
) -> dict:
    """调用Nano Banana生成图像"""
    # 返回: {image_url: "", metadata: {}}
```

#### Tool 5: 质量验证
```python
@tool
def verify_quality(
    generated_image: str,
    expected_elements: List[str]
) -> dict:
    """Claude Vision验证生成质量"""
    # 返回: {score: 0.92, issues: [], pass: true}
```

#### Tool 6: 成本估算
```python
@tool
def estimate_cost(elements: List[dict]) -> dict:
    """估算生产成本"""
    # 返回: {material: 8.5, labor: 5.0, total: 13.5}
```

### 3.3 LangChain Prompt Templates

```python
design_agent_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是挂饰设计助手。
    
工作流程:
1. 分析用户上传的参考图或需求
2. 从图库检索相似参考
3. 理解用户的修改意图
4. 检查元素兼容性和物理可行性
5. 生成Nano Banana指令
6. 调用图像生成
7. 验证质量
8. 返回结果和成本估算

可用工具: {tools}
工具名称: {tool_names}

输出格式:
{{
  "thought": "思考过程",
  "action": "tool_name",
  "action_input": {{}},
}}
"""),
    ("human", "{input}"),
    ("assistant", "{agent_scratchpad}")
])
```

### 3.4 Memory & Context

```python
from langchain.memory import ConversationBufferMemory

memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True
)

# 会话上下文管理
class SessionContext:
    session_id: str
    reference_image: Optional[str]
    current_elements: List[dict]
    edit_history: List[dict]
    user_preferences: dict
```

## 4. 数据模型

### 4.1 参考图库 (reference_products)

```sql
CREATE TABLE reference_products (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) UNIQUE,
    image_url TEXT NOT NULL,
    
    -- 视觉元素 (JSONB)
    elements JSONB,
    -- {
    --   "primary": [{"type": "seashell", "color": "pink", "bbox": []}],
    --   "secondary": [{"type": "bead", "count": 8}],
    --   "hardware": {"clasp": "lobster_pink"}
    -- }
    
    -- 风格向量 (for Qdrant)
    style_vector vector(768),
    
    -- 物理参数
    length_cm FLOAT,
    weight_g FLOAT,
    
    -- 生产信息
    material_cost FLOAT,
    labor_time_min INT,
    
    -- 业务数据
    sales_tier CHAR(1),  -- A/B/C/D
    avg_rating FLOAT,
    
    -- 元数据
    created_at TIMESTAMP DEFAULT NOW(),
    usage_count INT DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0
);

CREATE INDEX idx_style ON reference_products USING ivfflat (style_vector);
```

### 4.2 生成记录 (generation_logs)

```sql
CREATE TABLE generation_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    user_id VARCHAR(100),
    
    -- 输入
    reference_id INT REFERENCES reference_products(id),
    user_instruction TEXT,
    
    -- Agent决策过程
    agent_thought TEXT,
    tools_used JSONB,  -- [{"tool": "analyze_image", "input": {}, "output": {}}]
    
    -- 生成结果
    generated_image_url TEXT,
    nb_prompt TEXT,
    
    -- 质量评估
    quality_score FLOAT,
    success BOOLEAN,
    
    -- 用户反馈
    user_rating INT,  -- 1-5
    user_accepted BOOLEAN,
    
    -- 成本
    api_cost FLOAT,
    estimated_production_cost FLOAT,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 知识库 (knowledge_base)

```sql
-- 元素兼容性矩阵
CREATE TABLE element_compatibility (
    element_a VARCHAR(50),
    element_b VARCHAR(50),
    compatibility_score FLOAT,  -- 0-1
    co_occurrence_count INT,
    avg_user_rating FLOAT,
    PRIMARY KEY (element_a, element_b)
);

-- 编辑模式库
CREATE TABLE edit_patterns (
    id SERIAL PRIMARY KEY,
    pattern_type VARCHAR(50),  -- replace/scale/recolor
    source_element VARCHAR(50),
    target_element VARCHAR(50),
    success_rate FLOAT,
    avg_iterations FLOAT,
    best_prompt_template TEXT,
    usage_count INT
);

-- 物理约束规则
CREATE TABLE physical_constraints (
    id SERIAL PRIMARY KEY,
    rule_type VARCHAR(50),  -- weight_limit/size_limit
    condition JSONB,
    threshold FLOAT,
    error_message TEXT
);
```

## 5. API 设计

### 5.1 核心端点

```python
# main.py

from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI()

class GenerationRequest(BaseModel):
    reference_image_url: Optional[str]
    user_instruction: str
    session_id: Optional[str]

@app.post("/api/v1/generate")
async def generate_design(
    request: GenerationRequest,
    reference_image: Optional[UploadFile] = File(None)
):
    """主生成接口"""
    # 1. 初始化Agent
    agent = get_design_agent(session_id=request.session_id)
    
    # 2. 构建输入
    agent_input = {
        "reference_image": reference_image,
        "instruction": request.user_instruction,
        "context": get_session_context(request.session_id)
    }
    
    # 3. 执行Agent
    result = await agent.ainvoke(agent_input)
    
    # 4. 记录数据(自进化)
    log_generation_event(result)
    
    return {
        "image_url": result["image_url"],
        "metadata": result["metadata"],
        "cost_estimate": result["cost"]
    }

@app.get("/api/v1/references/search")
async def search_references(
    query: str,
    style: Optional[str] = None,
    limit: int = 10
):
    """检索参考图库"""
    # 向量检索 + 过滤

@app.post("/api/v1/batch/variations")
async def generate_variations(
    base_product_id: str,
    variation_types: List[str]  # ["color", "size"]
):
    """批量生成变体"""
    # 使用LangChain批处理
```

## 6. LangChain工作流实现

### 6.1 主流程 (Sequential Chain)

```python
from langchain.chains import SequentialChain

# 链式处理流程
analyze_chain = LLMChain(
    llm=claude,
    prompt=analyze_prompt,
    output_key="analysis"
)

plan_chain = LLMChain(
    llm=claude,
    prompt=planning_prompt,
    output_key="edit_plan"
)

generate_chain = LLMChain(
    llm=claude,
    prompt=generation_prompt,
    output_key="nb_instruction"
)

verify_chain = LLMChain(
    llm=claude,
    prompt=verify_prompt,
    output_key="quality_check"
)

workflow = SequentialChain(
    chains=[analyze_chain, plan_chain, generate_chain, verify_chain],
    input_variables=["reference_image", "user_instruction"],
    output_variables=["analysis", "edit_plan", "nb_instruction", "quality_check"]
)
```

### 6.2 对话式迭代 (Agent Executor)

```python
# 支持多轮对话优化
agent_executor = AgentExecutor(
    agent=design_agent,
    tools=tools,
    memory=memory,
    verbose=True,
    max_iterations=5,
    early_stopping_method="generate"
)

# 用户可以持续对话优化
# User: "把贝壳换成水晶"
# Agent: 生成图片A
# User: "水晶大一点"
# Agent: 基于A继续修改
```

### 6.3 批处理 (Map-Reduce)

```python
from langchain.chains import MapReduceChain

# 批量生成变体
def generate_color_variations(base_image: str):
    color_schemes = get_color_schemes()
    
    # Map: 为每个配色生成一张
    map_chain = LLMChain(
        llm=claude,
        prompt=color_variation_prompt
    )
    
    # Reduce: 聚合结果
    reduce_chain = LLMChain(
        llm=claude,
        prompt=summarize_prompt
    )
    
    return MapReduceChain(
        map_chain=map_chain,
        reduce_chain=reduce_chain
    )
```

## 7. 自进化机制

### 7.1 数据采集 (LangChain Callbacks)

```python
from langchain.callbacks import BaseCallbackHandler

class FeedbackCollector(BaseCallbackHandler):
    """收集Agent执行数据"""
    
    def on_tool_start(self, tool_name: str, input_str: str, **kwargs):
        # 记录工具调用
        log_tool_usage(tool_name, input_str)
    
    def on_tool_end(self, output: str, **kwargs):
        # 记录工具输出
        log_tool_output(output)
    
    def on_agent_finish(self, finish: dict, **kwargs):
        # 记录最终结果
        log_agent_result(finish)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    callbacks=[FeedbackCollector()]
)
```

### 7.2 离线学习

```python
# scripts/nightly_learning.py

async def nightly_learning_job():
    """每日凌晨执行"""
    
    # 1. 分析参考图质量
    await update_reference_quality_scores()
    
    # 2. 更新兼容性矩阵
    await update_element_compatibility()
    
    # 3. 优化Prompt模板
    await optimize_prompt_templates()
    
    # 4. 更新向量索引
    await rebuild_vector_index()

# 使用APScheduler定时执行
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(nightly_learning_job, 'cron', hour=2)
```

## 8. 部署架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   FastAPI   │ (Gunicorn + Uvicorn)
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  ┌─────▼─────┐     ┌─────▼─────┐     ┌────▼────┐
  │PostgreSQL │     │  Qdrant   │     │  Redis  │
  │ + pgvector│     │  (Vector) │     │ (Cache) │
  └───────────┘     └───────────┘     └─────────┘
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    depends_on:
      - postgres
      - qdrant
      - redis

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
  qdrant_data:
```

## 9. 开发路线图

### Phase 1: MVP (Week 1-2)
- [ ] LangChain Agent基础框架
- [ ] Claude + Nano Banana集成
- [ ] 单次图生图流程
- [ ] 简单前端界面

### Phase 2: 图库 (Week 3-4)
- [ ] 参考图库数据模型
- [ ] 向量化检索(Qdrant)
- [ ] 50张参考图标注
- [ ] 图库管理API

### Phase 3: 智能化 (Week 5-6)
- [ ] 批量变体生成
- [ ] 成本估算
- [ ] 质量自动检查
- [ ] 多轮对话优化

### Phase 4: 自进化 (Week 7-8)
- [ ] 数据采集埋点
- [ ] 离线学习脚本
- [ ] 知识库自动更新
- [ ] A/B测试框架

## 10. 关键配置

### 环境变量 (.env)

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_API_KEY=xxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/design_platform
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379

# LangChain
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=xxx
LANGCHAIN_PROJECT=ai-design-platform

# Business
MATERIAL_COST_MARKUP=1.3
LABOR_HOURLY_RATE=30
```

### LangChain配置

```python
# config/langchain_config.py

from langchain_anthropic import ChatAnthropic

# Claude配置
claude_vision = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    temperature=0.3,
    max_tokens=4096
)

# LangSmith追踪
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "ai-design-platform"
```

## 11. 测试策略

```python
# tests/test_agent.py

import pytest
from langchain.agents import AgentExecutor

def test_design_agent_basic():
    """测试基础图生图流程"""
    agent = get_design_agent()
    
    result = agent.invoke({
        "reference_image": "test_ocean_charm.jpg",
        "instruction": "把粉色贝壳换成蓝色"
    })
    
    assert result["success"] == True
    assert "image_url" in result

def test_element_compatibility():
    """测试兼容性检查"""
    result = check_element_compatibility(
        "crystal",
        ["seashell", "starfish"]
    )
    
    assert result["compatible"] == True

# 集成测试
@pytest.mark.asyncio
async def test_full_workflow():
    """测试完整生成流程"""
    # 模拟真实场景
```

## 12. 监控指标

```python
# monitoring/metrics.py

from prometheus_client import Counter, Histogram

# Agent性能
agent_invocations = Counter('agent_invocations_total', 'Agent调用次数')
agent_duration = Histogram('agent_duration_seconds', 'Agent执行耗时')

# 生成质量
generation_success_rate = Counter('generation_success_total', '生成成功次数')
quality_score = Histogram('quality_score', '质量分数分布')

# 业务指标
user_satisfaction = Histogram('user_satisfaction_rating', '用户满意度')
api_cost = Counter('api_cost_total', 'API调用成本')
```

---

## 附录: LangChain最佳实践

### A. Prompt工程
- 使用`PromptTemplate`管理prompt版本
- 通过`FewShotPromptTemplate`提供示例
- 用`OutputParser`标准化输出

### B. 错误处理
- 设置`max_iterations`防止死循环
- 使用`try-except`包装工具调用
- 实现降级策略(fallback)

### C. 性能优化
- 启用LangChain缓存
- 批量处理使用`batch()`
- 异步调用用`ainvoke()`

### D. 可观测性
- 集成LangSmith追踪
- 记录所有工具调用
- 监控Token使用量
