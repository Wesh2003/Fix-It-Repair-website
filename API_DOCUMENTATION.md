# API Documentation & Quick Start

## Quick Start

### 1. Setup Django Project

If you haven't created a Django project yet:

```bash
django-admin startproject fixit_project
cd fixit_project
```

### 2. Copy Backend Files

Copy the `backend/` folder into your project root.

### 3. Update Project Settings

Copy `backend/settings_example.py` content to `fixit_project/settings.py`:
- Add `'backend'` to `INSTALLED_APPS`
- Add REST Framework and CORS configuration
- Set `AUTH_USER_MODEL = 'backend.User'`

### 4. Update Main URLs

Edit `fixit_project/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend.urls')),
]
```

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Admin User

```bash
python manage.py createsuperuser
```

### 7. Run Server

```bash
python manage.py runserver
```

Now access:
- **API Browse**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

---

## Complete API Reference

### 1. Authentication Endpoints

#### Register
**POST** `/api/users/`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "customer"  // or "staff" or "admin"
}
```

**Response**: 201 Created
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "customer",
  "date_joined": "2024-01-15T10:30:00Z"
}
```

---

#### Login
**POST** `/api/users/login/`

```json
{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Response**: 200 OK
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user_id": 1,
  "role": "customer",
  "username": "john_doe"
}
```

---

#### Logout
**POST** `/api/users/logout/`

**Headers**: `Authorization: Token YOUR_TOKEN`

**Response**: 200 OK
```json
{
  "message": "Logged out successfully"
}
```

---

### 2. Services Endpoints

#### List Services
**GET** `/api/services/`

**Response**: 200 OK
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Plumbing",
      "description": "Fix pipes, leaks, and drainage issues",
      "base_price": "5000.00",
      "is_active": true,
      "created_at": "2024-01-10T08:00:00Z"
    },
    {
      "id": 2,
      "name": "Electrical",
      "description": "Rewiring, installation, and repairs",
      "base_price": "7000.00",
      "is_active": true,
      "created_at": "2024-01-10T08:05:00Z"
    }
  ]
}
```

---

### 3. Repair Requests (Core Workflow)

#### Create Repair Request
**POST** `/api/repair-requests/`

**Headers**: `Authorization: Token YOUR_TOKEN`

```json
{
  "service": 1,
  "description": "Leaking kitchen faucet, needs immediate attention",
  "location": "123 Main Street, Nairobi",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "priority": "high",
  "estimated_cost": 5000.00
}
```

**Response**: 201 Created
```json
{
  "id": 42,
  "customer": 1,
  "customer_name": "John Doe",
  "service": 1,
  "service_name": "Plumbing",
  "status": "requested",
  "priority": "high",
  "description": "Leaking kitchen faucet, needs immediate attention",
  "location": "123 Main Street, Nairobi",
  "requested_at": "2024-01-15T11:00:00Z"
}
```

---

#### List Requests (Role-Based)
**GET** `/api/repair-requests/`

**Headers**: `Authorization: Token YOUR_TOKEN`

- **Customer** sees: only their own requests
- **Staff** sees: unassigned requests + assigned to them
- **Admin** sees: all requests

**Response**: 200 OK
```json
{
  "count": 15,
  "results": [
    {
      "id": 42,
      "customer": 1,
      "customer_name": "John Doe",
      "service": 1,
      "service_name": "Plumbing",
      "status": "requested",
      "priority": "high",
      "requested_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

---

#### Get Request Details
**GET** `/api/repair-requests/{id}/`

**Headers**: `Authorization: Token YOUR_TOKEN`

**Response**: 200 OK (includes feedback, payment, full details)
```json
{
  "id": 42,
  "customer": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "service": {
    "id": 1,
    "name": "Plumbing",
    "base_price": "5000.00"
  },
  "assigned_staff": null,
  "status": "requested",
  "priority": "high",
  "description": "Leaking kitchen faucet",
  "location": "123 Main Street, Nairobi",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "requested_at": "2024-01-15T11:00:00Z",
  "feedback": null,
  "payment": null
}
```

---

#### Assign Staff (Admin Only)
**POST** `/api/repair-requests/{id}/assign/`

**Headers**: `Authorization: Token ADMIN_TOKEN`

```json
{
  "staff_id": 5
}
```

**Response**: 200 OK
```json
{
  "message": "Request assigned to Jane Smith"
}
```

---

#### Start Work (Staff)
**POST** `/api/repair-requests/{id}/start/`

**Headers**: `Authorization: Token STAFF_TOKEN`

**Response**: 200 OK
```json
{
  "message": "Work started"
}
```

---

#### Complete Job (Staff)
**POST** `/api/repair-requests/{id}/complete/`

**Headers**: `Authorization: Token STAFF_TOKEN`

```json
{
  "final_cost": 5500.00
}
```

**Response**: 200 OK
```json
{
  "message": "Request completed"
}
```

---

#### Cancel Request
**POST** `/api/repair-requests/{id}/cancel/`

**Headers**: `Authorization: Token YOUR_TOKEN`

**Response**: 200 OK
```json
{
  "message": "Request cancelled"
}
```

---

### 4. Feedback/Ratings

#### Leave Feedback
**POST** `/api/feedback/`

**Headers**: `Authorization: Token YOUR_TOKEN`

```json
{
  "repair_request": 42,
  "rating": 5,
  "comment": "Excellent work! Fixed the issue quickly and professionally."
}
```

**Response**: 201 Created
```json
{
  "id": 10,
  "repair_request": 42,
  "rating": 5,
  "comment": "Excellent work!",
  "created_at": "2024-01-15T15:30:00Z"
}
```

---

### 5. Staff Profiles

#### List Staff
**GET** `/api/staff-profiles/`

**Response**: 200 OK
```json
{
  "count": 8,
  "results": [
    {
      "id": 1,
      "user": 5,
      "user_info": {
        "id": 5,
        "username": "jane_smith",
        "first_name": "Jane",
        "last_name": "Smith"
      },
      "specializations": [
        {"id": 1, "name": "Plumbing"},
        {"id": 3, "name": "General Maintenance"}
      ],
      "years_experience": 5,
      "average_rating": 4.8,
      "total_completed_jobs": 120,
      "is_available": true
    }
  ]
}
```

---

#### Get Available Staff
**GET** `/api/staff-profiles/available/`

**Response**: 200 OK (same format, filtered for available staff)

---

### 6. Payments

#### Create Payment
**POST** `/api/payments/`

**Headers**: `Authorization: Token YOUR_TOKEN`

```json
{
  "repair_request": 42,
  "amount": 5500.00,
  "payment_method": "card",
  "transaction_id": "TXN-20240115-001"
}
```

**Response**: 201 Created
```json
{
  "id": 15,
  "repair_request": 42,
  "amount": "5500.00",
  "status": "pending",
  "payment_method": "card",
  "transaction_id": "TXN-20240115-001",
  "created_at": "2024-01-15T16:00:00Z"
}
```

---

### 7. Support Tickets

#### Create Support Ticket
**POST** `/api/support-tickets/`

**Headers**: `Authorization: Token YOUR_TOKEN`

```json
{
  "subject": "Payment issue",
  "description": "I was charged twice for request #42",
  "repair_request": 42
}
```

**Response**: 201 Created
```json
{
  "id": 5,
  "user": 1,
  "user_name": "John Doe",
  "repair_request": 42,
  "subject": "Payment issue",
  "description": "I was charged twice for request #42",
  "status": "open",
  "created_at": "2024-01-15T16:30:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Description of what went wrong"
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

---

## Common Use Cases

### Scenario 1: Customer Booking a Service

1. **Customer registers**
   - POST `/api/users/` with role="customer"
   - Get auth token from login

2. **Customer browses services**
   - GET `/api/services/`

3. **Customer creates repair request**
   - POST `/api/repair-requests/` with service, description, location

4. **Customer gets notification** (admin assigns staff)
   - Refresh GET `/api/repair-requests/{id}/`

5. **Customer pays**
   - POST `/api/payments/` with amount, method

6. **Customer leaves feedback**
   - POST `/api/feedback/` with rating and comment

---

### Scenario 2: Admin Workflow

1. **Admin views all requests**
   - GET `/api/repair-requests/` (sees all)

2. **Admin assigns staff**
   - POST `/api/repair-requests/{id}/assign/` with staff_id

3. **Admin monitors status**
   - Periodically GET `/api/repair-requests/` to check statuses

4. **Admin handles issues**
   - GET `/api/support-tickets/`
   - Update ticket status

---

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test123", "role": "customer"}'

# Login
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test123"}'

# Create request (replace TOKEN)
curl -X POST http://localhost:8000/api/repair-requests/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service": 1, "description": "Test", "location": "Test St", "priority": "medium"}'
```

---

## Security Notes

- Always use HTTPS in production
- Store tokens securely (HttpOnly cookies or secure storage)
- Use strong passwords
- Implement rate limiting
- Add CSRF protection
- Validate all inputs
- Use environment variables for sensitive data

---

End of API Documentation
