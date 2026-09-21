"""
Takes doctor records from MongoDB (altibbi_dr.doctors) → cleans the text
→ splits them into small chunks → attaches metadata
→ returns them ready for embeddings
"""

import os
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "altibbi_dr")


# ── Helpers ───────────────────────────────────────────────────────────────────
def clean_arabic(text: str) -> str:
    """
    clean arabic text
    1 - remove tashkeel
    2 - normalize أ إ آ -> ا
    3 - remove punctuation
    4 - remove white spaces
    """
    if not text:
        return ""

    pattern = re.compile(r'[\u0610-\u061A\u064B-\u065F]')  # tashkeel
    text = pattern.sub('', text)  # removes the above

    text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')  # normalize

    # remove punctuation (Arabic + Latin), keep letters/numbers/whitespace/newlines
    punctuation_pattern = re.compile(
        r'[،؛؟٫٬ـ»«"\'\.\,\!\?\:\;\(\)\[\]\{\}\-–—•/\\*#@$%\^&\+=<>~`]'
    )
    text = punctuation_pattern.sub(' ', text)

    text = re.sub(r'\s+', ' ', text)  # collapse whitespace
    return text.strip()  # remove spaces at start and end


def dedupe_about_text(text: str) -> str:
    """
    The scraped 'about' field commonly contains a truncated preview
    (ending in '...') immediately followed by the full text repeating
    from the start, plus a trailing 'عرض المزيد' (show more) label.
    This keeps only the complete version.
    """
    if not text:
        return ""

    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\s*عرض المزيد\s*$', '', text)

    snippet = text[:40].strip()
    if not snippet:
        return text

    second_occurrence = text.find(snippet, len(snippet))
    if second_occurrence != -1:
        return text[second_occurrence:].strip()

    return text


def get_splitter() -> RecursiveCharacterTextSplitter:
    """
    It prefers splitting at:
    paragraphs \n\n, \n
    sentences (including Arabic punctuation like ؟ and ،)
    words " "
    characters (last fallback) ""

    Note: punctuation is stripped by clean_arabic() before splitting, so
    these separators mainly still catch newlines/spaces by the time text
    reaches the splitter — kept here in case raw fields ever bypass cleaning.
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", "؟", "،", " ", ""],
        length_function=len,  # measures chunk size by number of characters
    )


# ── Main function (used by export_chunks.py) ────────────────────────────────
def get_all_chunks():
    """
    This function converts MongoDB doctor documents into LangChain-ready
    chunks for embeddings.

    - Reads doctors from MongoDB (in batches)
    - Cleans the text (Arabic normalization + punctuation removal)
    - Splits each doctor's combined text into chunks
    - Attaches metadata to each chunk
    - Returns a big list of LangChain documents
    """
    splitter = get_splitter()  # creates object
    langchain_docs = []
    skipped = 0
    BATCH_SIZE = 500  # process 500 doctors at a time

    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB_NAME]
    doctors_collection = db["doctors"]

    total_count = doctors_collection.count_documents({})
    print(f"Total doctors: {total_count}")

    start = 0
    while start < total_count:
        # fetching BATCH_SIZE at once, not the whole collection
        batch = list(
            doctors_collection.find({}).skip(start).limit(BATCH_SIZE)
        )

        if not batch:
            break

        for doctor in batch:
            try:
                doctor_id = doctor.get("doctor_id") or str(doctor.get("_id"))
                name = doctor.get("name") or ""
                specialty = doctor.get("specialty") or ""
                about = doctor.get("about") or ""

                if not about.strip():
                    skipped += 1
                    continue

                about = dedupe_about_text(about)

                full_text = f"{name}\n\n{specialty}\n\n{about}"  # joins name + specialty + about
                cleaned = clean_arabic(full_text)

                if not cleaned.strip():
                    skipped += 1
                    continue

                # langchain
                chunks = splitter.create_documents(
                    texts=[cleaned],
                    metadatas=[{
                        "doctor_id": doctor_id,
                        "name": name,
                        "specialty": specialty,
                        "location": doctor.get("location") or "",
                        "url": doctor.get("profile_url") or "",
                    }]
                )
                langchain_docs.extend(chunks)

            except Exception as e:
                print(f"  Error on doctor {doctor.get('doctor_id')}: {e}")
                skipped += 1
                continue

        start += BATCH_SIZE
        print(f"  Processed {min(start, total_count)}/{total_count}"
              f" → {len(langchain_docs)} chunks so far")

    client.close()

    print(f"\nDone.")
    print(f"  Doctors processed : {total_count - skipped}")
    print(f"  Doctors skipped   : {skipped}")
    print(f"  Total chunks      : {len(langchain_docs)}")
    print(f"  Avg chunks/doctor : {len(langchain_docs) / max(total_count - skipped, 1):.1f}")

    oversized = [d for d in langchain_docs if len(d.page_content) > 400]
    empty = [d for d in langchain_docs if not d.page_content.strip()]
    print(f"  Oversized chunks  : {len(oversized)}")
    print(f"  Empty chunks      : {len(empty)}")

    return langchain_docs


# ── Run directly for testing ───────────────────────────────────────────────────

if __name__ == "__main__":
    docs = get_all_chunks()
    if docs:
        print(f"\n--- First chunk preview ---")
        print(docs[0].page_content[:300])
        print(docs[0].metadata)