import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import re

# --- NLTK Initialization ---
def initialize_nltk():
    """
    Downloads necessary NLTK data models.
    This is called once when the Django app starts.
    """
    try:
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
    except nltk.downloader.DownloadError:
        print("Downloading NLTK data (punkt, stopwords)...")
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        print("NLTK data downloaded.")

# --- ML Model Simulation ---

def preprocess_text(text):
    """
    Cleans and tokenizes text for analysis.
    - Converts to lowercase
    - Removes punctuation and numbers
    - Removes common English stop words
    """
    if not text:
        return []
    text = text.lower()
    text = re.sub(r'\d+', '', text) # Remove numbers
    text = re.sub(r'[^\w\s]', '', text) # Remove punctuation
    tokens = word_tokenize(text)
    stop_words = set(stopwords.words('english'))
    filtered_tokens = [word for word in tokens if word not in stop_words]
    return filtered_tokens

def simulate_ml_evaluation(text_content):
    """
    Simulates an ML model that scores a project submission based on keywords.
    
    This function mimics a simple NLP model by counting words related to 
    different evaluation criteria (quality, innovation, impact).
    
    Args:
        text_content (str): The summary or content of the project report.

    Returns:
        dict: A dictionary with scores for each criterion.
    """
    tokens = preprocess_text(text_content)
    
    # Define keywords for each evaluation criterion
    # These mimic the features an actual ML model might learn to associate with these concepts.
    keyword_map = {
        'quality': ['comprehensive', 'thorough', 'robust', 'well-structured', 'clear', 'detailed', 'analysis', 'testing'],
        'innovation': ['novel', 'innovative', 'creative', 'unique', 'breakthrough', 'paradigm', 'new', 'advanced'],
        'impact': ['impactful', 'significant', 'potential', 'useful', 'effective', 'scalable', 'application', 'benefit']
    }
    
    scores = {'quality': 0, 'innovation': 0, 'impact': 0}
    max_score_per_criterion = 33 # Distribute ~100 points across 3 criteria
    
    for criterion, keywords in keyword_map.items():
        # Score is based on the number of unique keywords found, capped to avoid simple keyword stuffing.
        found_keywords = {word for word in tokens if word in keywords}
        score = len(found_keywords) * (max_score_per_criterion / len(keywords))
        scores[criterion] = min(round(score, 2), max_score_per_criterion)

    return scores