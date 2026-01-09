from abc import ABC, abstractmethod

class BaseIntegration(ABC):
    def __init__(self, settings: dict):
        self.settings = settings
        self.connected = False

    @abstractmethod
    async def connect(self):
        pass

    @abstractmethod
    async def disconnect(self):
        pass
    
    @abstractmethod
    async def send_message(self, message: str, target: str = None):
        pass
