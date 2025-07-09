from django.contrib import admin
from django.urls import path, include
# NEW: Imports for serving media files locally during development
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('Proj.urls')),
]

# NEW: This line is crucial for serving files from MEDIA_ROOT in development mode.
# It tells Django to create a URL pattern that maps MEDIA_URL to MEDIA_ROOT.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)