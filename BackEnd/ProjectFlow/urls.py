from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
# NEW: Imports for serving media files locally during development
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('Proj.urls')),
]

# Serve the React app's index.html for all non-API routes.
# This pattern must be the LAST one in your urlpatterns list.
# It ensures that any URL not caught by the API or admin routes
# will be handled by the React frontend, allowing React Router to take over.
urlpatterns += [
    re_path(r'^(?:.*)/?$', TemplateView.as_view(template_name='index.html')),
]

# NEW: This line is crucial for serving files from MEDIA_ROOT in development mode.
# It tells Django to create a URL pattern that maps MEDIA_URL to MEDIA_ROOT.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)