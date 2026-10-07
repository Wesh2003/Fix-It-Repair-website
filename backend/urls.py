from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ServiceViewSet, RepairRequestViewSet, FeedbackViewSet,
    StaffProfileViewSet, PaymentViewSet, SupportTicketViewSet
)

# rest_framework's router automatically generates url patterns for viewsets
# for each registered viewset, it creates list, create, retrieve, update, destroy endpoints
router = DefaultRouter()

# users: GET /users/, POST /users/, GET /users/1/, PUT /users/1/, POST /users/login/, etc
router.register(r'users', UserViewSet, basename='user')

# services: GET /services/, POST /services/ (admin only), GET /services/1/, etc
router.register(r'services', ServiceViewSet, basename='service')

# repair requests: main workflow - GET /repair-requests/, POST /repair-requests/, GET /repair-requests/1/
# plus custom actions: POST /repair-requests/1/assign/, /start/, /complete/, /cancel/
router.register(r'repair-requests', RepairRequestViewSet,
                basename='repair-request')

# feedback/reviews: POST /feedback/ (create review), GET /feedback/ (list reviews)
router.register(r'feedback', FeedbackViewSet, basename='feedback')

# staff profiles: GET /staff-profiles/ (list technicians), POST /staff-profiles/available/ (get available staff)
router.register(r'staff-profiles', StaffProfileViewSet,
                basename='staff-profile')

# payments: POST /payments/ (create payment), GET /payments/ (list user's payments)
router.register(r'payments', PaymentViewSet, basename='payment')

# support tickets: POST /support-tickets/ (create ticket), GET /support-tickets/ (list user's tickets)
router.register(r'support-tickets', SupportTicketViewSet,
                basename='support-ticket')

# include all the automatically generated urls
urlpatterns = [
    path('', include(router.urls)),
]
