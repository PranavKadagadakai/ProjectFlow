import boto3
import io
import logging
from django.conf import settings
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

logger = logging.getLogger(__name__)

def extract_text_from_s3_pdf(s3_key: str) -> str:
    """
    Downloads a PDF file from AWS S3 and extracts its text content.

    Args:
        s3_key (str): The S3 key (path) to the PDF file.

    Returns:
        str: The extracted text content from the PDF, or an empty string if extraction fails.
    """
    if not s3_key:
        logger.warning("No S3 key provided for PDF extraction.")
        return ""

    s3_client = boto3.client(
        's3',
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME

    try:
        # Download the PDF file from S3 into memory
        response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        pdf_bytes = response['Body'].read()
        
        # Use io.BytesIO to treat the bytes as a file-like object
        pdf_file_object = io.BytesIO(pdf_bytes)
        
        # Extract text using pdfminer.six
        output_string = io.StringIO()
        laparams = LAParams() # Default layout analysis parameters
        
        extract_text_to_fp(pdf_file_object, output_string, laparams=laparams)
        
        extracted_text = output_string.getvalue()
        logger.info(f"Successfully extracted text from S3 PDF: {s3_key}")
        return extracted_text

    except Exception as e:
        logger.error(f"Error extracting text from S3 PDF '{s3_key}': {e}")
        return ""

