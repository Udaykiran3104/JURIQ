# backend/ingest.py
import os
import shutil
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from app.config import DATA_DIR, CHROMA_DIR, EMBEDDING_MODEL

def ingest_docs():
    # 1. Clear existing database to avoid duplication
    if os.path.exists(CHROMA_DIR):
        print(f"Removing old vector store at {CHROMA_DIR}...")
        shutil.rmtree(CHROMA_DIR)
    
    # 2. Initialize Embeddings
    print(f"Initializing embedding model: {EMBEDDING_MODEL}...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    # 3. Load Documents
    documents = []
    print(f"Loading PDFs from {DATA_DIR}...")
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"WARNING: {DATA_DIR} was empty. Created it. Please add PDFs.")
        return

    pdf_files = list(DATA_DIR.glob("*.pdf"))
    if not pdf_files:
        print("No PDF files found.")
        return

    for pdf_file in pdf_files:
        print(f"Loading: {pdf_file.name}")
        loader = PyPDFLoader(str(pdf_file))
        docs = loader.load()
        documents.extend(docs)

    # 4. Split Documents
    print("Splitting documents into chunks...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )
    chunks = splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")

    # 5. Create & Save Vector Store
    print("Creating vector database (this may take a moment)...")
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR)
    )
    
    print("✅ Ingestion complete! Vector store saved to disk.")

if __name__ == "__main__":
    ingest_docs()