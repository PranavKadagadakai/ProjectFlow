import os
import google.generativeai as genai
import json
from django.conf import settings

def get_ai_evaluation(text_content, rubrics):
    """
    Evaluates project text content against a set of rubrics using the Gemini API.

    Args:
        text_content (str): The summary or content of the project report.
        rubrics (list of RubricModel): A list of PynamoDB rubric models for the project.

    Returns:
        dict: A dictionary containing scores and feedback for each rubric criterion,
              or an error message.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return {"error": "Gemini API key is not configured."}

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Dynamically build the rubric and JSON schema description for the prompt
        rubric_details = ""
        json_properties = {}
        for rubric in rubrics:
            criterion_key = rubric.criterion.lower().replace(" ", "_")
            rubric_details += f"- **{rubric.criterion} (Max Points: {rubric.max_points})**: {rubric.description}\n"
            json_properties[f"{criterion_key}_score"] = {"type": "number", "description": f"Score for {rubric.criterion} from 0 to {rubric.max_points}."}
            json_properties[f"{criterion_key}_feedback"] = {"type": "string", "description": f"Constructive feedback for {rubric.criterion}."}

        # Construct the detailed prompt
        prompt = f"""
        As an expert academic evaluator, please assess the following project summary based on the provided rubrics.
        Provide a score and constructive feedback for each criterion.
        Your response MUST be a valid JSON object.

        **Project Summary:**
        ---
        {text_content}
        ---

        **Evaluation Rubrics:**
        {rubric_details}

        **Instructions:**
        1. Read the project summary carefully.
        2. For each rubric criterion, assign a score from 0 up to the maximum points allowed for that criterion.
        3. Provide brief, specific, and constructive feedback for each criterion, explaining your reasoning for the score.
        4. Your final output must be a single JSON object with the following structure:
        {json.dumps(json_properties, indent=2)}
        """

        # Generate content using the Gemini API
        response = model.generate_content(prompt)
        
        # Clean the response to extract only the JSON part
        cleaned_response_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        
        # Parse the JSON response
        evaluation_result = json.loads(cleaned_response_text)
        return evaluation_result

    except Exception as e:
        print(f"An error occurred during AI evaluation: {e}")
        return {"error": f"Failed to get evaluation from AI model. Details: {str(e)}"}