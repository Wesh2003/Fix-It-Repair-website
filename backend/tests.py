from decimal import Decimal
from io import BytesIO
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import (
    RepairProgressUpdate, RepairRequest, Service, StaffProfile, User,
)
from .services import (
    InvalidRepairTransition,
    add_repair_progress,
    complete_repair,
    start_repair,
)


class RepairWorkflowServiceTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='workflow-customer',
            password='Safe-password-123',
            role='customer',
        )
        self.staff = User.objects.create_user(
            username='workflow-staff',
            password='Safe-password-123',
            role='staff',
        )
        self.other_staff = User.objects.create_user(
            username='other-workflow-staff',
            password='Safe-password-123',
            role='staff',
        )
        self.service = Service.objects.create(
            name='Workflow repair',
            description='Workflow test service',
            base_price='0.00',
        )
        self.repair_request = RepairRequest.objects.create(
            customer=self.customer,
            service=self.service,
            assigned_staff=self.staff,
            status='assigned',
            description='Test repair.',
            location='Test location',
        )

    def test_start_repair_changes_state_and_records_progress_atomically(self):
        start_repair(self.repair_request, self.staff)

        self.repair_request.refresh_from_db()
        self.assertEqual(self.repair_request.status, 'in_progress')
        self.assertIsNotNone(self.repair_request.started_at)
        self.assertEqual(
            RepairProgressUpdate.objects.get().note,
            'Work started.',
        )

    def test_unassigned_staff_cannot_start_repair(self):
        with self.assertRaises(InvalidRepairTransition):
            start_repair(self.repair_request, self.other_staff)

        self.repair_request.refresh_from_db()
        self.assertEqual(self.repair_request.status, 'assigned')
        self.assertFalse(RepairProgressUpdate.objects.exists())

    def test_progress_and_completion_require_an_in_progress_assignment(self):
        with self.assertRaises(InvalidRepairTransition):
            add_repair_progress(
                self.repair_request,
                self.staff,
                'This must not be recorded yet.',
            )

        self.assertFalse(RepairProgressUpdate.objects.exists())
        self.repair_request.status = 'in_progress'
        self.repair_request.save(update_fields=['status'])

        update = add_repair_progress(
            self.repair_request,
            self.staff,
            'Work is progressing.',
        )
        complete_repair(self.repair_request, self.staff, '25.00')

        self.repair_request.refresh_from_db()
        self.assertEqual(self.repair_request.status, 'completed')
        self.assertIsNotNone(self.repair_request.completed_at)
        self.assertEqual(self.repair_request.final_cost, Decimal('25.00'))
        self.assertEqual(
            RepairProgressUpdate.objects.filter(repair_request=self.repair_request).count(),
            2,
        )
        self.assertEqual(update.note, 'Work is progressing.')


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

    def test_student_can_upload_optional_repair_photo(self):
        from PIL import Image

        user = User.objects.create_user(
            username='student-photo',
            password='Safe-password-123',
            role='customer',
        )
        service = Service.objects.create(
            name='General repair',
            description='General repair tasks',
            base_price='0.00',
        )
        image_buffer = BytesIO()
        Image.new('RGB', (1, 1), color='red').save(image_buffer, format='PNG')
        image_buffer.seek(0)
        self.client.force_authenticate(user=user)

        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            created = self.client.post(
                '/api/repair-requests/',
                {
                    'service': service.id,
                    'description': 'A chair leg is broken.',
                    'location': 'Library, Room 2',
                    'priority': 'low',
                    'photo': SimpleUploadedFile(
                        'damage.png', image_buffer.read(), content_type='image/png',
                    ),
                },
                format='multipart',
            )
            self.assertEqual(created.status_code, 201)
            repair_request = RepairRequest.objects.get()
            self.assertTrue(repair_request.photo.name.startswith('repair_requests/'))
            self.assertIn('photo', created.data)


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

        progress = self.client.post(
            f'/api/repair-requests/{assigned.id}/progress/',
            {'note': 'Replacement part ordered; installation is next.'},
            format='json',
        )
        self.assertEqual(progress.status_code, 201)
        self.assertEqual(
            progress.data['note'],
            'Replacement part ordered; installation is next.',
        )

        completed = self.client.post(f'/api/repair-requests/{assigned.id}/complete/')
        self.assertEqual(completed.status_code, 200)
        assigned.refresh_from_db()
        self.assertEqual(assigned.status, 'completed')
        self.assertIsNotNone(assigned.completed_at)
        self.assertEqual(
            RepairProgressUpdate.objects.filter(repair_request=assigned).count(),
            3,
        )
        self.client.force_authenticate(user=customer)
        customer_report = self.client.get('/api/repair-requests/')
        self.assertEqual(customer_report.status_code, 200)
        assigned_report = next(
            item for item in customer_report.data['results']
            if item['id'] == assigned.id
        )
        report_updates = assigned_report['progress_updates']
        self.assertEqual(len(report_updates), 3)
        self.assertIn('Replacement part ordered', report_updates[1]['note'])

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

        filtered_reports = self.client.get(
            '/api/repair-requests/?search=leaking&status=assigned&priority=medium'
        )
        self.assertEqual(filtered_reports.status_code, 200)
        self.assertEqual(
            [item['id'] for item in filtered_reports.data['results']],
            [repair_request.id],
        )
        no_match = self.client.get('/api/repair-requests/?status=completed')
        self.assertEqual(no_match.status_code, 200)
        self.assertEqual(no_match.data['results'], [])
        category_filter = self.client.get(
            f'/api/repair-requests/?service={service.id}'
        )
        self.assertEqual(category_filter.status_code, 200)
        self.assertEqual(
            [item['id'] for item in category_filter.data['results']],
            [repair_request.id],
        )

        profile_update = self.client.patch(
            f'/api/users/{customer.id}/',
            {'first_name': 'Updated', 'email': 'updated@example.com'},
            format='json',
        )
        self.assertEqual(profile_update.status_code, 200)
        customer.refresh_from_db()
        self.assertEqual(customer.first_name, 'Updated')
        self.assertEqual(customer.email, 'updated@example.com')

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
