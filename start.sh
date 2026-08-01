#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/cremson-backend"
FRONTEND="$ROOT/cremson-next-ui"
VENV="$BACKEND/venv"

echo ""
echo "========================================"
echo "   Cremson Full Stack Startup"
echo "========================================"
echo ""

# ── Kill any existing processes on ports 8000 and 3000 ────────────────────────
for PORT in 8000 3000; do
  PID=$(lsof -ti tcp:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    echo "⚠  Port $PORT in use by PID $PID — stopping it..."
    kill -9 $PID 2>/dev/null
    sleep 1
  fi
done

# ── 1. Create venv if not exists ──────────────────────────────────────────────
if [ ! -d "$VENV" ]; then
  echo "[1/4] Creating Python virtual environment..."
  python3 -m venv "$VENV"
else
  echo "[1/4] Virtual environment already exists — skipping."
fi

# ── 2. Activate venv ──────────────────────────────────────────────────────────
echo "[2/4] Activating virtual environment..."
source "$VENV/bin/activate"

# ── 3. Install Python deps ────────────────────────────────────────────────────
if ! python3 -c "import fastapi, uvicorn, httpx, dotenv, passlib, jose, aiosmtplib, email_validator" 2>/dev/null; then
  echo "[3/4] Installing backend dependencies..."
  pip install -q -r "$BACKEND/requirements.txt"
  if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies. Check requirements.txt."
    exit 1
  fi
else
  echo "[3/4] Backend dependencies already installed — skipping."
fi

# ── 4. Install frontend deps ──────────────────────────────────────────────────
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "[4/4] Installing frontend dependencies..."
  cd "$FRONTEND" && npm install --silent
  if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies."
    exit 1
  fi
else
  echo "[4/4] Frontend dependencies already installed — skipping."
fi

echo ""
echo "========================================"
echo "   Starting all servers..."
echo "========================================"
echo ""

# ── Start backend (Port 8000) ─────────────────────────────────────────────────
echo "▶ Starting Backend → http://localhost:8000"
cd "$BACKEND"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/cremson-backend.log 2>&1 &
BACKEND_PID=$!

# ── Wait for backend to be ready (health check) ───────────────────────────────
echo "  Waiting for backend to be ready..."
MAX_WAIT=30
WAITED=0
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
  sleep 1
  WAITED=$((WAITED + 1))
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo ""
    echo "❌ Backend failed to start after ${MAX_WAIT}s. Last log:"
    echo "──────────────────────────────────────"
    tail -20 /tmp/cremson-backend.log
    echo "──────────────────────────────────────"
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
  echo -n "."
done
echo ""
echo "  ✅ Backend is ready!"
echo "  Swagger docs → http://localhost:8000/docs"

# ── Start frontend (Port 3000) ────────────────────────────────────────────────
echo ""
echo "▶ Starting Frontend Website → http://localhost:3000"
cd "$FRONTEND"
npm run dev > /tmp/cremson-frontend.log 2>&1 &
FRONTEND_PID=$!

# ── Wait for frontend to be ready ─────────────────────────────────────────────
echo "  Waiting for frontend to be ready..."
MAX_WAIT=60
WAITED=0
until curl -s http://localhost:3000 > /dev/null 2>&1; do
  sleep 1
  WAITED=$((WAITED + 1))
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo ""
    echo "❌ Frontend failed to start after ${MAX_WAIT}s. Last log:"
    echo "──────────────────────────────────────"
    tail -20 /tmp/cremson-frontend.log
    echo "──────────────────────────────────────"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
  fi
  echo -n "."
done
echo ""
echo "  ✅ Frontend is ready!"

echo ""
echo "========================================"
echo "  ✅ All servers are running!"
echo ""
echo "     • Next.js Website:  http://localhost:3000"
echo "     • FastAPI Backend:  http://localhost:8000"
echo "     • Swagger Docs:     http://localhost:8000/docs"
echo ""
echo "     Logs:"
echo "     - Backend:  tail -f /tmp/cremson-backend.log"
echo "     - Frontend: tail -f /tmp/cremson-frontend.log"
echo ""
echo "  Press Ctrl+C to stop all servers."
echo "========================================"
echo ""

# ── Graceful shutdown on Ctrl+C ──────────────────────────────────────────────
trap "echo ''; echo 'Stopping all servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; deactivate 2>/dev/null; exit 0" SIGINT SIGTERM

wait
