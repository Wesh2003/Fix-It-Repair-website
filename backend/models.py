from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    """
    Custom user model with role-based access.
    Roles: customer (STUDENT), staff (technician), admin
    """
    # three roles: customer (person requesting repair), staff (technician), admin (manager)
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('staff', 'Service Staff'),
        ('admin', 'Administrator'),
    )

    # store which role this user has: customer, staff, or admin
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default='customer')
    # optional phone number for contact
    phone = models.CharField(max_length=15, blank=True)
    # optional profile picture that gets stored in media/profiles/ folder
    profile_picture = models.ImageField(
        upload_to='profiles/', null=True, blank=True)
    # optional bio/description about the user
    bio = models.TextField(blank=True)

    class Meta:
        # show newest users first when listing
        ordering = ['-date_joined']

    def __str__(self):
        # when displaying a user, show their full name and role
        return f"{self.get_full_name()} ({self.role})"


class Service(models.Model):
    """
    Types of repair services (Plumbing, Electrical, Carpentry, etc.)
    examples: plumbing, electrical, carpentry, general maintenance
    """
    # name of the service type like "Plumbing" or "Electrical"
    name = models.CharField(max_length=100)
    # detailed description of what this service includes
    description = models.TextField()
    # starting price for this service type
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    # optional icon/image to display for this service
    icon = models.ImageField(upload_to='services/', null=True, blank=True)
    # true if this service is available, false if discontinued
    is_active = models.BooleanField(default=True)
    # automatically set when the service is created, never changes
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # show services in alphabetical order by name
        ordering = ['name']

    def __str__(self):
        # when displaying a service, show its name
        return self.name


class RepairRequest(models.Model):
    """
    A customer's request for a repair service.
    Tracks the full lifecycle: requested → assigned → in_progress → completed → rated
    """
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('assigned', 'Assigned to Staff'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    # --- who is involved ---
    # link to the customer who made this request (if customer deleted, all their requests deleted too)
    customer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='repair_requests')
    # which service type was requested (plumbing, electrical, etc)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    # which staff member is assigned to do this repair (can be empty if not yet assigned)
    assigned_staff = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,  # if staff is deleted, just clear this field
        null=True,
        blank=True,
        related_name='assigned_repairs',
        # only allow staff members to be assigned
        limit_choices_to={'role': 'staff'}
    )

    # --- current status ---
    # where is this request in the workflow? requested -> assigned -> in_progress -> completed
    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES, default='requested')
    # how urgent is this? low, medium, high, or urgent
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default='medium')

    # --- what the customer needs ---
    # what needs to be fixed? describe the problem
    description = models.TextField()
    # how much we think it will cost
    estimated_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)
    # how much it actually cost when done
    final_cost = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True)

    # --- where to go ---
    # street address where the repair needs to happen
    location = models.CharField(max_length=255)
    # gps latitude for mapping/navigation
    latitude = models.FloatField(null=True, blank=True)
    # gps longitude for mapping/navigation
    longitude = models.FloatField(null=True, blank=True)

    # --- timeline ---
    # when customer created this request (auto-set, never changes)
    requested_at = models.DateTimeField(auto_now_add=True)
    # when is the staff member scheduled to show up
    scheduled_at = models.DateTimeField(null=True, blank=True)
    # when the staff member actually started working
    started_at = models.DateTimeField(null=True, blank=True)
    # when the repair was finished
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Request #{self.id} - {self.service.name} by {self.customer.username}"


class Feedback(models.Model):
    """
    Customer ratings and reviews for completed repair requests.
    stores what the customer thought about the service
    """
    # link to the repair request this feedback is about (one feedback per request)
    repair_request = models.OneToOneField(
        RepairRequest, on_delete=models.CASCADE, related_name='feedback')
    # star rating: must be 1, 2, 3, 4, or 5
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="rating from 1 to 5 stars"
    )
    # optional written comment/review from the customer
    comment = models.TextField(blank=True)
    # when the review was submitted (auto-set, never changes)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # show newest reviews first
        ordering = ['-created_at']

    def __str__(self):
        # display feedback as: "Feedback for Request #42 - 5★"
        return f"Feedback for Request #{self.repair_request.id} - {self.rating}★"


class StaffProfile(models.Model):
    """
    Extended profile for service staff (technicians).
    stores extra info about staff like skills and ratings
    """
    # link to the user account (only for users with role='staff')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile',
                                limit_choices_to={'role': 'staff'})
    # what services can this person do? they can specialize in multiple services
    specializations = models.ManyToManyField(
        Service, related_name='staff_specialists')

    # --- experience & qualifications ---
    # how many years has this person been doing this work
    years_experience = models.IntegerField(default=0)
    # what certifications do they have? (plumbing license, electrical license, etc)
    certifications = models.TextField(
        blank=True, help_text="list of certifications")

    # --- performance tracking ---
    # what's their average star rating from customer feedback? (0.0 to 5.0)
    average_rating = models.FloatField(default=0.0)
    # how many jobs have they completed successfully
    total_completed_jobs = models.IntegerField(default=0)

    # --- availability ---
    # are they available to take new jobs right now?
    is_available = models.BooleanField(default=True)
    # how far are they willing to travel? (in kilometers)
    service_radius_km = models.IntegerField(
        default=10, help_text="service area radius in km")

    # when this profile was created (auto-set, never changes)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # display as: "Staff Profile - Jane Smith"
        return f"Staff Profile - {self.user.get_full_name()}"


class Payment(models.Model):
    """
    Payment records for completed repair requests.
    tracks who paid, how much, when, and using which method
    """
    # has the payment been processed?
    STATUS_CHOICES = (
        ('pending', 'Pending'),       # not yet paid
        ('completed', 'Completed'),   # payment received
        ('failed', 'Failed'),         # payment attempt failed
        ('refunded', 'Refunded'),     # money given back
    )

    # how did they pay?
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),                   # physical money
        ('card', 'Card'),                   # credit/debit card
        ('mobile_money', 'Mobile Money'),   # mpesa, etc
        ('bank_transfer', 'Bank Transfer'),  # direct bank transfer
    )

    # link to the repair that this payment is for (one payment per repair)
    repair_request = models.OneToOneField(
        RepairRequest, on_delete=models.CASCADE, related_name='payment')
    # how much did they pay?
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    # is the payment pending, completed, failed, or refunded?
    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES, default='pending')
    # cash, card, mobile money, or bank transfer?
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES)

    # --- transaction details ---
    # unique id for tracking this payment (from payment gateway or bank)
    transaction_id = models.CharField(max_length=100, unique=True)
    # when did they actually pay? (null until paid)
    paid_at = models.DateTimeField(null=True, blank=True)
    # when was this payment record created (auto-set, never changes)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} - {self.amount} ({self.status})"


class SupportTicket(models.Model):
    """
    Customer support tickets for issues or complaints.
    when customers have problems, they create a support ticket
    """
    # what stage is the ticket in?
    STATUS_CHOICES = (
        ('open', 'Open'),                 # just created, not handled yet
        ('in_progress', 'In Progress'),   # support team is working on it
        ('resolved', 'Resolved'),         # issue is fixed
        ('closed', 'Closed'),             # ticket is done and closed
    )

    # who created this support ticket?
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='support_tickets')
    # which repair request is this about? (optional - could be about account issues too)
    repair_request = models.ForeignKey(
        RepairRequest, on_delete=models.SET_NULL, null=True, blank=True)

    # short title of the problem
    subject = models.CharField(max_length=200)
    # detailed description of what's wrong
    description = models.TextField()
    # is it open, being worked on, resolved, or closed?
    status = models.CharField(
        max_length=15, choices=STATUS_CHOICES, default='open')

    # when was the ticket created (auto-set, never changes)
    created_at = models.DateTimeField(auto_now_add=True)
    # when was the issue resolved? (null until resolved)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # show newest tickets first
        ordering = ['-created_at']

    def __str__(self):
        # display as: "Ticket #5 - Payment issue"
        return f"Ticket #{self.id} - {self.subject}"
