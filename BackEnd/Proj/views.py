from django.http import JsonResponse
from django.views import View
from django.shortcuts import render

class HomeView(View):
    def get(self, request):
        return render(request, 'index.html')  # Serve React app

class ProtectedAPI(View):
    def get(self, request):
        user = getattr(request, 'cognito_user', None)
        return JsonResponse({'message': 'Protected data', 'user': user})
