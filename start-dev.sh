#!/bin/bash

# Development start script for Agent AI with local Cognee and external Ollama

echo "🚀 Starting Agent AI Development Environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your API keys."
    exit 1
fi

# Start development environment
echo "🔧 Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d

echo "✅ Development environment started successfully!"
echo ""
echo "🌐 Frontend (Dev): http://imeso-ki-02:5173"
echo "🧠 Cognee: http://imeso-ki-02:8080"
echo "🤖 Ollama: http://imeso-ki-02:11434"
echo ""
echo "📋 To view logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
