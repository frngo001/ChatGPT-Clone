#!/bin/bash

# Deployment script for Agent AI on imeso-ki-02

echo "🚀 Deploying Agent AI to imeso-ki-02..."

# Check if we're on the right machine
if [[ $(hostname) != "imeso-ki-02" ]]; then
    echo "❌ This script should be run on imeso-ki-02"
    echo "Current hostname: $(hostname)"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your API keys."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Ollama is not running on port 11434. Please start Ollama first."
    echo "   You can start it with: ollama serve"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Build and start production environment
echo "📦 Building and starting production environment..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend is not responding"
fi

# Check Cognee
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Cognee is running on http://localhost:8000"
else
    echo "❌ Cognee is not responding"
fi

# Check Ollama
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running on http://localhost:11434"
else
    echo "❌ Ollama is not responding"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "🌐 Services available:"
echo "   Frontend: http://imeso-ki-02:3000"
echo "   Cognee: http://imeso-ki-02:8000"
echo "   Ollama: http://imeso-ki-02:11434"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
echo "💾 Data persistence:"
echo "   Cognee data is stored in Docker volume 'cognee_data'"
echo "   To backup: docker run --rm -v cognee_data:/data -v \$(pwd):/backup alpine cp /data/cognee.db /backup/cognee_backup_\$(date +%Y%m%d_%H%M%S).db"
