from django.urls import path
from . import views

urlpatterns = [
    path('new_session_chrome/', views.CreateBrowserSessionView.as_view(), name='new_session'),
    path('new_session/', views.CreateSessionView.as_view(), name='new_session'),
    path('all_sessions/', views.AllSessionsView.as_view(), name='all_sessions'),
]