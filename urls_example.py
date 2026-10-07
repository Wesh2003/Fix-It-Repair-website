# Main Django Project URLs
# This is an example of how to configure your main project's urls.py
# to include the backend API URLs.

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Include backend API URLs
    path('api/', include('backend.urls')),

    # Optional: API documentation (requires drf-spectacular or drf-yasg)
    # path('api/docs/', include('drf_spectacular.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL,
                          document_root=settings.STATIC_ROOT)
