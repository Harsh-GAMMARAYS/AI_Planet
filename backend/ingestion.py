#!/usr/bin/env python3
"""
Hybrid RAG Ingestion Script
This script ingests data into both ChromaDB (vector store) and Neo4j (knowledge graph).
"""

import os
import sys
from pathlib import Path
from services.hybrid_rag_service import hybrid_rag_service
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main ingestion function."""
    try:
        # Path to the data file
        data_file = Path(__file__).parent / "data.txt"
        
        if not data_file.exists():
            logger.error(f"Data file not found: {data_file}")
            sys.exit(1)
        
        logger.info(f"Starting ingestion of data from: {data_file}")
        
        # Ingest the data
        result = hybrid_rag_service.ingest_data(str(data_file))
        
        if result["status"] == "success":
            logger.info("🎉 Ingestion completed successfully!")
            logger.info(f"Chunks processed: {result['chunks_processed']}")
            logger.info(f"Triples extracted: {result['triples_extracted']}")
        else:
            logger.error(f"❌ Ingestion failed: {result['message']}")
            sys.exit(1)
    
    except Exception as e:
        logger.error(f"❌ Unexpected error during ingestion: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
