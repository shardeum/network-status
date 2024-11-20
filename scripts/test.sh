#!/bin/bash

# Export test endpoints file path
export ENDPOINTS_FILE="server/test-endpoints.json"
export PROMETHEUS_URL="http://localhost:9090"

# Start the test server
node server/test-server.js &
TEST_SERVER_PID=$!

# Start the Prometheus exporter
node server/exporter.js &
EXPORTER_PID=$!

# Wait for services to start
sleep 2

# Start Next.js
npm run dev &
NEXT_PID=$!

# Function to cleanup processes
cleanup() {
    echo "Cleaning up processes..."
    kill $TEST_SERVER_PID 2>/dev/null
    kill $EXPORTER_PID 2>/dev/null
    kill $NEXT_PID 2>/dev/null
    exit 0
}

# Setup cleanup on script exit
trap cleanup EXIT INT TERM

# Keep script running
wait