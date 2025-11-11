from asyncio import exceptions
from contextlib import nullcontext
from logging import raiseExceptions

from django.shortcuts import render
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import get_object_or_404
from django.utils.timezone import now
import subprocess
import base64, json, hashlib, hmac, time
from Crypto.Cipher import AES
import requests
import time
from datetime import datetime, timedelta, timezone
from backend.settings import guacamole_key, guacamole_url, guacamole_ws

import boto3
from botocore.exceptions import ClientError

from .models import Session
from .serializers import SessionSerializer, InformationSessionSerializer

from session_manager.tasks import expire_session_task



guacamole_tokens = guacamole_url + "/api/tokens"

class CreateSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post (self, request, *args, **kwargs):
        instance_address = ""
        instance_id = ""
        try:
            # sessions = {
            #     "browser": "Ubuntu server Browser session",
            #     "ubuntu": "Ubuntu server",
            #     "windows": "Win 11 Pro"
            # }
            #
            # result = subprocess.run(
            #     ["powershell", "-Command", f"VBoxManage startvm \"{sessions[request.data.get('type')]}\" --type gui"],
            #     capture_output=True,
            #     text=True
            # )
            #
            # if result.returncode != 0:
            #     raise Exception("VBoxManage startvm failed")
            #
            # time.sleep(200)

            #Creating instance on AWS
            ec2 = boto3.resource('ec2')
            ami = ""
            InstanceType = ""
            SecurityGroup = ""
            User_data_script = ""

            if (request.data.get('type') == 'browser'):
                ami = "ami-092ba2327057c4ea6"
                InstanceType = "t3.medium"
                SecurityGroup = "sg-0e0cda71ec6fb584a"
                try:
                    with open('./startup_scripts/browser-session.sh', 'r') as file:
                        User_data_script = file.read()
                except FileNotFoundError:
                    return Response({'error': 'browser-session.sh does not exist'}, status=404)
            elif (request.data.get('type') == 'ubuntu'):
                ami = "ami-0fa7eef263311aa78"
                InstanceType = "t3.large"
                SecurityGroup = "sg-0e0cda71ec6fb584a"
                try:
                    with open('./session_manager/startup_scripts/ubuntu-session.sh', 'r') as file:
                        User_data_script = file.read()
                except FileNotFoundError:
                    return Response({'error': 'ubuntu-session.sh does not exist'}, status=404)
            elif (request.data.get('type') == 'windows'):
                ami = "ami-0558a483739f23a29"
                InstanceType = "t3.large"
                SecurityGroup = "sg-01ac04a17acd92ece"
                User_data_script = ""

            try:
                instances = ec2.create_instances(
                    ImageId=ami,
                    InstanceType=InstanceType,
                    KeyName='Sandbox_ssh_key_pair',
                    MinCount=1,
                    MaxCount=1,

                    NetworkInterfaces=[
                        {
                            'DeviceIndex': 0,
                            'SubnetId': 'subnet-025b209d43eb859c1',
                            'Groups': [
                                SecurityGroup
                            ],
                        }
                    ],

                    TagSpecifications=[
                        {
                            'ResourceType': 'instance',
                            'Tags': [
                                {
                                    'Key': 'Name',
                                    'Value': f'{request.user.username} {request.data.get('type')} instance'
                                },
                            ]
                        },
                    ],

                    UserData=User_data_script,
                )

                instance = instances[0]

                instance.wait_until_running()

                instance_id = instance.id
                instance_address = instance.private_ip_address

            except ClientError as e:
                return Response({'error': str(e)}, status=500)


            time.sleep(60)

            key = bytes.fromhex(guacamole_key)
            iv = bytes(16)

            if (request.data.get('type') == 'browser'):
                session_payload = {
                    "username": request.user.username,
                    "expires": int(time.time() * 1000) + 20 * 60 * 1000,
                    "connections": {
                        "browser": {
                            "protocol": "vnc",
                            "parameters": {
                                "hostname": instance_address,
                                "port": "5900",
                                "password": "password",
                                #"security": "tls",
                                #"ignore-cert": "true",
                                # "width": "1280",
                                # "height": "720",
                                # "color-depth": "24"
                            }
                        }
                    }
                }

            elif (request.data.get('type') == 'ubuntu'):
                session_payload = {
                    "username": request.user.username,
                    "expires": int(time.time() * 1000) + 20 * 60 * 1000,
                    "connections": {
                        "ubuntu": {
                            "protocol": "vnc",
                            "parameters": {
                                "hostname": instance_address,
                                "port": "5900",
                                "password": "password",
                                # "width": "1280",
                                # "height": "720",
                                # "color-depth": "24"
                            }
                        }
                    }
                }

            elif (request.data.get('type') == 'windows'):
                session_payload = {
                    "username": request.user.username,
                    "expires": int(time.time() * 1000) + 20 * 60 * 1000,
                    "connections": {
                        "windows": {
                            "protocol": "rdp",
                            "parameters": {
                                "hostname": instance_address,
                                "port": "3389",
                                "username": "disposable-user",
                                "password": "UDispasec1!ins",
                                "ignore-cert": "true",
                                "security": "nla",
                                "enable-wallpaper": "true",
                                "width": "1280",
                                "height": "800",
                                "color-depth": "24"
                            }
                        }
                    }
                }

            else:
                raise Exception("Error in responce type")


            print(session_payload)


            data_bytes = json.dumps(session_payload, separators=(',', ':')).encode('utf-8')

            sig = hmac.new(key, data_bytes, hashlib.sha256).digest()
            signed = sig + data_bytes

            pad_len = 16 - len(signed) % 16
            signed += bytes([pad_len]) * pad_len

            cipher = AES.new(key, AES.MODE_CBC, iv)
            encrypted = cipher.encrypt(signed)

            token = base64.b64encode(encrypted).decode('utf-8')

            #guacamole_tokens = guacamole_url + "/api/tokens"

            payload = {
                "data": token
            }

            headers = {
                    "Content-Type": "application/x-www-form-urlencoded",
            }

            response = requests.post(guacamole_tokens, data=payload, headers=headers, verify=False)

            print("Get response!")

            authToken = response.json().get("authToken")

            print(authToken)

            expire_time = datetime.now(timezone.utc) + timedelta(minutes=2)

            data = {
                "session_type": request.data.get('type'),
                "instance_id": instance_id,
                "machine_address": session_payload["connections"][request.data.get('type')]["parameters"]["hostname"],
                "dispose_time": expire_time,
                "token": authToken,
                "user": request.user.id
            }

            print(len(authToken))

            print("data created!")

            serializer = SessionSerializer(data=data)

            if not serializer.is_valid():
                return Response(serializer.errors, status=400)

            serializer.save(user=request.user)

            obj = serializer.instance

            expire_session_task.apply_async((obj.id,), eta=obj.dispose_time)


            session_url = (f"/websocket-tunnel?"
                       f"token={authToken}"
                       f"&GUAC_ID={request.data.get('type')}"
                       f"&GUAC_TYPE=c"
                       f"&GUAC_DATA_SOURCE=json"
                       f"&dummy=ignore")

            return Response({"ws_url": session_url, "id": obj.id}, status=200)
        except Exception as e:
            print(e)
            return Response(str(e), status=500)


class AllSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            sessions = Session.objects.filter(user=request.user)

            serializer = InformationSessionSerializer(sessions, many=True)

            return Response(serializer.data, status=200)
        except Exception as e:
            print(e)
            return Response(str(e), status=500)


class OpenSessionView(APIView):
    permissions_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        session = get_object_or_404(Session, id=pk, user=request.user)
        if session.dispose_time <= now():
            return Response("Session expired", status=410)

        authToken = session.token
        guac_id = session.session_type

        session_url = (
            f"/websocket-tunnel?"
            f"token={authToken}"
            f"&GUAC_ID={guac_id}"
            f"&GUAC_TYPE=c"
            f"&GUAC_DATA_SOURCE=json"
            f"&dummy=ignore"
        )

        return Response({"ws_url": session_url}, status=200)


class DeleteSessionView(APIView):
    permissions_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        session = get_object_or_404(Session, id=pk, user=request.user)
        if session.dispose_time <= now():
            return Response("Session expired", status=410)

        instance_id = session.instance_id
        authToken = session.token

        ec2 = boto3.resource('ec2')

        instance = ec2.Instance(instance_id)

        response = instance.terminate()
        instance.wait_until_terminated()

        url = guacamole_tokens + "/" + authToken

        response = requests.delete(url, verify=False)

        if response.status_code in (200, 204):
            session.delete()
            return Response("Session deleted", status=200)
        else:
            return Response(str(response), status=500)




class CreateBrowserSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            result = subprocess.run(
                ["powershell", "-Command", "VBoxManage startvm \"Ubuntu server Browser session\" --type gui"],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                raise Exception("VBoxManage startvm failed")

            time.sleep(100)

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

        except ClientError as e:
            return Response({'error': str(e)}, status=500)

        except Exception as e:
            return Response(str(e), status=500)

