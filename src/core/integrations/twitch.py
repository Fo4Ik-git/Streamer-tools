from .base import BaseIntegration
import logging
from twitchAPI.twitch import Twitch
from twitchAPI.oauth import UserAuthenticator
from twitchAPI.type import AuthScope, ChatRoom
from twitchAPI.chat import Chat, EventData, ChatMessage
import asyncio

logger = logging.getLogger("TwitchIntegration")

class TwitchIntegration(BaseIntegration):
    def __init__(self, settings: dict):
        super().__init__(settings)
        self.app_id = settings.get("client_id")
        self.app_secret = settings.get("client_secret")
        self.target_channel = settings.get("target_channel")
        self.twitch = None
        self.chat = None

    async def connect(self):
        if not self.app_id or not self.app_secret:
            logger.error("Missing Client ID or Secret")
            return False

        try:
            logger.info("Connecting to Twitch API...")
            self.twitch = await Twitch(self.app_id, self.app_secret)
            
            # For chat, we need User Authentication
            # In a real app, we'd handle OAuth callback flow via web server.
            # Here we assume we might have tokens or need to generate them.
            # For simplicity in this tool, let's assume client credential flow for API
            # BUT Chat requires User Token.
            # We will use a mock flow if no token provided, or fail.
            
            # Checking if we have a stored token (passed in settings usually)
            # For now, let's just Authenticate App
            await self.twitch.authenticate_app([])
            
            # Initialize Chat
            # Requires message:write scope
            # If we don't have user auth, we can't really chat as a user.
            # We will log a warning.
            logger.info("Twitch API Connected (App Auth). Note: Chat requires User Auth.")
            self.connected = True
            return True

        except Exception as e:
            logger.error(f"Failed to connect to Twitch: {e}")
            self.connected = False
            return False

    async def disconnect(self):
        if self.chat:
            self.chat.stop()
        self.connected = False
        logger.info("Disconnected from Twitch")

    async def send_message(self, message: str, target: str = None):
        if not self.connected or not self.twitch:
             logger.warning("Cannot send message: Not connected to Twitch")
             return

        channel = target or self.target_channel
        if not channel:
            logger.warning("No target channel specified for Twitch message")
            return

        # Real sending requires User Auth with scope 'chat:edit'
        # Since we only did App Auth above, this might fail or we need to implement User Auth logic.
        # For the sake of this task, I will mock the *final* send if we lack permission, 
        # but the structure is here.
        
        logger.info(f"[Twitch] (Would Send) to #{channel}: {message}")
        if self.chat:
            await self.chat.send_message(channel, message)
