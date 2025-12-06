from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from session_manager.models import Session
import os
import requests
import logging
import boto3
from botocore.exceptions import ClientError

from backend.settings import guacamole_url

logger = logging.getLogger(__name__)

guacamole_tokens = guacamole_url + "/api/tokens"

@shared_task
def expire_session_task(session_id: int):
    # Idempotent guard to avoid early delete or duplicates
    try:
        s = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return
    if s.dispose_time <= timezone.now():
        try:
            layer = get_channel_layer()
            logger.info("expire_session_task: channel_layer=%r", layer)
            group = f"user_{s.user_id}"
            payload = {"type": "session_expired", "session_id": s.id}
            logger.info("expire_session_task: sending to %s payload=%s", group, payload)
            async_to_sync(layer.group_send)(group, payload)
            logger.info("expire_session_task: sent to %s", group)
        except Exception as e:
            logger.exception("Notify failed for session %s: %s", s.id, e)


        try:
            instance_id = s.instance_id
            authToken = s.token

            ec2 = boto3.resource('ec2')

            instance = ec2.Instance(instance_id)

            resonse = instance.terminate()

            url = guacamole_tokens + "/" + authToken
            response = requests.delete(url, verify=False)
            if response.status_code in (200, 204):
                logger.info("Guacamole token %s deleted", s.token)
            elif response.status_code in (403, 404):
                logger.info("Guacamole token %s already invalid or not found (%s)", s.token, response.status_code)
            else:
                logger.warning("Unexpected response deleting Guacamole token %s: %s %s", s.token, response.status_code, response.text)

            s.delete()

        except ClientError as e:
            logger.exception("Error terminating instance %s: %s", s.id, e)
        except Exception as e:
            logger.exception("Error deleting Guacamole token %s: %s", s.token, e)