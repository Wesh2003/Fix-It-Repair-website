from django.test import override_settings
from rest_framework.test import APITestCase

from .models import RepairRequest, Service, StaffProfile, User


class StudentAccountAndRepairFlowTests(APITestCase):
    def test_student_can_register_and_log_in(self):
        registration = self.client.post(
            '/api/users/',
            {
                'username': 'student-one',
                'first_name': 'Student',
                'last_name': 'One',
                'email': 'student@example.com',
                'password': 'Safe-password-123',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(registration.status_code, 201)
        self.assertNotIn('password', registration.data)
        user = User.objects.get(username='student-one')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(user.check_password('Safe-password-123'))

        login = self.client.post(
            '/api/users/login/',
            {'username': 'student-one', 'password': 'Safe-password-123'},
            format='json',
        )

        self.assertEqual(login.status_code, 200)
        self.assertTrue(login.data['token'])
        self.assertEqual(login.data['user_id'], user.id)

    def test_student_can_submit_and_view_their_repair_request(self):
        user = User.objects.create_user(
            username='student-two',
            password='Safe-password-123',
            role='customer',
        )
        service = Service.objects.create(
            name='Plumbing',
            description='Leaks and water fixtures',
            base_price='0.00',
        )
        self.client.force_authenticate(user=user)

        created = self.client.post(
            '/api/repair-requests/',
            {
                'service': service.id,
                'description': 'The bathroom tap is leaking.',
                'location': 'Campus, Building A, Room 10',
                'priority': 'medium',
            },
            format='json',
        )

        self.assertEqual(created.status_code, 201)
        repair_request = RepairRequest.objects.get()
        self.assertEqual(repair_request.customer, user)
        self.assertEqual(repair_request.status, 'requested')

        listed = self.client.get('/api/repair-requests/')
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.data['results'][0]['id'], repair_request.id)


class StaffAndAdministratorWorkflowTests(APITestCase):
    def test_staff_can_sign_up_log_in_and_only_see_assigned_repairs(self):
        registration = self.client.post(
            '/api/users/staff_signup/',
            {
                'username': 'repair-staff',
                'first_name': 'Repair',
                'last_name': 'Staff',
                'email': 'staff@example.com',
                'password': 'Safe-password-123',
                'role': 'admin',
            },
            format='json',
        )
        self.assertEqual(registration.status_code, 201)
        staff = User.objects.get(username='repair-staff')
        self.assertEqual(staff.role, 'staff')
        self.assertTrue(StaffProfile.objects.filter(user=staff).exists())

        login = self.client.post(
            '/api/users/login/',
            {'username': 'repair-staff', 'password': 'Safe-password-123'},
            format='json',
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data['role'], 'staff')

        customer = User.objects.create_user(
            username='repair-customer',
            password='Safe-password-123',
            role='customer',
        )
        service = Service.objects.create(
            name='Electrical',
            description='Electrical repairs',
            base_price='0.00',
        )
        assigned = RepairRequest.objects.create(
            customer=customer,
            service=service,
            assigned_staff=staff,
            status='assigned',
            description='Repair the hallway light.',
            location='Building B',
        )
        RepairRequest.objects.create(
            customer=customer,
            service=service,
            description='Repair the front door.',
            location='Building C',
        )

        self.client.force_authenticate(user=staff)
        listed = self.client.get('/api/repair-requests/')
        self.assertEqual(listed.status_code, 200)
        self.assertEqual([item['id'] for item in listed.data['results']], [assigned.id])

        started = self.client.post(f'/api/repair-requests/{assigned.id}/start/')
        self.assertEqual(started.status_code, 200)
        assigned.refresh_from_db()
        self.assertEqual(assigned.status, 'in_progress')
        self.assertIsNotNone(assigned.started_at)

        completed = self.client.post(f'/api/repair-requests/{assigned.id}/complete/')
        self.assertEqual(completed.status_code, 200)
        assigned.refresh_from_db()
        self.assertEqual(assigned.status, 'completed')
        self.assertIsNotNone(assigned.completed_at)

    def test_admin_signup_requires_key_and_admin_can_assign_and_manage_users(self):
        payload = {
            'username': 'fixit-admin',
            'first_name': 'FixIt',
            'last_name': 'Admin',
            'email': 'admin@example.com',
            'password': 'Safe-password-123',
        }
        rejected = self.client.post(
            '/api/users/admin_signup/',
            {**payload, 'admin_key': 'incorrect'},
            format='json',
        )
        self.assertEqual(rejected.status_code, 403)

        with override_settings(ADMIN_SIGNUP_KEY='trusted-registration-key'):
            registration = self.client.post(
                '/api/users/admin_signup/',
                {**payload, 'admin_key': 'trusted-registration-key'},
                format='json',
            )
        self.assertEqual(registration.status_code, 201)
        admin = User.objects.get(username='fixit-admin')
        self.assertEqual(admin.role, 'admin')
        self.assertTrue(admin.is_staff)

        staff = User.objects.create_user(
            username='available-staff',
            password='Safe-password-123',
            role='staff',
        )
        customer = User.objects.create_user(
            username='reporter',
            password='Safe-password-123',
            role='customer',
        )
        service = Service.objects.create(
            name='Plumbing',
            description='Water repairs',
            base_price='0.00',
        )
        repair_request = RepairRequest.objects.create(
            customer=customer,
            service=service,
            description='Fix a leaking tap.',
            location='Building A',
        )
        self.client.force_authenticate(user=admin)

        users = self.client.get('/api/users/')
        self.assertEqual(users.status_code, 200)
        self.assertIn('is_active', users.data['results'][0])

        invalid_assignment = self.client.post(
            f'/api/repair-requests/{repair_request.id}/assign/',
            {'staff_id': 'not-an-id'},
            format='json',
        )
        self.assertEqual(invalid_assignment.status_code, 400)

        assigned = self.client.post(
            f'/api/repair-requests/{repair_request.id}/assign/',
            {'staff_id': staff.id},
            format='json',
        )
        self.assertEqual(assigned.status_code, 200)
        repair_request.refresh_from_db()
        self.assertEqual(repair_request.assigned_staff, staff)
        self.assertEqual(repair_request.status, 'assigned')

        updated = self.client.patch(
            f'/api/users/{customer.id}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(updated.status_code, 200)
        customer.refresh_from_db()
        self.assertFalse(customer.is_active)

        self_deactivation = self.client.patch(
            f'/api/users/{admin.id}/',
            {'is_active': False},
            format='json',
        )
        self.assertEqual(self_deactivation.status_code, 400)

    def test_django_superusers_are_application_administrators(self):
        admin = User.objects.create_superuser(
            username='root-admin',
            email='root@example.com',
            password='Safe-password-123',
        )
        self.assertEqual(admin.role, 'admin')
