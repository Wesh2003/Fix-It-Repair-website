from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from .models import RepairProgressUpdate, RepairRequest, User


class InvalidRepairTransition(Exception):
    """Raised when a repair cannot move to the requested workflow state."""


@transaction.atomic
def start_repair(repair_request: RepairRequest, staff: User) -> None:
    if repair_request.assigned_staff != staff or repair_request.status != 'assigned':
        raise InvalidRepairTransition('Not assigned to you')

    repair_request.status = 'in_progress'
    repair_request.started_at = timezone.now()
    repair_request.save(update_fields=['status', 'started_at'])
    RepairProgressUpdate.objects.create(
        repair_request=repair_request,
        author=staff,
        note='Work started.',
    )


@transaction.atomic
def add_repair_progress(
    repair_request: RepairRequest,
    staff: User,
    note: str,
) -> RepairProgressUpdate:
    if repair_request.assigned_staff != staff or repair_request.status != 'in_progress':
        raise InvalidRepairTransition(
            'Progress updates are available only for your in-progress assignments.'
        )

    return RepairProgressUpdate.objects.create(
        repair_request=repair_request,
        author=staff,
        note=note,
    )


@transaction.atomic
def complete_repair(
    repair_request: RepairRequest,
    staff: User,
    final_cost: Decimal | str | None,
) -> None:
    if repair_request.assigned_staff != staff or repair_request.status != 'in_progress':
        raise InvalidRepairTransition('Not assigned to you')

    repair_request.status = 'completed'
    repair_request.completed_at = timezone.now()
    repair_request.final_cost = final_cost
    repair_request.save(
        update_fields=['status', 'completed_at', 'final_cost']
    )
    RepairProgressUpdate.objects.create(
        repair_request=repair_request,
        author=staff,
        note='Issue marked resolved.',
    )
