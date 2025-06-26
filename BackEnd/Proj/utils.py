import boto3
from django.conf import settings
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

def send_email_ses(recipient_email, subject, body_text, body_html=None):
    """
    Sends an email using AWS Simple Email Service (SES).

    Args:
        recipient_email (str): The email address of the recipient.
        subject (str): The subject line of the email.
        body_text (str): The plain text content of the email.
        body_html (str, optional): The HTML content of the email. Defaults to None.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    if not settings.AWS_SES_REGION_NAME or not settings.AWS_SES_SOURCE_EMAIL:
        logger.error("SES configuration missing. Please set AWS_SES_REGION_NAME and AWS_SES_SOURCE_EMAIL in settings.")
        return False

    sender = settings.AWS_SES_SOURCE_EMAIL
    aws_region = settings.AWS_SES_REGION_NAME

    # Create a new SES client
    client = boto3.client(
        'ses',
        region_name=aws_region,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )

    # The character encoding for the email.
    CHARSET = "UTF-8"

    # Try to send the email.
    try:
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    recipient_email,
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': CHARSET,
                        'Data': body_html if body_html else body_text, # Use HTML if provided, else plain text
                    },
                    'Text': {
                        'Charset': CHARSET,
                        'Data': body_text,
                    },
                },
                'Subject': {
                    'Charset': CHARSET,
                    'Data': subject,
                },
            },
            Source=sender,
        )
    except ClientError as e:
        logger.error(f"Failed to send email: {e.response['Error']['Message']}")
        return False
    else:
        logger.info(f"Email sent! Message ID: {response['MessageId']}")
        return True