import logging
from django.conf import settings
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams
import io
import os # Import os for path joining

logger = logging.getLogger(__name__)

def extract_text_from_local_pdf(file_path: str) -> str:
    """
    Reads a PDF file from the local file system and extracts its text content.

    Args:
        file_path (str): The local path to the PDF file relative to MEDIA_ROOT.

    Returns:
        str: The extracted text content from the PDF, or an empty string if extraction fails.
    """
    if not file_path:
        logger.warning("No file path provided for PDF extraction.")
        return ""

    # Construct the absolute path to the file
    absolute_file_path = os.path.join(settings.MEDIA_ROOT, file_path)

    if not os.path.exists(absolute_file_path):
        logger.error(f"PDF file not found at local path: {absolute_file_path}")
        return ""

    try:
        with open(absolute_file_path, 'rb') as pdf_file_object:
            output_string = io.StringIO()
            laparams = LAParams() # Default layout analysis parameters
            
            extract_text_to_fp(pdf_file_object, output_string, laparams=laparams)
            
            extracted_text = output_string.getvalue()
            logger.info(f"Successfully extracted text from local PDF: {file_path}")
            return extracted_text

    except Exception as e:
        logger.error(f"Error extracting text from local PDF '{file_path}': {e}")
        return ""
