#!/bin/bash

# Test script for Hybrid RAG system
echo "🚀 Testing Hybrid RAG System"
echo "================================"

BASE_URL="http://localhost:8000"

# Function to make API calls and check responses
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo ""
    echo "Testing: $description"
    echo "Endpoint: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint")
    fi
    
    echo "Response: $response"
    
    # Check if response contains error
    if echo "$response" | grep -q '"status":"success"'; then
        echo "✅ Test passed"
    elif echo "$response" | grep -q '"status":"healthy"'; then
        echo "✅ Test passed"
    else
        echo "❌ Test failed or returned error"
    fi
}

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Test 1: Health check
test_endpoint "GET" "/hybrid-rag/health" "" "Health Check"

# Test 2: Data ingestion
test_endpoint "POST" "/hybrid-rag/ingest" "" "Data Ingestion"

# Wait for ingestion to complete
echo ""
echo "Waiting for ingestion to complete..."
sleep 10

# Test 3: Vector search query (definitions)
test_endpoint "POST" "/hybrid-rag/query" '{"question": "What is FastAPI?"}' "Vector Search Query"

# Test 4: Graph search query (relationships)
test_endpoint "POST" "/hybrid-rag/query" '{"question": "How does FastAPI relate to Pydantic?"}' "Graph Search Query"

# Test 5: More vector queries
test_endpoint "POST" "/hybrid-rag/query" '{"question": "What are the core components of FastAPI?"}' "Components Query"

# Test 6: More graph queries
test_endpoint "POST" "/hybrid-rag/query" '{"question": "What parameters does the GET method accept?"}' "Parameters Query"

echo ""
echo "🏁 Testing completed!"
echo "Check the responses above to verify system functionality."
