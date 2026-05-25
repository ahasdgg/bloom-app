#!/bin/bash
# =============================================
# Автоматический деплой Bloom App → GitHub + Netlify
# =============================================

set -e

# === Настройки ===
REPO_NAME="bloom-app"
GITHUB_USER="ahasdgg"
BRANCH="main"
BUILD_DIR="web"
BUILD_COMMAND="npm run build"
PUBLISH_DIR="web/dist"

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Запуск деплоя Bloom App...${NC}"

# Инициализация git
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}Инициализируем git...${NC}"
  git init
  git branch -M $BRANCH
fi

# Добавляем .gitignore если нет
if [ ! -f ".gitignore" ]; then
  echo "node_modules/" >> .gitignore
  echo "web/dist/" >> .gitignore
  echo ".env" >> .gitignore
fi

# Добавляем remote
if ! git remote | grep -q "origin"; then
  echo -e "${YELLOW}Добавляем GitHub remote...${NC}"
  git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

# Сборка проекта
echo -e "${YELLOW}Собираем проект (${BUILD_DIR})...${NC}"
cd $BUILD_DIR
$BUILD_COMMAND
cd ..

# Коммит и пуш
echo -e "${YELLOW}Коммитим и пушим...${NC}"
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M')" || echo "Нет новых изменений"
git push -u origin $BRANCH

echo -e "${GREEN}✅ Залито на GitHub: https://github.com/$GITHUB_USER/$REPO_NAME${NC}"

# Netlify CLI
if command -v netlify &> /dev/null; then
  echo -e "${YELLOW}Деплоим на Netlify...${NC}"
  netlify deploy --prod --dir=$PUBLISH_DIR --message="Auto deploy $(date '+%Y-%m-%d %H:%M')"
  echo -e "${GREEN}✅ Netlify деплой завершён!${NC}"
else
  echo -e "${YELLOW}Netlify CLI не найден. Установи один раз:${NC}"
  echo -e "  ${GREEN}npm install -g netlify-cli${NC}"
  echo -e "  ${GREEN}netlify login${NC}"
  echo -e "  ${GREEN}netlify init${NC}  (в первый раз)"
  echo ""
  echo -e "Потом просто запускай: ${GREEN}./deploy.sh${NC}"
fi

echo -e "\n${GREEN}🎉 Готово!${NC}"
