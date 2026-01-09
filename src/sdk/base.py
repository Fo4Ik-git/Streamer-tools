import socketio
import asyncio
import os
import json
import logging
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='[%(name)s] %(message)s')

class BaseModule:
    """
    Base class for all modules. Provides simplified API for common operations.
    Module developers only need to use this SDK - Core internals are abstracted away.
    """
    def __init__(self, manifest_path="manifest.json"):
        self.sio = socketio.AsyncClient()
        self.manifest = self._load_manifest(manifest_path)
        self.module_id = self.manifest["id"]
        self.name = self.manifest["name"]
        self.logger = logging.getLogger(self.name)
        self.config = {} 
        self._connected_event = asyncio.Event()

        self.setup_handlers()

    def _load_manifest(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Manifest not found at {path}")
        with open(path, "r") as f:
            return json.load(f)

    def setup_handlers(self):
        @self.sio.event
        async def connect():
            self.logger.info("Connected to Core")
            self._connected_event.set()
            asyncio.create_task(self.register())

        @self.sio.event
        async def disconnect():
            self.logger.info("Disconnected from Core")
            self._connected_event.clear()

        @self.sio.event
        async def config_update(data):
            self.logger.info(f"Config updated: {data}")
            self.config = data
            await self.on_config_update(data)

    async def on_config_update(self, new_config):
        """Override this to handle configuration changes."""
        pass

    async def register(self):
        await asyncio.sleep(0.1)
        if self.sio.connected:
            self.logger.info(f"Registering as {self.module_id}...")
            await self.sio.emit("register_module", {"module_id": self.module_id})
        else:
             self.logger.warning("Skipping register: Not connected")

    async def start(self, host="http://localhost:8080"):
        """Connect to Core and start the module."""
        try:
            self.logger.info(f"Connecting to {host}...")
            await self.sio.connect(host, transports=['websocket', 'polling'])
            await self.sio.wait()
        except Exception as e:
            self.logger.error(f"Connection loop terminated: {e}")

    # ==================== Simplified Messaging API ====================
    
    async def send_twitch_message(self, message: str):
        """Send a message to Twitch chat. Requires 'chat_send' permission."""
        await self._send_platform_message("twitch", message)
    
    async def send_youtube_message(self, message: str):
        """Send a message to YouTube live chat. Requires 'chat_send' permission."""
        await self._send_platform_message("youtube", message)
    
    async def send_to_all_platforms(self, message: str):
        """Send a message to all connected platforms. Requires 'chat_send' permission."""
        await self._send_platform_message(None, message)

    async def _send_platform_message(self, platform: Optional[str], message: str):
        """Internal method - developers should use the platform-specific methods above."""
        if not self.sio.connected:
             self.logger.warning("Cannot send message: Not connected to Core")
             return

        payload = {
            "message": message,
            "target_platform": platform
        }
        await self.sio.emit("command_send_chat", payload)

    # ==================== UI Communication API ====================
    
    async def update_overlay(self, data: Dict[str, Any]):
        """
        Send data to the module's overlay UI (if it exists).
        The overlay should listen for 'overlay_update' events.
        """
        await self.emit("overlay_update", {"module_id": self.module_id, "data": data})
    
    async def update_settings_ui(self, data: Dict[str, Any]):
        """
        Send data to the module's custom settings UI (if it exists).
        The settings UI should listen for 'settings_data' events.
        """
        await self.emit("settings_data", {"module_id": self.module_id, "data": data})

    # ==================== Advanced API ====================
    
    async def send_chat(self, message: str, target_platform: str = None):
        """
        Low-level chat sending. Most developers should use platform-specific methods instead.
        """
        await self._send_platform_message(target_platform, message)

    async def emit(self, event: str, data: Any):
        """Emit a custom Socket.IO event. For advanced use cases."""
        if not self.sio.connected:
             return
        await self.sio.emit(event, data)