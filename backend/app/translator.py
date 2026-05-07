import requests
import re
from deep_translator import GoogleTranslator

# --- KEYWORD DICTIONARIES (THE SAFETY NET) ---
# Add to these sets as you discover more common slang/words
HINDI_KEYWORDS = {
    "kya", "kaise", "mujhe", "batao", "hai", "chahiye", "kahan", "ka", "ki", "ko", "namaste", "aap", "tum", "kaun", "haan", "nahi",
    "mera", "meri", "hum", "humein", "karo", "karna", "sakte", "sakti", "kyon", "kab", "kisko", "kanoon", "adhikar", "madad", "liye", "bhi", "toh", "lekin"
}
TELUGU_KEYWORDS = {
    "ela", "ante", "cheppu", "nenu", "kavali", "ekkada", "yemi", "em", "enduku", "nuvvu", "evaru", "namaskaram", "baagunnara", "avunu", "kaadu", "meeruu",
    "naa", "naaku", "manamu", "manaku", "cheyali", "cheyyali", "eppudu", "evari", "chattam", "hakkulu", "sahayam", "koraku", "kuda", "kani", "matrame", "aithe", "ledhu"
}
KANNADA_KEYWORDS = {
    "hege", "nanna", "yavuvu", "bagge", "tilisi", "elli", "beku", "yenu", "enu", "namaskara", "neevu", "yaaru", "howdu", "illa", "neenu",
    "nanage", "navu", "namage", "madabeku", "yake", "yavaga", "yara", "kanunu", "hakkugalu", "sahaya", "goskara", "saha", "adare", "matra"
}

def detect_language(text: str) -> str:
    """
    1. Uses a hyper-fast keyword dictionary to catch Romanized Indian languages.
    2. Falls back to Google's REST API if no keywords match.
    """
    # Remove punctuation so "kya?" matches "kya"
    clean_text = re.sub(r'[^\w\s]', '', text.lower())
    words = set(clean_text.split())
    
    # 1. THE SAFETY NET: Check for intersections
    if words.intersection(KANNADA_KEYWORDS):
        print("Detected via Dictionary: Kannada (kn)")
        return 'kn'
    if words.intersection(TELUGU_KEYWORDS):
        print("Detected via Dictionary: Telugu (te)")
        return 'te'
    if words.intersection(HINDI_KEYWORDS):
        print("Detected via Dictionary: Hindi (hi)")
        return 'hi'

    # 2. THE API CHECK: Fallback to Google
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": "en",
            "dt": "t",
            "q": text
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        lang_code = data[2].lower()
        
        if 'hi' in lang_code: return 'hi'
        if 'te' in lang_code: return 'te'
        if 'kn' in lang_code: return 'kn'
        return 'en' 
        
    except Exception as e:
        print(f"Direct web Language detection failed: {e}. Defaulting to English.")
        return 'en'

def translate_to_english(text: str, source_lang: str) -> str:
    """Translates to English. FORCES the source language if detected."""
    if source_lang == 'en':
        return text
    try:
        # CRITICAL FIX: Instead of 'auto', we force it to use the detected language
        # This guarantees "Nānu polīs dūru" translates from Kannada, not random English guessing
        return GoogleTranslator(source=source_lang, target='en').translate(text)
    except Exception as e:
        print(f"Translation to English failed: {e}")
        return text

# ... Keep your translate_to_native function exactly as it is below this ...


def translate_to_native(text: str, target_lang: str) -> str:
    """Translates English answer back to Hindi/Telugu script."""
    if target_lang == 'en':
        return text
    try:
        return GoogleTranslator(source='en', target=target_lang).translate(text)
    except Exception as e:
        print(f"Translation to Native failed: {e}")
        return text