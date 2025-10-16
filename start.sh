#!/bin/bash

# Start script for Agent AI with local Cognee and external Ollama

echo "🚀 Starting Agent AI with Cognee and Ollama..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your API keys."
    exit 1
fi

# Start production environment
echo "📦 Starting production environment..."
docker-compose up -d

echo "✅ Services started successfully!"
echo ""
echo "🌐 Frontend: http://imeso-ki-02:3000"
echo "🧠 Cognee: http://imeso-ki-02:8080"
echo "🤖 Ollama: http://imeso-ki-02:11434"
echo ""
echo "📋 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
