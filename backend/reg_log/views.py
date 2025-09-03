from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from .serializers import UserSerializer


class SignUpView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        activation_link = f"http://localhost:5173/activate/{uid}/{token}/"

        send_mail(
            "Activate your account",
            f"Hi {user.first_name} {user.last_name}!\nClick on the link below to activate your account.\n {activation_link}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return Response(status=status.HTTP_201_CREATED)


class ActivateAccountView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, uid, token, *args, **kwargs):
        try:
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username_or_email = request.data.get('username_or_email')
        password = request.data.get('password')

        try:
            user = User.objects.get(username=username_or_email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username_or_email)
            except User.DoesNotExist:
                return Response(status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=user.username, password=password)

        if user:
            login(request, user)
            return Response(status=status.HTTP_200_OK)

        return Response(status=status.HTTP_400_BAD_REQUEST)


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response(status=status.HTTP_200_OK)
