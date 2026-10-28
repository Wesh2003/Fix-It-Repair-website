import secrets

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import (
    User, Service, RepairRequest, RepairProgressUpdate, Feedback, StaffProfile,
    Payment, SupportTicket,
)
from .serializers import (
    UserSerializer, AdministratorManagedUserSerializer,
    StaffAssignmentSerializer, RepairProgressNoteInputSerializer,
    ServiceSerializer, RepairRequestSerializer,
    RepairRequestDetailSerializer, RepairProgressUpdateSerializer,
    FeedbackSerializer, StaffProfileSerializer, PaymentSerializer,
    SupportTicketSerializer,
)


def is_administrator(user):
    return bool(
        user
        and user.is_authenticated
        and (user.role == 'admin' or user.is_superuser)
    )


class IsAdministrator(permissions.BasePermission):
    """Grant access to application administrators, independent of Django staff flags."""

    def has_permission(self, request, view):
        return is_administrator(request.user)


class IsMaintenanceStaff(permissions.BasePermission):
    """Grant access to maintenance staff accounts."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'staff'
        )


class IsCustomer(permissions.BasePermission):
    """Grant repair request creation access to customer accounts."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'customer'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission: Allow users to view/edit their own data or if they're admin."""
    
    def has_object_permission(self, request, view, obj):
        # admins can do anything
        if is_administrator(request.user):
            return True
        # regular users can only access their own data
        return obj.id == request.user.id


class UserViewSet(viewsets.ModelViewSet):
    """
    User registration, login, and profile management.
    
    Endpoints:
    - GET /api/users/ - list all users (admin only)
    - POST /api/users/ - register new user
    - GET /api/users/{id}/ - get user details
    - PUT/PATCH /api/users/{id}/ - update user profile
    - POST /api/users/{id}/set_password/ - change password
    - POST /api/users/login/ - login (get auth token)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'login', 'staff_signup', 'admin_signup']:
            return [permissions.AllowAny()]
        if self.action == 'list':
            return [IsAdministrator()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_serializer_class(self):
        if self.action in ['list', 'update', 'partial_update'] and is_administrator(
            self.request.user
        ):
            return AdministratorManagedUserSerializer
        return UserSerializer
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """Authenticate a user and return an authentication token."""
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response(
                {'error': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.id,
            'role': 'admin' if user.is_superuser else user.role,
            'username': user.username,
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def staff_signup(self, request):
        """Create a maintenance staff account and its profile."""
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            user = serializer.save(role='staff')
            StaffProfile.objects.create(user=user)
        return Response(
            {'message': 'Maintenance staff account created.'},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def admin_signup(self, request):
        """Create an administrator account only when the server key is configured."""
        configured_key = getattr(settings, 'ADMIN_SIGNUP_KEY', '')
        submitted_key = request.data.get('admin_key', '')
        if not configured_key or not submitted_key or not secrets.compare_digest(
            str(submitted_key), str(configured_key)
        ):
            return Response(
                {'error': 'Administrator registration is unavailable or the key is invalid.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(role='admin', is_staff=True)
        return Response(
            {'message': 'Administrator account created.'},
            status=status.HTTP_201_CREATED,
        )
    
    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        """change user password"""
        # get the user object
        user = self.get_object()
        # get the old and new passwords from request
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        # check if the old password is correct (security check)
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # set the new password (using django's secure hashing)
        user.set_password(new_password)
        # save the change to database
        user.save()
        return Response({'message': 'Password updated successfully'})
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        """logout: delete user's auth token"""
        # find and delete the auth token for this user (so they can't use it anymore)
        Token.objects.filter(user=request.user).delete()
        return Response({'message': 'Logged out successfully'})


class ServiceViewSet(viewsets.ModelViewSet):
    """
    Repair service types (Plumbing, Electrical, etc.)
    
    Endpoints:
    - GET /api/services/ - List all services
    - POST /api/services/ - Create service (admin only)
    - GET /api/services/{id}/ - Get service details
    - PUT/PATCH /api/services/{id}/ - Update service
    """
    # only show active services (hide disabled ones)
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        """only admins can create/edit/delete services"""
        # check which action is being performed
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        # for viewing, allow authenticated and unauthenticated (read-only) users
        return [permissions.IsAuthenticatedOrReadOnly()]


class RepairRequestViewSet(viewsets.ModelViewSet):
    """
    Customer repair requests - full lifecycle management.
    
    Endpoints:
    - GET /api/repair-requests/ - List requests (filtered by user role)
    - POST /api/repair-requests/ - Create new request (customer)
    - GET /api/repair-requests/{id}/ - Get request details
    - PUT/PATCH /api/repair-requests/{id}/ - Update request
    - POST /api/repair-requests/{id}/assign/ - Assign staff (admin)
    - POST /api/repair-requests/{id}/start/ - Start work (staff)
    - POST /api/repair-requests/{id}/complete/ - Mark complete (staff)
    - POST /api/repair-requests/{id}/cancel/ - Cancel request
    """
    serializer_class = RepairRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCustomer()]
        if self.action == 'assign':
            return [IsAdministrator()]
        if self.action in ['start', 'complete']:
            return [IsMaintenanceStaff()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdministrator()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """filter requests based on user role"""
        user = self.request.user
        # admin sees all requests in the system
        if is_administrator(user):
            queryset = RepairRequest.objects.select_related(
                'customer', 'service', 'assigned_staff'
            ).prefetch_related('progress_updates__author')
            search = self.request.query_params.get('search', '').strip()
            request_status = self.request.query_params.get('status', '')
            priority = self.request.query_params.get('priority', '')
            service_id = self.request.query_params.get('service', '')

            if request_status:
                valid_statuses = dict(RepairRequest.STATUS_CHOICES)
                if request_status not in valid_statuses:
                    raise ValidationError({'status': 'Select a valid report status.'})
                queryset = queryset.filter(status=request_status)
            if priority:
                valid_priorities = dict(RepairRequest.PRIORITY_CHOICES)
                if priority not in valid_priorities:
                    raise ValidationError({'priority': 'Select a valid priority.'})
                queryset = queryset.filter(priority=priority)
            if service_id:
                if not service_id.isdecimal():
                    raise ValidationError({'service': 'Enter a valid issue category.'})
                queryset = queryset.filter(service_id=int(service_id))
            if search:
                queryset = queryset.filter(
                    Q(description__icontains=search)
                    | Q(location__icontains=search)
                    | Q(service__name__icontains=search)
                    | Q(customer__username__icontains=search)
                    | Q(customer__first_name__icontains=search)
                    | Q(customer__last_name__icontains=search)
                )
            return queryset
        # staff only sees work assigned to them
        elif user.role == 'staff':
            return RepairRequest.objects.filter(assigned_staff=user).prefetch_related(
                'progress_updates__author'
            )
        # customers only see their own requests
        else:
            return RepairRequest.objects.filter(customer=user).prefetch_related(
                'progress_updates__author'
            )
    
    def get_serializer_class(self):
        """use detailed serializer for single request, simple for list"""
        # when viewing one request (retrieve), show all related data
        if self.action == 'retrieve':
            return RepairRequestDetailSerializer
        # for list view, use simpler version (faster loading)
        return RepairRequestSerializer
    
    def perform_create(self, serializer):
        """automatically set current user as customer"""
        # when a customer creates a request, they are automatically the customer
        serializer.save(customer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """assign staff member to a repair request"""
        # get the repair request that admin wants to assign
        repair_request = self.get_object()
        if repair_request.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'Completed or cancelled requests cannot be assigned.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assignment_serializer = StaffAssignmentSerializer(data=request.data)
        assignment_serializer.is_valid(raise_exception=True)
        staff_id = assignment_serializer.validated_data['staff_id']

        try:
            # find a staff user with the given id
            staff = User.objects.get(id=staff_id, role='staff', is_active=True)
            # assign this staff member to the request
            repair_request.assigned_staff = staff
            # change status from 'requested' to 'assigned'
            repair_request.status = 'assigned'
            # save the changes to database
            repair_request.save()
            # return success message with staff name
            return Response({'message': f'Request assigned to {staff.get_full_name()}'})
        except User.DoesNotExist:
            # if staff not found, return 404 error
            return Response({'error': 'Staff not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """mark request as in progress (staff only)"""
        # get the repair request object
        repair_request = self.get_object()
        # only the assigned staff can start work on a request
        if (
            repair_request.assigned_staff != request.user
            or repair_request.status != 'assigned'
        ):
            return Response({'error': 'Not assigned to you'}, status=status.HTTP_403_FORBIDDEN)
        
        # change status from 'assigned' to 'in_progress'
        repair_request.status = 'in_progress'
        # record when work started (current date/time)
        repair_request.started_at = timezone.now()
        # save to database
        repair_request.save()
        RepairProgressUpdate.objects.create(
            repair_request=repair_request,
            author=request.user,
            note='Work started.',
        )
        return Response({'message': 'Work started'})

    @action(detail=True, methods=['post'])
    def progress(self, request, pk=None):
        """Add a progress note to a repair assigned to the current staff member."""
        repair_request = self.get_object()
        if (
            repair_request.assigned_staff != request.user
            or repair_request.status != 'in_progress'
        ):
            return Response(
                {'error': 'Progress updates are available only for your in-progress assignments.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RepairProgressNoteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        update = RepairProgressUpdate.objects.create(
            repair_request=repair_request,
            author=request.user,
            note=serializer.validated_data['note'],
        )
        return Response(
            RepairProgressUpdateSerializer(update).data,
            status=status.HTTP_201_CREATED,
        )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """mark request as completed (staff)"""
        # get the repair request object
        repair_request = self.get_object()
        # only the assigned staff can complete a request
        if (
            repair_request.assigned_staff != request.user
            or repair_request.status != 'in_progress'
        ):
            return Response({'error': 'Not assigned to you'}, status=status.HTTP_403_FORBIDDEN)
        
        # change status to 'completed'
        repair_request.status = 'completed'
        # record when work finished (current date/time)
        repair_request.completed_at = timezone.now()
        # if staff provides a final cost, use it; otherwise use the estimate
        repair_request.final_cost = request.data.get('final_cost', repair_request.estimated_cost)
        # save to database
        repair_request.save()
        RepairProgressUpdate.objects.create(
            repair_request=repair_request,
            author=request.user,
            note='Issue marked resolved.',
        )
        return Response({'message': 'Request completed'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """cancel a repair request"""
        # get the repair request object
        repair_request = self.get_object()
        # only the customer who created it or staff/admin can cancel
        if repair_request.customer != request.user and not is_administrator(request.user):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # change status to 'cancelled'
        repair_request.status = 'cancelled'
        # save to database
        repair_request.save()
        return Response({'message': 'Request cancelled'})


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    Customer feedback and ratings for completed requests.
    
    Endpoints:
    - GET /api/feedback/ - list feedback
    - POST /api/feedback/ - submit review for a repair request
    """
    # show all feedback
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    # only authenticated users can create feedback
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """save feedback to database"""
        # when customer submits feedback, it's linked to their request
        serializer.save()


class StaffProfileViewSet(viewsets.ModelViewSet):
    """
    Service staff profiles with specializations and ratings.
    
    Endpoints:
    - GET /api/staff-profiles/ - list all staff
    - POST /api/staff-profiles/available/ - get available staff only
    """
    # show all staff profiles
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    # anyone can view staff profiles, only authenticated can create
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """get list of available staff members who can take jobs"""
        # filter to only staff who are currently accepting jobs (is_available=True)
        available_staff = StaffProfile.objects.filter(is_available=True)
        # serialize the staff data
        serializer = self.get_serializer(available_staff, many=True)
        # return the list of available staff
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment processing and records.
    
    Endpoints:
    - GET /api/payments/ - list user's payments (or all if admin)
    - POST /api/payments/ - record new payment
    """
    # show all payments
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    # only authenticated users can view payments
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """users can only view their own payments, admins see all"""
        user = self.request.user
        # admin sees every payment in system
        if is_administrator(user):
            return Payment.objects.all()
        # regular users only see payments for their repair requests
        return Payment.objects.filter(repair_request__customer=user)


class SupportTicketViewSet(viewsets.ModelViewSet):
    """
    Customer support and complaint tickets.
    
    Endpoints:
    - GET /api/support-tickets/ - list user's tickets (or all if admin)
    - POST /api/support-tickets/ - create new support ticket
    """
    # show all support tickets
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    # only authenticated users can access support tickets
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """users see their own tickets, admins see all"""
        user = self.request.user
        # admin sees all support tickets in system
        if is_administrator(user):
            return SupportTicket.objects.all()
        # regular users only see their own tickets
        return SupportTicket.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """Automatically set current user"""
        serializer.save(user=self.request.user)
