#!/bin/bash

# Test script to verify environment variables in containers

echo "🔍 Testing Environment Variables in Containers..."

# Check if containers are running
if ! docker-compose ps | grep -q "agent-ai-frontend"; then
    echo "❌ Frontend container is not running. Please start with: docker-compose up -d"
    exit 1
fi

if ! docker-compose ps | grep -q "cognee-container"; then
    echo "❌ Cognee container is not running. Please start with: docker-compose up -d"
    exit 1
fi

echo ""
echo "📋 Frontend Container Environment Variables:"
echo "=============================================="
docker exec agent-ai-frontend env | grep -E "(LLM_|EMBEDDING_|DATABASE_URL|COGNEE_DATA_DIR|VITE_COGNEE_URL|VITE_OLLAMA_URL|COGNEE_URL|OLLAMA_URL)" | sort

echo ""
echo "📋 Cognee Container Environment Variables:"
echo "=========================================="
docker exec cognee-container env | grep -E "(LLM_|EMBEDDING_|DATABASE_URL|COGNEE_DATA_DIR)" | sort

echo ""
echo "🔗 Testing Container Communication:"
echo "==================================="

# Test Frontend to Cognee communication
echo "Testing Frontend → Cognee communication..."
if docker exec agent-ai-frontend wget -q --spider http://cognee:8000/health 2>/dev/null; then
    echo "✅ Frontend can reach Cognee"
else
    echo "❌ Frontend cannot reach Cognee"
fi

# Test Cognee to external Ollama communication
echo "Testing Cognee → Ollama communication..."
if docker exec cognee-container wget -q --spider http://imeso-ki-02:11434/api/tags 2>/dev/null; then
    echo "✅ Cognee can reach Ollama"
else
    echo "❌ Cognee cannot reach Ollama"
fi

# Test Frontend to external Ollama communication
echo "Testing Frontend → Ollama communication..."
if docker exec agent-ai-frontend wget -q --spider http://imeso-ki-02:11434/api/tags 2>/dev/null; then
    echo "✅ Frontend can reach Ollama"
else
    echo "❌ Frontend cannot reach Ollama"
fi

echo ""
echo "🌐 Testing Nginx Proxy Configuration:"
echo "====================================="

# Test Nginx proxy to Cognee
echo "Testing Nginx proxy to Cognee..."
if curl -s http://localhost:3000/api/v1/ > /dev/null 2>&1; then
    echo "✅ Nginx proxy to Cognee is working"
else
    echo "❌ Nginx proxy to Cognee is not working"
fi

# Test Nginx proxy to Ollama
echo "Testing Nginx proxy to Ollama..."
if curl -s http://localhost:3000/api/tags > /dev/null 2>&1; then
    echo "✅ Nginx proxy to Ollama is working"
else
    echo "❌ Nginx proxy to Ollama is not working"
fi

echo ""
echo "📊 Container Status:"
echo "==================="
docker-compose ps

echo ""
echo "🔍 Nginx Configuration Check:"
echo "============================="
docker exec agent-ai-frontend cat /etc/nginx/nginx.conf | grep -A 5 -B 5 "proxy_pass.*COGNEE_URL\|proxy_pass.*OLLAMA_URL" || echo "No proxy_pass configurations found"

echo ""
echo "✅ Environment test completed!"
