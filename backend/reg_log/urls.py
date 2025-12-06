from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.SignUpView.as_view(), name='singup'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('activate/<uid>/<token>/', views.ActivateAccountView.as_view(), name='activate'),
    path('auth/status/', views.AuthStatusView.as_view(), name='auth-status'),
]