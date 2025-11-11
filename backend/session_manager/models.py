from django.db import models
from django.contrib.auth.models import User
from django.db.models import ForeignKey

# Create your models here.

class Session(models.Model):
    session_type = models.CharField(max_length=50)
    instance_id = models.CharField(max_length=25, default='')
    machine_address = models.CharField(max_length=15)
    dispose_time = models.DateTimeField()
    token = models.CharField(max_length=64)
    user = models.ForeignKey(User, on_delete=models.CASCADE)