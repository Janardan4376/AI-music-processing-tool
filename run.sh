#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

trap cleanup SIGINT

echo "Starting AI Karaoke Studio..."

# Start Backend
echo "Starting Flask Backend..."
cd backend
# Check if venv exists, if not create it (optional, assuming user has python)
# python3 -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt
python3 app.py &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting React Frontend..."
cd frontend
# npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Services started. Press Ctrl+C to stop."
wait
