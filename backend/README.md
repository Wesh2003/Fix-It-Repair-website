# Fix-It Repair Service Backend

A Django REST API for a multi-role repair service platform. Customers request repairs, staff members complete jobs, and admins manage everything.

## Architecture

### Database Models

1. **User** - Custom user model with roles (customer, staff, admin)
2. **Service** - Types of repair services (Plumbing, Electrical, etc.)
3. **RepairRequest** - Main model: customer → service request → staff assignment → completion → rating
4. **Feedback** - Ratings and reviews left by customers
5. **StaffProfile** - Extended profile for technicians (skills, ratings, availability)
6. **Payment** - Payment tracking (cash, card, mobile money, etc.)
7. **SupportTicket** - Customer support and complaints

### API Endpoints

#### Authentication
- `POST /api/users/` - Register new user
- `POST /api/users/login/` - Login (returns token)
- `POST /api/users/logout/` - Logout
- `POST /api/users/{id}/set_password/` - Change password

#### Users
- `GET /api/users/` - List all users (admin)
- `GET /api/users/{id}/` - Get user profile
- `PUT /api/users/{id}/` - Update profile

#### Services
- `GET /api/services/` - List all repair services
- `POST /api/services/` - Create service (admin only)

#### Repair Requests (Main Flow)
- `GET /api/repair-requests/` - List requests (filtered by role)
- `POST /api/repair-requests/` - Create new request (customer)
- `GET /api/repair-requests/{id}/` - Get request details
- `POST /api/repair-requests/{id}/assign/` - Assign staff (admin)
- `POST /api/repair-requests/{id}/start/` - Start work (staff)
- `POST /api/repair-requests/{id}/complete/` - Mark complete (staff)
- `POST /api/repair-requests/{id}/cancel/` - Cancel request

#### Other
- `POST /api/feedback/` - Leave review
- `GET /api/staff-profiles/` - List technicians
- `GET /api/staff-profiles/available/` - Get available staff
- `POST /api/payments/` - Create payment record
- `POST /api/support-tickets/` - Create support ticket

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up Database
```bash
python manage.py migrate
```

### 3. Create Superuser (Admin)
```bash
python manage.py createsuperuser
```

### 4. Run Development Server
```bash
python manage.py runserver
```

Access:
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

## Project Workflow

### Customer Flow
1. Register/Login as customer
2. Browse services
3. Create repair request with description & location
4. System notifies admin
5. Admin assigns available staff
6. Customer gets notification
7. Staff starts work (status changes to in_progress)
8. Staff completes and sets final cost
9. Payment is recorded
10. Customer leaves feedback/rating

### Staff Flow
1. Register/Login as staff with role 'staff'
2. Create StaffProfile with specializations
3. Get assigned repair requests
4. Start work (status → in_progress)
5. Complete job and set final cost
6. Rating is calculated from customer feedback

### Admin Flow
1. View all repair requests
2. Assign requests to available staff
3. Monitor payments
4. Handle support tickets
5. Manage services and staff

## Key Features

✅ **Role-Based Access Control** - Different permissions for customer/staff/admin
✅ **Request Lifecycle** - requested → assigned → in_progress → completed
✅ **Real-Time Status Updates** - WebSocket integration ready
✅ **Rating System** - Customer feedback tracked
✅ **Payment Tracking** - Multiple payment methods supported
✅ **Staff Management** - Skills, availability, ratings
✅ **Support System** - Tickets for issues/complaints

## Tech Stack

- **Backend**: Django 4.2
- **API**: Django REST Framework 3.14
- **Database**: PostgreSQL (optional, default SQLite)
- **Authentication**: Token-based
- **Deployment**: Gunicorn + Nginx ready

## File Structure

```
backend/
├── models.py           # All database models
├── serializers.py      # DRF serializers for API
├── views.py           # ViewSets and API logic
├── urls.py            # URL routing
├── admin.py           # Django admin config
├── requirements.txt   # Python dependencies
└── README.md          # This file
```

## Example Requests

### Register a Customer
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "securepass123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "securepass123"
  }'
```

### Create Repair Request
```bash
curl -X POST http://localhost:8000/api/repair-requests/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service": 1,
    "description": "Leaking kitchen faucet",
    "location": "123 Main St, Nairobi",
    "latitude": -1.2921,
    "longitude": 36.8219,
    "priority": "high",
    "estimated_cost": 5000.00
  }'
```

## Future Enhancements

- [ ] WebSocket for real-time notifications
- [ ] GPS tracking for staff location
- [ ] Stripe/Mpesa integration for payments
- [ ] Email/SMS notifications
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] Two-way customer-staff messaging

---

For questions or issues, check the documentation or create a GitHub issue.
