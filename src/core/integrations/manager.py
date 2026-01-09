from .twitch import TwitchIntegration
from .youtube import YouTubeIntegration
import logging
from typing import Dict, Optional

logger = logging.getLogger("IntegrationManager")

class IntegrationManager:
    """Manages all platform integrations."""
    def __init__(self):
        self.integrations: Dict[str, any] = {}
        
    async def initialize_integration(self, platform: str, settings: dict):
        """Initialize and connect to a platform."""
        try:
            if platform == "twitch":
                integration = TwitchIntegration(settings)
            elif platform == "youtube":
                integration = YouTubeIntegration(settings)
            else:
                logger.error(f"Unknown platform: {platform}")
                return False

            success = await integration.connect()
            if success:
                self.integrations[platform] = integration
                logger.info(f"✓ {platform.capitalize()} integration initialized")
                return True
            else:
                logger.error(f"✗ Failed to initialize {platform}")
                return False
                
        except Exception as e:
            logger.error(f"Error initializing {platform}: {e}")
            return False

    async def disconnect_integration(self, platform: str):
        """Disconnect from a platform."""
        if platform in self.integrations:
            await self.integrations[platform].disconnect()
            del self.integrations[platform]
            logger.info(f"Disconnected from {platform}")
            return True
        return False

    async def send_message(self, platform: str, message: str, target: str = None):
        """Send a message via a connected integration."""
        if platform not in self.integrations:
            logger.warning(f"Cannot send to {platform}: Not connected")
            return False
            
        integration = self.integrations.get(platform)
        if integration and integration.connected:
            await integration.send_message(message, target)
            return True
        else:
            logger.warning(f"{platform} integration not ready")
            return False

    def is_connected(self, platform: str) -> bool:
        """Check if a platform is connected."""
        integration = self.integrations.get(platform)
        return integration is not None and integration.connected

# Global instance
INTEGRATION_MANAGER = IntegrationManager()
