from django.urls import path
from . import views

urlpatterns = [
    path('new_session/', views.CreateBrowserSessionView.as_view(), name='new_session'),
]