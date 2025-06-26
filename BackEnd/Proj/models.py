from django.db import models
from django.conf import settings

# Get the custom user model defined by Django's AUTH_USER_MODEL or the default User model
# This ensures compatibility if you later define a custom user model.
User = settings.AUTH_USER_MODEL

class Project(models.Model):
    """
    Represents an academic project that students can submit to.
    """
    title = models.CharField(max_length=255)
    description = models.TextField()
    # A project can be created by a faculty member.
    # Using 'settings.AUTH_USER_MODEL' to link to the User model configured in settings.py
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    # Start and end dates for project submission
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True) # To activate/deactivate project for submissions
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Submission(models.Model):
    """
    Represents a student's submission for a specific project.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='submissions')
    # Each submission is linked to a student (User).
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_submissions')
    report_file = models.FileField(upload_to='project_reports/', null=True, blank=True)
    github_link = models.URLField(max_length=500, null=True, blank=True)
    youtube_link = models.URLField(max_length=500, null=True, blank=True)
    demo_video_file = models.FileField(upload_to='demo_videos/', null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    # Status can be 'pending', 'evaluated', 'revisions_requested', etc.
    status = models.CharField(max_length=50, default='pending')

    class Meta:
        # Ensures that a student can submit only once per project
        unique_together = ('project', 'student')

    def __str__(self):
        return f"{self.student.username}'s submission for {self.project.title}"

class Rubric(models.Model):
    """
    Defines evaluation criteria (rubric) for a project.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='rubrics')
    criterion = models.CharField(max_length=255)
    max_points = models.IntegerField()
    # Optional: description for the criterion
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.project.title} - {self.criterion}"

class Evaluation(models.Model):
    """
    Represents a faculty's evaluation of a specific submission based on rubrics.
    """
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='evaluations')
    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name='evaluations')
    # The faculty member who performed the evaluation.
    evaluated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performed_evaluations')
    points_awarded = models.IntegerField()
    feedback = models.TextField(blank=True, null=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensures a specific faculty can evaluate a specific submission for a specific rubric only once
        unique_together = ('submission', 'rubric', 'evaluated_by')

    def __str__(self):
        return f"Evaluation for {self.submission} by {self.evaluated_by.username}"