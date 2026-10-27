from decimal import Decimal

from django.db import migrations


def seed_services(apps, schema_editor):
    Service = apps.get_model('backend', 'Service')
    services = [
        ('Plumbing', 'Leaks, taps, drains, and pipe repairs.'),
        ('Electrical', 'Lights, sockets, switches, and electrical faults.'),
        ('Carpentry', 'Doors, cabinets, furniture, and woodwork.'),
        ('General maintenance', 'Everyday repairs that do not fit another category.'),
    ]
    for name, description in services:
        Service.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'base_price': Decimal('0.00'),
                'is_active': True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('backend', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_services, migrations.RunPython.noop),
    ]
