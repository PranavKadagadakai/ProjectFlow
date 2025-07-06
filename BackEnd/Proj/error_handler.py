# BackEnd/Proj/error_handler.py
import boto3
import os
import json
import logging
from datetime import datetime

# Initialize logger for this module
logger = logging.getLogger(__name__)

class ErrorTracker:
    """
    Handles critical error tracking and sends notifications via AWS SNS.
    """
    def __init__(self):
        self.sns_client = boto3.client(
            'sns',
            region_name=os.environ.get('AWS_SNS_REGION', os.environ.get('AWS_REGION'))
        )
        # ERROR_NOTIFICATION_TOPIC should be an ARN to an SNS topic
        self.error_topic_arn = os.environ.get('ERROR_NOTIFICATION_TOPIC')

        if not self.error_topic_arn:
            logger.warning("AWS_SNS_REGION or ERROR_NOTIFICATION_TOPIC environment variables are not set. SNS notifications will be disabled.")


    def handle_critical_error(self, error_type: str, error_message: str, context: dict = None):
        """
        Logs critical errors and sends SNS notifications for specific types.

        Args:
            error_type (str): Categorization of the error (e.g., 'DATABASE_CONNECTION').
            error_message (str): A detailed message describing the error.
            context (dict, optional): Additional context related to the error. Defaults to None.
        """
        log_details = {
            'error_type': error_type,
            'message': error_message,
            'context': context if context is not None else {},
            'timestamp': datetime.utcnow().isoformat()
        }

        # Log error details
        logger.error(f"Critical error: {error_type} - {error_message}", extra=log_details)

        # Send SNS notification for critical errors
        critical_error_types = ['DATABASE_CONNECTION', 'ML_MODEL_FAILURE', 'AUTHENTICATION_FAILURE']
        if error_type in critical_error_types and self.error_topic_arn:
            try:
                self.sns_client.publish(
                    TopicArn=self.error_topic_arn,
                    Subject=f"Critical Error in Project Submission Portal: {error_type}",
                    Message=json.dumps(log_details, indent=2)
                )
                logger.info(f"SNS notification sent for critical error: {error_type}")
            except Exception as e:
                logger.error(f"Failed to send SNS notification for {error_type} error: {e}")
        elif not self.error_topic_arn:
            logger.warning(f"SNS Topic ARN not configured. Notification for {error_type} not sent.")

# Instantiate the ErrorTracker for use throughout the application
error_tracker = ErrorTracker()