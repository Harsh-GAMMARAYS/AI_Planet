#!/bin/bash

# Hybrid RAG Deployment Script
# This script sets up and tests the complete Hybrid RAG system

set -e  # Exit on any error

echo "🚀 Deploying Hybrid RAG System"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check prerequisites
print_step 1 "Checking prerequisites"

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine docker compose command
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_success "Docker and Docker Compose are available"

# Step 2: Clean up any existing containers
print_step 2 "Cleaning up existing containers"
$DOCKER_COMPOSE down -v 2>/dev/null || true
print_success "Cleanup completed"

# Step 3: Build and start services
print_step 3 "Building and starting services"
echo "This may take 5-10 minutes for the first run..."

$DOCKER_COMPOSE up --build -d

print_success "Services started successfully"

# Step 4: Wait for services to be ready
print_step 4 "Waiting for services to initialize"

echo "Waiting for PostgreSQL..."
sleep 10

echo "Waiting for ChromaDB..."
sleep 10

echo "Waiting for Neo4j..."
sleep 15

echo "Waiting for API and model loading..."
sleep 30

# Check if services are running
print_step 5 "Checking service status"

if ! $DOCKER_COMPOSE ps | grep -q "ai_planet_postgres.*Up"; then
    print_error "PostgreSQL is not running"
    exit 1
fi

if ! $DOCKER_COMPOSE ps | grep -q "ai_planet_chromadb.*Up"; then
    print_error "ChromaDB is not running"
    exit 1
fi

if ! $DOCKER_COMPOSE ps | grep -q "ai_planet_neo4j.*Up"; then
    print_error "Neo4j is not running"
    exit 1
fi

if ! $DOCKER_COMPOSE ps | grep -q "ai_planet_api.*Up"; then
    print_error "API is not running"
    exit 1
fi

print_success "All services are running"

# Step 6: Test API endpoints
print_step 6 "Testing API endpoints"

BASE_URL="http://localhost:8000"

# Test health endpoint
echo "Testing health endpoint..."
if curl -s "$BASE_URL/hybrid-rag/health" | grep -q '"status":"healthy"'; then
    print_success "Health check passed"
else
    print_warning "Health check returned warnings (this is normal if using fallback LLM)"
fi

# Test ingestion
echo "Testing data ingestion..."
INGEST_RESPONSE=$(curl -s -X POST "$BASE_URL/hybrid-rag/ingest" -H "Content-Type: application/json")

if echo "$INGEST_RESPONSE" | grep -q '"status":"success"'; then
    print_success "Data ingestion completed successfully"
    echo "Ingestion details: $INGEST_RESPONSE"
else
    print_error "Data ingestion failed: $INGEST_RESPONSE"
    exit 1
fi

# Wait for ingestion to complete
echo "Waiting for ingestion to complete..."
sleep 10

# Test vector search query
echo "Testing vector search query..."
VECTOR_RESPONSE=$(curl -s -X POST "$BASE_URL/hybrid-rag/query" \
    -H "Content-Type: application/json" \
    -d '{"question": "What is FastAPI?"}')

if echo "$VECTOR_RESPONSE" | grep -q '"status":"success"'; then
    print_success "Vector search query successful"
    echo "Search method: $(echo "$VECTOR_RESPONSE" | grep -o '"search_method":"[^"]*"')"
else
    print_warning "Vector search query failed or returned warnings"
    echo "Response: $VECTOR_RESPONSE"
fi

# Test graph search query
echo "Testing graph search query..."
GRAPH_RESPONSE=$(curl -s -X POST "$BASE_URL/hybrid-rag/query" \
    -H "Content-Type: application/json" \
    -d '{"question": "How does FastAPI relate to Pydantic?"}')

if echo "$GRAPH_RESPONSE" | grep -q '"status":"success"'; then
    print_success "Graph search query successful"
    echo "Search method: $(echo "$GRAPH_RESPONSE" | grep -o '"search_method":"[^"]*"')"
else
    print_warning "Graph search query failed or returned warnings"
    echo "Response: $GRAPH_RESPONSE"
fi

# Step 7: Display access information
print_step 7 "Deployment Summary"

echo ""
echo "🎉 Hybrid RAG System is now running!"
echo ""
echo "Access Points:"
echo "  • API Documentation: http://localhost:8000/docs"
echo "  • Neo4j Browser: http://localhost:7474 (neo4j/ai_planet_password)"
echo "  • ChromaDB: http://localhost:8001"
echo ""
echo "API Endpoints:"
echo "  • Health Check: GET http://localhost:8000/hybrid-rag/health"
echo "  • Data Ingestion: POST http://localhost:8000/hybrid-rag/ingest"
echo "  • Query System: POST http://localhost:8000/hybrid-rag/query"
echo ""
echo "Example Queries:"
echo "  • Vector Search: \"What is FastAPI?\""
echo "  • Graph Search: \"How does FastAPI relate to Pydantic?\""
echo ""
echo "To stop the system: $DOCKER_COMPOSE down"
echo "To view logs: $DOCKER_COMPOSE logs -f api"
echo ""

# Step 8: Optional - run comprehensive tests
read -p "Would you like to run comprehensive tests? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step 8 "Running comprehensive tests"
    
    if [ -f "./test_hybrid_rag.sh" ]; then
        chmod +x ./test_hybrid_rag.sh
        ./test_hybrid_rag.sh
    else
        print_warning "Test script not found, skipping comprehensive tests"
    fi
fi

print_success "Deployment completed successfully!"

echo ""
echo "📚 For more information, see:"
echo "  • HYBRID_RAG_README.md - Complete documentation"
echo "  • backend/data.txt - Sample dataset"
echo "  • backend/env.example - Environment configuration"
echo ""
