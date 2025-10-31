from celery import shared_task
from django.utils import timezone
from session_manager.models import Session

@shared_task
def expire_session_task(session_id: int):
    # Idempotent guard to avoid early delete or duplicates
    try:
        s = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return
    if s.dispose_time <= timezone.now():

        s.delete()