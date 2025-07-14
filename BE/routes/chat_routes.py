from fastapi import APIRouter
from pydantic import BaseModel
from database.typesense_client import TypesenseClient
import openai
import os

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    history: list = []
    context: dict = None

def should_use_typesense(message: str) -> bool:
    # Simple intent detection (customize as needed)
    keywords = ["search", "find", "show me", "job", "jobs", "position", "opening"]
    return any(kw in message.lower() for kw in keywords)

@router.post("/")
async def chat_with_ai(chat: ChatRequest):
    context = ""
    # 1. If the message is a search, use Typesense
    if should_use_typesense(chat.message):
        typesense = TypesenseClient()
        search_results = typesense.search_documents({
            "q": chat.message,
            "query_by": "title,company,description",
            "per_page": 3
        })
        job_summaries = []
        for hit in search_results.get("hits", []):
            doc = hit["document"]
            job_summaries.append(f"{doc['title']} at {doc['company']} in {doc['location']}: {doc['description'][:100]}...")
        jobs_text = "\n".join(f"{i+1}. {s}" for i, s in enumerate(job_summaries))
        context = f"Here are some job listings found for the user's query:\n{jobs_text}\n\n"
    # 1b. If a job context is provided, prepend it to the user message
    job_context_str = ""
    if chat.context:
        job_context_str = (
            f"Job Context:\nTitle: {chat.context.get('title', '')}\n"
            f"Company: {chat.context.get('company', '')}\n"
            f"Location: {chat.context.get('location', '')}\n"
            f"Salary: {chat.context.get('salary', 'N/A')}\n"
            f"Description: {chat.context.get('description', '')}\n\n"
        )
    # 2. Build the prompt with chat history and (if present) job context
    messages = [{"role": "system", "content": "You are a helpful assistant for job seekers."}]
    for h in chat.history:
        messages.append({"role": h["role"], "content": h["content"]})
    # Add the context and the latest user message
    user_content = (job_context_str if job_context_str else "") + (context if context else "") + chat.message
    messages.append({"role": "user", "content": user_content})
    # 3. Call OpenAI
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        temperature=0.7
    )
    ai_reply = response.choices[0].message.content
    return {"reply": ai_reply} 