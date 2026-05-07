# backend/app/rag_chain.py

from langchain_community.llms import Ollama
from langchain.chains import ConversationalRetrievalChain
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from app.config import CHROMA_DIR, EMBEDDING_MODEL, LLM_MODEL
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers import ContextualCompressionRetriever
from app.config import RERANKER_MODEL

# --- Prompts (Same as before) ---
condense_question_template = """
Given the following conversation and a follow-up question, rephrase the follow-up question to be a standalone question.
Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:"""

CONDENSE_QUESTION_PROMPT = PromptTemplate.from_template(condense_question_template)

qa_template = """
# **Role:**
You are JURIQ, the official AI Legal Assistant for the Department of Justice, India. You are knowledgeable, highly respectful, and strictly factual.

# **Objective:**
Answer the user's legal query accurately using ONLY the provided Context. Format your response beautifully using Markdown so it is easy to read.

# **Context:**
{context}

# **Instructions:**
- **Instruction 1 (Analyze):** Read the provided context carefully. If the answer to a legal query is not contained within it, you MUST reply exactly: "I do not have information on that." Do not guess.
- **Instruction 2 (Handle Greetings):** If the user greets you or asks about your identity, introduce yourself briefly as JURIQ, the DoJ AI Assistant.
- **Instruction 3 (Format Beautifully):** Structure your response using rich Markdown. Use bullet points (`-` or `*`), bold text (`**`) for key legal terms, and short paragraphs to make the information digestible.
- **Instruction 4 (Simplify Language):** Explain complex legal concepts in simple, layman terms without losing accuracy.
- **Instruction 5 (Direct Answers):** Start your answer immediately. Do not use filler phrases like "Based on the context provided" or "According to the documents".

# **Notes:**
- **Note 1 - Zero Hallucination:** Never invent laws, acts, sections, or penalties that are not explicitly stated in the Context.
- **Note 2 - Tone:** Keep the tone highly professional, unbiased, and accessible to normal citizens.
- **Note 3 - UI Rendering:** Ensure the final output contains proper line breaks and lists so it renders perfectly on a web interface.

Current Question: {question}

Answer:"""

QA_PROMPT = PromptTemplate(
    template=qa_template, input_variables=["context", "question"]
)

def get_rag_chain():
    # 1. Load Embeddings
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    # 2. Load Existing Vector DB (No ingestion here!)
    vectordb = Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings
    )

    # retriever = vectordb.as_retriever(search_kwargs={"k": 3})

    # 1. Base Retriever: Fetch a broad context of top 20 chunks
    base_retriever = vectordb.as_retriever(search_kwargs={"k": 20})

    # 2. Cross-Encoder: Initialize the BGE re-ranking model
    model = HuggingFaceCrossEncoder(model_name=RERANKER_MODEL)
    
    # 3. Compressor: Score the 20 chunks and keep only the top 5
    compressor = CrossEncoderReranker(model=model, top_n=5)

    # 4. Final Retriever: Combine them
    retriever = ContextualCompressionRetriever(
        base_compressor=compressor, 
        base_retriever=base_retriever
    )


    llm = Ollama(model=LLM_MODEL)

    # 3. Create Chain
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        condense_question_prompt=CONDENSE_QUESTION_PROMPT,
        combine_docs_chain_kwargs={"prompt": QA_PROMPT},
        return_source_documents=True,
    )

    return chain