from typing import Dict, Any, Optional
import logging
from sqlalchemy.future import select
from src.core.db.database import AsyncSessionLocal
from src.core.db.models import Integration, ModuleSettings

logger = logging.getLogger("StateManager")

class StateManager:
    """
    Manages in-memory state and synchronizes with the Database.
    Replaces settings.json with DB persistence.
    """
    def __init__(self):
        # In-memory caches
        self.integrations: Dict[str, dict] = {}
        self.loaded_manifests: Dict[str, Any] = {}
        self.module_paths: Dict[str, str] = {} # module_id -> absolute path
        self.active_sessions: Dict[str, str] = {} # sid -> module_id
        
        # Caches for Settings
        self.module_settings: Dict[str, dict] = {} 
        self.module_enabled_state: Dict[str, bool] = {} 

    async def initialize_from_db(self):
        """Loads state from DB into memory on startup."""
        logger.info("[StateManager] Loading state from Database...")
        async with AsyncSessionLocal() as session:
            # Load Integrations
            result = await session.execute(select(Integration))
            integrations = result.scalars().all()
            for integ in integrations:
                self.integrations[integ.platform] = {
                    "status": integ.status,
                    "token": integ.token,
                    "credential_status": "present" if integ.credentials else "missing"
                }

            # Load Module Settings
            result = await session.execute(select(ModuleSettings))
            mod_settings = result.scalars().all()
            for ms in mod_settings:
                self.module_settings[ms.module_id] = ms.settings or {}
                self.module_enabled_state[ms.module_id] = ms.enabled

    # --- Module Settings ---
    def get_module_settings(self, module_id):
        return self.module_settings.get(module_id, {})

    async def update_module_settings(self, module_id, new_settings):
        self.module_settings[module_id] = new_settings
        # Persist
        async with AsyncSessionLocal() as session:
            ms = await session.get(ModuleSettings, module_id)
            if not ms:
                ms = ModuleSettings(module_id=module_id)
                session.add(ms)
            ms.settings = new_settings
            await session.commit()

    # --- System State (Enabled/Disabled) ---
    def is_module_enabled(self, module_id):
        # Default to True if not present in DB
        return self.module_enabled_state.get(module_id, True)

    async def set_module_enabled(self, module_id, enabled: bool):
        self.module_enabled_state[module_id] = enabled
        # Persist
        async with AsyncSessionLocal() as session:
            ms = await session.get(ModuleSettings, module_id)
            if not ms:
                ms = ModuleSettings(module_id=module_id)
                session.add(ms)
            ms.enabled = enabled
            await session.commit()

    # --- Integrations ---
    def get_integration(self, platform):
        return self.integrations.get(platform, {"status": "disconnected"})

    async def update_integration(self, platform, status, token=None, credentials=None):
        if platform not in self.integrations:
            self.integrations[platform] = {}
            
        self.integrations[platform]["status"] = status
        if token:
            self.integrations[platform]["token"] = token
            
        # Persist
        async with AsyncSessionLocal() as session:
            integ = await session.get(Integration, platform)
            if not integ:
                integ = Integration(platform=platform)
                session.add(integ)
            
            integ.status = status
            if token is not None:
                integ.token = token
            if credentials is not None:
                integ.credentials = credentials
                
            await session.commit()

    def check_permission(self, module_id, permission):
        manifest = self.loaded_manifests.get(module_id)
        if not manifest:
            return False
        return permission in manifest.get("permissions", [])

    def get_sid_for_module(self, module_id):
        for sid, mod in self.active_sessions.items():
            if mod == module_id:
                return sid
        return None

CORE_STATE = StateManager()
