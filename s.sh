#!/bin/bash
# 产品设计台启动脚本
# 前端: http://localhost:3010
# 后端: http://localhost:8010

set -e

echo "🚀 产品设计台启动脚本"
echo "===================="

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查并停止已运行的服务
echo -e "${YELLOW}🛑 停止已运行的服务...${NC}"
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# 检查端口占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ 端口 $port 被占用（$service）${NC}"
        echo "   请运行: lsof -ti:$port | xargs kill -9"
        return 1
    else
        echo -e "${GREEN}✅ 端口 $port 可用（$service）${NC}"
        return 0
    fi
}

echo -e "\n${BLUE}🔍 检查端口状态...${NC}"
check_port 8010 "后端API"
check_port 3010 "前端"

# 创建日志目录
mkdir -p logs

# 启动后端
echo -e "\n${BLUE}📦 启动后端服务...${NC}"
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ 后端启动中 (PID: $BACKEND_PID)${NC}"
cd ..

# 等待后端启动
echo -e "${YELLOW}⏳ 等待后端就绪...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8010/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端就绪！${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 后端启动超时${NC}"
        exit 1
    fi
    sleep 1
done

# 启动前端
echo -e "\n${BLUE}🎨 启动前端服务...${NC}"
bun run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ 前端启动中 (PID: $FRONTEND_PID)${NC}"

# 等待前端启动
echo -e "${YELLOW}⏳ 等待前端就绪...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3010 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端就绪！${NC}"
        break
    fi
    sleep 1
done

# 显示服务信息
echo -e "\n${GREEN}🎉 服务启动成功！${NC}"
echo "===================="
echo -e "${BLUE}📊 服务信息：${NC}"
echo "  前端: http://localhost:3010"
echo "  后端: http://localhost:8010"
echo "  API文档: http://localhost:8010/docs"
echo ""
echo -e "${BLUE}📝 进程信息：${NC}"
echo "  后端 PID: $BACKEND_PID"
echo "  前端 PID: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📋 日志文件：${NC}"
echo "  后端: logs/backend.log"
echo "  前端: logs/frontend.log"
echo ""
echo -e "${YELLOW}💡 提示：${NC}"
echo "  - 查看后端日志: tail -f logs/backend.log"
echo "  - 查看前端日志: tail -f logs/frontend.log"
echo "  - 停止服务: ./stop.sh"
echo ""
echo -e "${GREEN}✨ 浏览器将自动打开前端页面${NC}"
