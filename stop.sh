#!/bin/bash
# 产品设计台停止脚本

echo "🛑 停止产品设计台服务..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 停止后端
if pgrep -f "uvicorn main:app" > /dev/null; then
    echo -e "${YELLOW}停止后端服务...${NC}"
    pkill -f "uvicorn main:app"
    echo -e "${GREEN}✅ 后端已停止${NC}"
else
    echo "后端未运行"
fi

# 停止前端
if pgrep -f "vite" > /dev/null; then
    echo -e "${YELLOW}停止前端服务...${NC}"
    pkill -f "vite"
    echo -e "${GREEN}✅ 前端已停止${NC}"
else
    echo "前端未运行"
fi

echo -e "\n${GREEN}✅ 所有服务已停止${NC}"
