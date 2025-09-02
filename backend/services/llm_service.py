import google.generativeai as genai
import httpx
import json
import os
from typing import Optional, List, Dict, Any

# Configure Gemini Pro
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_gemini_model():
    """Get Gemini Pro model instance"""
    # Ensure API key is configured each time
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.0-flash')

async def generate_text(
    prompt: str, 
    context: Optional[str] = None,
    web_search_results: Optional[List[Dict]] = None
) -> str:
    """
    Generate text using Gemini 2.0 Flash (FREE TIER) with optional context and web search results
    """
    model = get_gemini_model()
    print(f"🆓 Using Gemini 2.0 Flash - Free Tier Model")
    
    # Build enhanced prompt with context
    enhanced_prompt = prompt
    
    if context:
        enhanced_prompt = f"Context from documents:\n{context}\n\nUser question: {prompt}"
    
    if web_search_results:
        search_context = "\n".join([
            f"- {result.get('title', '')}: {result.get('snippet', '')}"
            for result in web_search_results[:3]  # Use top 3 results
        ])
        enhanced_prompt = f"{enhanced_prompt}\n\nWeb search results:\n{search_context}"
    
    try:
        response = model.generate_content(enhanced_prompt)
        print(f"✅ Free tier request successful - no charges applied")
        return response.text
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "limit" in error_msg.lower():
            return f"🆓 Free tier limit reached. This is normal and prevents charges. Error: {error_msg}"
        return f"Error generating response: {error_msg}"

async def search_web(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """
    Search the web using DuckDuckGo API (free alternative to SerpAPI)
    """
    try:
        async with httpx.AsyncClient() as client:
            # Using DuckDuckGo Instant Answer API (free)
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1"
            }
            
            response = await client.get(url, params=params)
            data = response.json()
            
            results = []
            
            # Get abstract if available
            if data.get("Abstract"):
                results.append({
                    "title": data.get("AbstractSource", "DuckDuckGo"),
                    "snippet": data.get("Abstract", ""),
                    "url": data.get("AbstractURL", "")
                })
            
            # Get related topics
            for topic in data.get("RelatedTopics", [])[:num_results-1]:
                if isinstance(topic, dict) and "Text" in topic:
                    results.append({
                        "title": topic.get("FirstURL", "").split("/")[-1].replace("_", " "),
                        "snippet": topic.get("Text", ""),
                        "url": topic.get("FirstURL", "")
                    })
            
            return results
            
    except Exception as e:
        print(f"Web search error: {e}")
        return []

async def process_workflow(
    user_query: str,
    use_knowledge_base: bool = False,
    use_web_search: bool = False,
    custom_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process a complete workflow: Query -> KnowledgeBase -> LLM -> Output
    """
    from . import vector_service
    
    context = None
    web_results = None
    
    # Step 1: Query knowledge base if requested
    if use_knowledge_base:
        search_results = vector_service.query_embedding(user_query, n_results=3)
        if search_results:
            context = "\n".join([result["text"] for result in search_results])
    
    # Step 2: Web search if requested
    if use_web_search:
        web_results = await search_web(user_query)
    
    # Step 3: Generate response with LLM
    final_prompt = custom_prompt or user_query
    response = await generate_text(final_prompt, context, web_results)
    
    return {
        "query": user_query,
        "response": response,
        "used_knowledge_base": use_knowledge_base,
        "used_web_search": use_web_search,
        "knowledge_base_results": len(search_results) if use_knowledge_base and search_results else 0,
        "web_search_results": len(web_results) if web_results else 0
    }
