from django.urls import path
from . import views

urlpatterns = [
    path('new_session_chrome/', views.CreateBrowserSessionView.as_view(), name='new_session'),
    path('new_session/', views.CreateSessionView.as_view(), name='new_session'),
    path('all_sessions/', views.AllSessionsView.as_view(), name='all_sessions'),
    path('open_session/<int:pk>/', views.OpenSessionView.as_view(), name='open_session'),
    path('delete_session/<int:pk>/', views.DeleteSessionView.as_view(), name='delete_session'),
]