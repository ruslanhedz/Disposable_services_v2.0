from rest_framework import serializers
from django.db import models
from .models import Session

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'session_type', 'machine_address', 'dispose_time', 'user']
        read_only_fields = ['user']