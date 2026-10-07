from django.contrib import admin
from .models import User, Service, RepairRequest, Feedback, StaffProfile, Payment, SupportTicket


# this decorator registers the User model in django admin
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    # show these columns in the user list view
    list_display = ['username', 'email', 'role', 'first_name', 'last_name']
    # add filters on the right side (by role, by join date)
    list_filter = ['role', 'date_joined']
    # add a search box to search by username, email, name
    search_fields = ['username', 'email', 'first_name', 'last_name']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    # show these in the service list
    list_display = ['name', 'base_price', 'is_active', 'created_at']
    # filter by active status and when created
    list_filter = ['is_active', 'created_at']
    # search by name or description
    search_fields = ['name', 'description']


@admin.register(RepairRequest)
class RepairRequestAdmin(admin.ModelAdmin):
    # show these columns in the repair request list
    list_display = ['id', 'customer', 'service', 'status',
                    'priority', 'assigned_staff', 'requested_at']
    # add filters by status, priority, and date
    list_filter = ['status', 'priority', 'requested_at']
    # search by customer name, service, or description
    search_fields = ['customer__username', 'service__name', 'description']
    # don't let admins edit these auto-set dates
    readonly_fields = ['requested_at', 'started_at', 'completed_at']
    # organize the form into logical sections
    fieldsets = (
        ('Request Info', {
            'fields': ('customer', 'service', 'description', 'status', 'priority')
        }),
        ('Assignment', {
            'fields': ('assigned_staff',)
        }),
        ('Costs', {
            'fields': ('estimated_cost', 'final_cost')
        }),
        ('Location', {
            'fields': ('location', 'latitude', 'longitude')
        }),
        ('Timeline', {
            'fields': ('requested_at', 'scheduled_at', 'started_at', 'completed_at')
        }),
    )


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    # show request, rating, and when posted
    list_display = ['id', 'repair_request', 'rating', 'created_at']
    # filter by star rating and date
    list_filter = ['rating', 'created_at']
    # don't let admins edit the date (it's auto-set)
    readonly_fields = ['created_at']


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    # show these in the staff list
    list_display = ['user', 'years_experience',
                    'average_rating', 'total_completed_jobs', 'is_available']
    # filter by availability and rating
    list_filter = ['is_available', 'average_rating']
    # search by first/last name
    search_fields = ['user__first_name', 'user__last_name']
    # allows selecting multiple services as specializations (friendly interface)
    filter_horizontal = ['specializations']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    # show these columns in the payment list
    list_display = ['id', 'repair_request', 'amount',
                    'status', 'payment_method', 'created_at']
    # filter by payment status, method, and date
    list_filter = ['status', 'payment_method', 'created_at']
    # don't let admins edit the creation date (it's auto-set)
    readonly_fields = ['created_at']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    # show these columns in the ticket list
    list_display = ['id', 'user', 'subject', 'status', 'created_at']
    # filter by status and date
    list_filter = ['status', 'created_at']
    # don't let admins edit the creation date (it's auto-set)
    readonly_fields = ['created_at']
