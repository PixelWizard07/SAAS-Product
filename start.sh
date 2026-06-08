#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ███╗   ███╗███████╗███████╗███████╗██╗  ██╗ ██████╗ ██╗  ██╗██╗   ██╗██████╗ "
echo "  ████╗ ████║██╔════╝██╔════╝██╔════╝██║  ██║██╔═══██╗██║  ██║██║   ██║██╔══██╗"
echo "  ██╔████╔██║█████╗  █████╗  ███████╗███████║██║   ██║███████║██║   ██║██████╔╝"
echo "  ██║╚██╔╝██║██╔══╝  ██╔══╝  ╚════██║██╔══██║██║   ██║██╔══██║██║   ██║██╔══██╗"
echo "  ██║ ╚═╝ ██║███████╗███████╗███████║██║  ██║╚██████╔╝██║  ██║╚██████╔╝██████╔╝"
echo "  ╚═╝     ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ "
echo -e "${NC}"
echo -e "${GREEN}  Multi-Account Meesho Seller Dashboard${NC}"
echo ""

# ── 1. Check dependencies ──────────────────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}✗ '$1' is not installed. Please install it first.${NC}"
    exit 1
  fi
}

check_cmd node
check_cmd npm
check_cmd docker

NODE_VERSION=$(node -v | grep -oP '\d+' | head -1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required (found $(node -v))${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# ── 2. Start MongoDB ───────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Starting MongoDB...${NC}"

# Try to start existing container first
if docker start meeshohub-mongo 2>/dev/null; then
  echo -e "${GREEN}✓ MongoDB container restarted${NC}"
else
  # Create new MongoDB container
  docker run -d \
    --name meeshohub-mongo \
    -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=meeshohub \
    -e MONGO_INITDB_ROOT_PASSWORD=meeshohub_secret \
    -e MONGO_INITDB_DATABASE=meeshohub \
    -v meeshohub_mongo_data:/data/db \
    mongo:7 >/dev/null
  echo -e "${GREEN}✓ MongoDB container created and started${NC}"
fi

# Wait for MongoDB to be ready
echo -n "  Waiting for MongoDB to be ready"
for i in $(seq 1 15); do
  if docker exec meeshohub-mongo mongosh --quiet \
      -u meeshohub -p meeshohub_secret --authenticationDatabase admin \
      --eval "db.runCommand({ping:1})" >/dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    break
  fi
  echo -n "."
  sleep 2
done

# ── 3. Install backend dependencies ────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Installing backend dependencies...${NC}"
cd "$(dirname "$0")/backend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# ── 4. Check Puppeteer / Chrome ────────────────────────────────────────────
CHROME_PATH=$(node -e "
  const paths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/root/.cache/puppeteer/chrome/linux-149.0.7827.22/chrome-linux64/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const fs = require('fs');
  console.log(paths.find(p => fs.existsSync(p)) || '');
" 2>/dev/null)

if [ -z "$CHROME_PATH" ]; then
  echo -e "${YELLOW}⚠ Chrome not found — installing via Puppeteer (this may take a minute)...${NC}"
  npx puppeteer browsers install chrome 2>&1 | tail -3
  CHROME_PATH=$(node -e "
    const { executablePath } = require('puppeteer');
    try { console.log(executablePath()); } catch { console.log(''); }
  " 2>/dev/null)
fi

if [ -n "$CHROME_PATH" ]; then
  # Update PUPPETEER_EXECUTABLE_PATH in .env
  if grep -q "PUPPETEER_EXECUTABLE_PATH" .env; then
    sed -i "s|PUPPETEER_EXECUTABLE_PATH=.*|PUPPETEER_EXECUTABLE_PATH=${CHROME_PATH}|" .env
  else
    echo "PUPPETEER_EXECUTABLE_PATH=${CHROME_PATH}" >> .env
  fi
  echo -e "${GREEN}✓ Chrome found: ${CHROME_PATH}${NC}"
else
  echo -e "${YELLOW}⚠ Chrome not found — Meesho scraping will fail, but demo mode will work${NC}"
fi

# ── 5. Start backend ────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Starting backend server...${NC}"
cd "$(dirname "$0")/backend"
npm run dev > /tmp/meeshohub-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo -n "  Waiting for backend"
for i in $(seq 1 20); do
  if curl -s http://localhost:5000/health >/dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    break
  fi
  echo -n "."
  sleep 2
done

echo -e "${GREEN}✓ Backend running at http://localhost:5000${NC}"

# ── 6. Install frontend dependencies ───────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Installing frontend dependencies...${NC}"
cd "$(dirname "$0")/frontend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# ── 7. Start frontend ───────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}▶ Starting frontend...${NC}"
npm run dev > /tmp/meeshohub-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ MeeshoHub is running!${NC}"
echo ""
echo -e "  🌐 Dashboard:  ${CYAN}http://localhost:5173${NC}"
echo -e "  🔧 Backend:    ${CYAN}http://localhost:5000${NC}"
echo -e "  🗄  Database:  ${CYAN}MongoDB on port 27017${NC}"
echo ""
echo -e "${GREEN}  Quick start:${NC}"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Register a new account (or log in)"
echo "  3. Go to Accounts → Add your Meesho seller account"
echo "  4. Click 'Sync from Meesho' to scrape live data"
echo "     OR click 'Load Demo Data' for instant sample data"
echo ""
echo -e "${YELLOW}  Logs:${NC}"
echo "  Backend:  tail -f /tmp/meeshohub-backend.log"
echo "  Frontend: tail -f /tmp/meeshohub-frontend.log"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop all services${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping services...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}Services stopped. MongoDB container left running (docker stop meeshohub-mongo to stop it).${NC}"
}
trap cleanup INT TERM

wait $BACKEND_PID $FRONTEND_PID
