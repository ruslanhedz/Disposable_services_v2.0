# session_manager/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer

class NotificationsConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group = None
        user = self.scope.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            await self.close(code=403)
            return
        self.group = f"user_{user.id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if self.channel_layer and self.group:
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def session_expired(self, event):
        await self.send_json(event)
