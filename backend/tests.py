from rest_framework.test import APITestCase

from .models import RepairRequest, Service, User


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
