#!/bin/bash

set -e

# Config
ENV_FILE="supabase/functions/.env"
ENV_KEY="LOCAL_SUPABASE_FUNCTIONS_URL"
ENV_KEY_2="LOCAL_FUNCTIONS_URL"
SUPABASE_PORT=54321
NGROK_LOG=".ngrok-url.log"

# Function to update .env
update_env_file() {
  local key=$1
  local value=$2

  echo "🔧 Setting $key=$value in $ENV_FILE"

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

# Start ngrok first
echo "🌐 Starting ngrok tunnel..."
rm -f "$NGROK_LOG"

ngrok http $SUPABASE_PORT --domain=wasp-pleasing-gnu.ngrok-free.app --log=stdout > "$NGROK_LOG" 2>&1 &

NGROK_PID=$!

# Wait for ngrok to initialize
echo "⏳ Waiting for ngrok URL..."
sleep 3

# Extract the ngrok-free.app URL
BASE_URL=$(grep -o "https://[a-zA-Z0-9.-]*\.ngrok[-a-z]*\.app" "$NGROK_LOG" | head -n 1)
TUNNEL_URL="${BASE_URL}/functions/v1"

if [ -z "$TUNNEL_URL" ]; then
  echo "❌ Failed to extract ngrok URL."
  kill $NGROK_PID
  exit 1
fi

echo "✅ Tunnel is live: $TUNNEL_URL"

# Inject into env
update_env_file "$ENV_KEY" "$TUNNEL_URL"
update_env_file "$ENV_KEY_2" "$BASE_URL"
echo "📝 Updated $ENV_FILE with $ENV_KEY=$TUNNEL_URL"

# Now start Supabase
echo "🚀 Starting Supabase functions..."
pnpm supabase functions serve --no-verify-jwt &

SUPABASE_PID=$!

# Trap cleanup
trap "echo '🛑 Shutting down...'; kill $SUPABASE_PID $NGROK_PID; exit" INT

# Wait for ngrok (primary) process
wait $NGROK_PID
