import chromadb
from chromadb.utils import embedding_functions

def get_collection():
    """Initialize ChromaDB client and collection lazily"""
    chroma_client = chromadb.PersistentClient(path="chroma_db")

    collection = chroma_client.get_or_create_collection(
        name="documents_v2",  # Changed name to avoid conflicts
        embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"  # Free, lightweight model
        )
    )
    return collection


def store_embedding(doc_id: str, text: str, metadata: dict = None):
    """Stores a text embedding in ChromaDB"""
    collection = get_collection()
    collection.add(
        ids=[doc_id],
        documents=[text],
        metadatas=[metadata or {}]
    )


def query_embedding(query: str, n_results: int = 3):
    """
    Retrieves most relevant text chunks for a given query.
    Returns structured results with text + metadata + distance.
    """
    collection = get_collection()
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )

    formatted = []
    for i in range(len(results["ids"][0])):
        formatted.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i] if "distances" in results else None
        })
    return formatted
