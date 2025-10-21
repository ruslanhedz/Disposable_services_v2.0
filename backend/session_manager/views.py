from asyncio import exceptions

from django.shortcuts import render
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
import subprocess
import base64, json, hashlib, hmac, time
from Crypto.Cipher import AES
import requests
import time
from datetime import datetime, timedelta, timezone
from backend.settings import guacamole_key, guacamole_url, guacamole_ws

from .models import Session
from .serializers import SessionSerializer

# Create your views here.

class CreateBrowserSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # result = subprocess.run(
            #     ["powershell", "-Command", "VBoxManage startvm \"Ubuntu server Browser session\" --type gui"],
            #     capture_output=True,
            #     text=True
            # )
            #
            # if result.returncode != 0:
            #     raise Exception("VBoxManage startvm failed")
            #
            # time.sleep(100)

            key = bytes.fromhex(guacamole_key)
            iv = bytes(16)

            payload = {
                "username": request.user.username,
                "expires": int(time.time() * 1000)+ 20 * 60 * 1000,
                "connections": {
                    "Browser": {
                        "protocol": "vnc",
                        "parameters": {
                            "hostname": "192.168.1.8",
                            "port": "5900",
                            "password": "password",
                        }
                    }
                }
            }

            data_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

            sig = hmac.new(key, data_bytes, hashlib.sha256).digest()
            signed = sig + data_bytes

            pad_len = 16 - len(signed) % 16
            signed += bytes([pad_len]) * pad_len

            cipher = AES.new(key, AES.MODE_CBC, iv)
            encrypted = cipher.encrypt(signed)

            token = base64.b64encode(encrypted).decode('utf-8')

            print(token)

            guacamole_tokens = guacamole_url + "/api/tokens"

            print(guacamole_tokens)

            payload = {
                "data": token
            }

            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
            }

            response = requests.post(guacamole_tokens, data=payload, headers=headers)

            print(response.json())

            authToken = response.json().get("authToken")

            expire_time = datetime.now(timezone.utc) + timedelta(minutes=15)

            data = {
                "session_type": "browser",
                "machine_address": "192.168.1.8",
                "dispose_time": expire_time,
                "token": token,
                "user": request.user.id
            }

            serializer = SessionSerializer(data=data)

            if not serializer.is_valid():
                return Response(serializer.errors, status=400)

            session_url = (f"ws://localhost:8080/guacamole/websocket-tunnel?"
                           f"token={authToken}"
                           f"&GUAC_ID=Browser"
                           f"&GUAC_TYPE=c"
                           f"&GUAC_DATA_SOURCE=json"
                           f"&dummy=ignore")

            print(f"session url: {session_url}")

            return Response({"ws_url": session_url}, status=200)

        except Exception as e:
            return Response(str(e), status=500)

