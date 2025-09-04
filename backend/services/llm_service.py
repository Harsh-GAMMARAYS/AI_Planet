import google.generativeai as genai
import httpx
import json
import os
from typing import Optional, List, Dict, Any

# Configure Gemini Pro only if API key is available
api_key = os.getenv("GOOGLE_API_KEY")
if api_key and api_key != "your_google_api_key_here":
    genai.configure(api_key=api_key)

def get_gemini_model():
    """Get Gemini Pro model instance"""
    # Ensure API key is configured each time
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        # Try to use a default key or provide instructions
        print("⚠️ GOOGLE_API_KEY not found. Please set it in your .env file")
        print("🆓 For now, using a mock response to demonstrate functionality")
        return None
    
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
    
    if model is None:
        # Enhanced mock response that simulates real AI behavior
        enhanced_prompt = prompt
        
        # Build a more realistic response based on the query and context
        response_parts = []
        
        if context:
            enhanced_prompt = f"Context from documents:\n{context}\n\nUser question: {prompt}"
            response_parts.append("Based on the provided documents and context:")
        
        if web_search_results:
            search_context = "\n".join([
                f"- {result.get('title', '')}: {result.get('snippet', '')}"
                for result in web_search_results[:3]
            ])
            enhanced_prompt = f"{enhanced_prompt}\n\nWeb search results:\n{search_context}"
            response_parts.append("Based on recent web search results:")
        
        # Generate a more contextual response based on the prompt
        user_query_part = prompt
        if "User Query:" in prompt:
            user_query_part = prompt.split("User Query:")[-1].strip()
        
        # Check if it's a custom prompt (system instruction)
        if "strict web3 teacher" in prompt.lower():
            if "blockchain" in user_query_part.lower():
                response = f"As a strict Web3 teacher, I'll explain blockchain with precision:\n\nBlockchain is a distributed ledger technology that maintains a continuously growing list of records, called blocks, which are linked and secured using cryptography. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data.\n\nKey Web3 principles:\n- Decentralization: No single point of control\n- Immutability: Once recorded, data cannot be altered\n- Transparency: All transactions are publicly verifiable\n- Consensus: Agreement mechanisms ensure network integrity\n\nThis technology underpins cryptocurrencies like Bitcoin and enables smart contracts on platforms like Ethereum, revolutionizing how we think about digital trust and value exchange."
            else:
                response = f"As a strict Web3 teacher, I'll explain {user_query_part} with precision:\n\n{user_query_part} is a fundamental concept in Web3 technology. Let me break this down systematically..."
        elif "blockchain" in user_query_part.lower():
            response = "Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-proof record-keeping. It consists of blocks of data linked together using cryptographic principles. Key features include decentralization, immutability, and consensus mechanisms. Popular applications include cryptocurrencies like Bitcoin, smart contracts on platforms like Ethereum, and supply chain management systems."
        elif "web3" in user_query_part.lower():
            response = "Web3 represents the next evolution of the internet, focusing on decentralization, user ownership of data, and blockchain-based applications. It enables peer-to-peer interactions without intermediaries, token-based economics, and programmable money through smart contracts. Web3 technologies include blockchain networks, decentralized applications (dApps), and decentralized finance (DeFi) protocols."
        elif "ai" in user_query_part.lower() or "artificial intelligence" in user_query_part.lower():
            response = "Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence. This includes machine learning, natural language processing, computer vision, and robotics. AI applications range from virtual assistants and recommendation systems to autonomous vehicles and medical diagnosis tools."
        else:
            response = f"I understand you're asking about '{user_query_part}'. This is a simulated response demonstrating how the workflow would process your query. In a real implementation with a configured API key, you would receive a comprehensive AI-generated response based on your specific question and any available context or web search results."
        
        if response_parts:
            return f"{' '.join(response_parts)}\n\n{response}\n\n[Note: This is a simulated response. Set GOOGLE_API_KEY for real AI responses.]"
        else:
            return f"{response}\n\n[Note: This is a simulated response. Set GOOGLE_API_KEY for real AI responses.]"
    
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
    if custom_prompt:
        # Use custom prompt as system instruction + user query
        final_prompt = f"{custom_prompt}\n\nUser Query: {user_query}"
    else:
        final_prompt = user_query
    
    print(f"🔍 Final Prompt: {final_prompt}")
    print(f"🔍 Context: {context}")
    print(f"🔍 Web Results: {len(web_results) if web_results else 0} results")
    
    response = await generate_text(final_prompt, context, web_results)
    
    return {
        "query": user_query,
        "response": response,
        "used_knowledge_base": use_knowledge_base,
        "used_web_search": use_web_search,
        "knowledge_base_results": len(search_results) if use_knowledge_base and search_results else 0,
        "web_search_results": len(web_results) if web_results else 0
    }
