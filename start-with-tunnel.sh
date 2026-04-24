#!/bin/bash
# Start all services and cloudflared tunnel

echo "🚀 Starting Military Adaptation System..."

# Kill any existing processes
pkill -f "military-adaptation-backend" 2>/dev/null
pkill -f "server.js" 2>/dev/null
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 1

# Start Backend
echo "📡 Starting backend on port 3000..."
cd /Users/danavisun/Documents/ISAD/military-adaptation-system/backend
npx ts-node --transpile-only src/index.ts &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend..."
for i in {1..15}; do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend ready!"
    break
  fi
  sleep 1
done

# Start Frontend Server (with API proxy)
echo "🖥️  Starting frontend server on port 5173..."
cd /Users/danavisun/Documents/ISAD/military-adaptation-system
node server.js &
SERVER_PID=$!

sleep 2

# Start Cloudflare Tunnel
echo "☁️  Starting Cloudflare Tunnel..."
cloudflared tunnel --url http://localhost:5173 2>&1 &
TUNNEL_PID=$!

sleep 8

echo ""
echo "=========================================="
echo "✅ ALL SERVICES RUNNING!"
echo "=========================================="
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Server PID:   $SERVER_PID"
echo "Tunnel PID:   $TUNNEL_PID"
echo ""
echo "📋 Check /tmp/cloudflared-tunnel.log for URL"
echo ""

# Save PIDs for cleanup
echo "$BACKEND_PID $SERVER_PID $TUNNEL_PID" > /tmp/military-app-pids.txt

# Keep script running
trap "kill $BACKEND_PID $SERVER_PID $TUNNEL_PID 2>/dev/null; exit" EXIT
wait
