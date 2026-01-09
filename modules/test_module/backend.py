import asyncio
import sys
import os

try:
    from src.sdk.base import BaseModule
except ImportError:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
    from src.sdk.base import BaseModule

class TestModule(BaseModule):
    async def on_config_update(self, new_config):
        self.logger.info(f"Received new config: {new_config}")

    async def run_logic(self):
        """
        Demonstrates the simplified SDK API and overlay updates.
        """
        self.logger.info("Test Module Logic Started")
        counter = 0
        
        while True:
            # Use self.config which is auto-updated
            enabled = self.config.get("enabled", True)
            interval = self.config.get("interval", 10)
            message = self.config.get("message_text", "Default Message")
            
            if enabled:
                # ✨ Simplified API - no need to specify platform details
                await self.send_twitch_message(message)
                
                # Update the overlay with current status
                counter += 1
                await self.update_overlay({
                    "message": f"{message} (#{counter})",
                    "count": counter,
                    "timestamp": asyncio.get_event_loop().time()
                })
            else:
                self.logger.info("Skipping message (disabled in settings)")

            # Use a safe interval
            if interval < 1: interval = 1
            await asyncio.sleep(interval)

if __name__ == "__main__":
    module = TestModule()
    loop = asyncio.get_event_loop()
    loop.create_task(module.run_logic())
    loop.run_until_complete(module.start())
