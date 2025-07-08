from django.apps import AppConfig

class MlEvaluatorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ml_evaluator'

    # def ready(self):
    #     # This method is called when Django starts.
    #     # It's a good place to initialize things like the ML model.
    #     from . import evaluator
    #     evaluator.initialize_nltk()