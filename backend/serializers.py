from rest_framework import serializers
from .models import (
    User, Service, RepairRequest, RepairProgressUpdate, Feedback, StaffProfile,
    Payment, SupportTicket,
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - handles registration and user details"""
    # password should only be sent by client, never returned in response
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        # which fields to include in the api response
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone',
                  'role', 'bio', 'profile_picture', 'password', 'date_joined']
        # these fields are set automatically by django, clients can't change them
        read_only_fields = ['id', 'date_joined', 'role']

    def create(self, validated_data):
        """create a new user with hashed password"""
        password = validated_data.pop('password')
        # create user with other fields
        user = User(**validated_data)
        # use django's set_password to hash the password securely
        user.set_password(password)
        # save to database
        user.save()
        return user


class AdministratorManagedUserSerializer(serializers.ModelSerializer):
    """Fields administrators can manage without exposing credentials."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'role', 'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'role', 'date_joined']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_superuser:
            data['role'] = 'admin'
        return data

    def validate_is_active(self, value):
        request = self.context.get('request')
        if (
            self.instance
            and request
            and self.instance.pk == request.user.pk
            and not value
        ):
            raise serializers.ValidationError('You cannot deactivate your own account.')
        return value


class StaffAssignmentSerializer(serializers.Serializer):
    staff_id = serializers.IntegerField(min_value=1)


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model - repair types"""
    class Meta:
        model = Service
        # return these fields when clients request services
        fields = ['id', 'name', 'description',
            'base_price', 'icon', 'is_active', 'created_at']
        # id and created_at are auto-generated, clients can't change them
        read_only_fields = ['id', 'created_at']


class FeedbackSerializer(serializers.ModelSerializer):
    """Serializer for Feedback/Reviews"""
    class Meta:
        model = Feedback
        fields = ['id', 'repair_request', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class RepairProgressUpdateSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = RepairProgressUpdate
        fields = ['id', 'author_name', 'note', 'created_at']
        read_only_fields = ['id', 'author_name', 'created_at']


class StaffProfileSerializer(serializers.ModelSerializer):
    """Serializer for Staff extended profile"""
    # include full service details (not just ids) when returning staff profiles
    specializations = ServiceSerializer(many=True, read_only=True)
    # include full user info when returning staff profiles
    user_info = UserSerializer(source='user', read_only=True)

    class Meta:
        model = StaffProfile
        fields = ['id', 'user', 'user_info', 'specializations', 'years_experience',
                  'certifications', 'average_rating', 'total_completed_jobs',
                  'is_available', 'service_radius_km', 'created_at']
        # these are calculated automatically, clients can't set them
        read_only_fields = ['id', 'average_rating',
            'total_completed_jobs', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment records"""
    class Meta:
        model = Payment
        fields = ['id', 'repair_request', 'amount', 'status', 'payment_method',
                  'transaction_id', 'paid_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class RepairRequestDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for RepairRequest with related data"""
    # include full user info, not just id
    customer = UserSerializer(read_only=True)
    # include full service info, not just id
    service = ServiceSerializer(read_only=True)
    # include full staff info, not just id
    assigned_staff = UserSerializer(read_only=True)
    # include feedback if it exists
    feedback = FeedbackSerializer(read_only=True)
    # include payment info if it exists
    payment = PaymentSerializer(read_only=True)
    progress_updates = RepairProgressUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = RepairRequest
        fields = ['id', 'customer', 'service', 'assigned_staff', 'status', 'priority',
                  'description', 'estimated_cost', 'final_cost', 'location',
                  'latitude', 'longitude', 'photo', 'requested_at', 'scheduled_at',
                  'started_at', 'completed_at', 'feedback', 'payment',
                  'progress_updates']
        # these are set automatically, clients can't change them
        read_only_fields = ['id', 'requested_at', 'completed_at', 'started_at']


class RepairRequestSerializer(serializers.ModelSerializer):
    """Simple serializer for RepairRequest - for list and create operations"""
    # get customer's name instead of just their id (show 'John Doe' not 'customer': 1)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    # get service name instead of just the id
    service_name = serializers.CharField(source='service.name', read_only=True)
    progress_updates = RepairProgressUpdateSerializer(many=True, read_only=True)

    def validate_photo(self, photo):
        if photo and photo.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('The photo must be 5 MB or smaller.')
        return photo
    
    class Meta:
        model = RepairRequest
        fields = ['id', 'customer', 'customer_name', 'service', 'service_name',
                  'assigned_staff', 'status', 'priority', 'description', 
                  'estimated_cost', 'final_cost', 'location', 'photo',
                  'requested_at', 'started_at', 'completed_at',
                  'progress_updates']
        read_only_fields = [
            'id', 'customer', 'customer_name', 'assigned_staff', 'status',
            'requested_at', 'started_at', 'completed_at',
            'progress_updates',
        ]


class RepairProgressNoteInputSerializer(serializers.Serializer):
    note = serializers.CharField(max_length=2000, trim_whitespace=True)


class SupportTicketSerializer(serializers.ModelSerializer):
    """Serializer for Support Tickets"""
    # show user's full name instead of just id
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'user', 'user_name', 'repair_request', 'subject', 'description', 
                  'status', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'created_at']
