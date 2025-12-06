from rest_framework import serializers
from django.db import models
from .models import Session

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'session_type', 'instance_id', 'machine_address', 'token', 'dispose_time', 'user']
        read_only_fields = ['user']


class InformationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'session_type', 'dispose_time']