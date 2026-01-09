import socketio
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import ujson
from src.core.state import CORE_STATE
from src.core.logger import core_logger as logger
from src.core.integrations import INTEGRATION_MANAGER
from src.core.db.database import AsyncSessionLocal

# Need to access the loader instance. 
# Problem: 'loader' is in main.py, not easily accessible here without circular import or singleton.
# Solution: We can attach loader to app or inject it.
# For now, let's make a hack or move loader instantiation to a shared place?
# Or just import it inside the function if possible (unlikely if it's created in main).
# Better: Pass loader to create_app?
# Let's assume we can get it via a global variable set by main.
from src.core.loader import ModuleLoader
# We cannot create a NEW loader because that would have its own process list.
# We need THE loader instance.
# Let's create a singleton accessor in `src.core.globals`.
pass

# Async Socket.io Server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()

# Mount Socket.io
socket_app = socketio.ASGIApp(sio, app)

# Global reference to loader (set by main.py)
_loader_instance = None
def set_loader(loader):
    global _loader_instance
    _loader_instance = loader

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0-dev"}

@app.get("/api/integrations")
async def get_integrations():
    return CORE_STATE.integrations

@app.post("/api/integrations/{name}/connect")
async def connect_integration(name: str, request: Request):
    """Connect to a real integration using credentials from DB."""
    # Use existing credentials OR mock for dev
    async with AsyncSessionLocal() as session:
        from src.core.db.models import Integration
        from sqlalchemy.future import select
        result = await session.execute(select(Integration).where(Integration.platform == name))
        db_integration = result.scalar_one_or_none()
        
        settings = None
        if db_integration and db_integration.credentials:
             settings = db_integration.credentials
        
        # fallback for dev
        if not settings and name == "twitch":
             logger.warning(f"No credentials for {name}, using MOCK credentials.")
             settings = {"client_id": "mock", "client_secret": "mock"}
             
        if not settings:
             raise HTTPException(status_code=400, detail="Integration credentials not configured.")
        
    # Attempt to connect to real API
    success = await INTEGRATION_MANAGER.initialize_integration(name, settings)
    
    if success:
        await CORE_STATE.update_integration(name, "connected")
        return {"status": "connected", "platform": name}
    else:
        await CORE_STATE.update_integration(name, "error")
        raise HTTPException(status_code=500, detail=f"Failed to connect to {name}")

@app.post("/api/integrations/{name}/configure")
async def configure_integration(name: str, request: Request):
    """Save integration credentials to DB."""
    credentials = await request.json()
    
    async with AsyncSessionLocal() as session:
        from src.core.db.models import Integration
        from sqlalchemy.future import select
        result = await session.execute(select(Integration).where(Integration.platform == name))
        db_integration = result.scalar_one_or_none()
        
        if not db_integration:
            db_integration = Integration(platform=name)
            session.add(db_integration)
        
        db_integration.credentials = credentials
        db_integration.status = "configured"
        await session.commit()
    
    await CORE_STATE.update_integration(name, "configured", credentials=credentials)
    return {"status": "configured", "platform": name}

@app.post("/api/integrations/{name}/disconnect")
async def disconnect_integration(name: str):
    await INTEGRATION_MANAGER.disconnect_integration(name)
    await CORE_STATE.update_integration(name, "disconnected")
    return {"status": "disconnected", "platform": name}

@app.get("/api/modules")
async def get_modules():
    modules = []
    for mod_id, manifest in CORE_STATE.loaded_manifests.items():
        mod_data = manifest.copy()
        mod_data["settings_values"] = CORE_STATE.get_module_settings(mod_id)
        mod_data["enabled"] = CORE_STATE.is_module_enabled(mod_id)
        modules.append(mod_data)
    return modules

@app.post("/api/modules/{module_id}/toggle")
async def toggle_module(module_id: str, request: Request):
    body = await request.json()
    enabled = body.get("enabled", False)
    
    await CORE_STATE.set_module_enabled(module_id, enabled)
    
    global _loader_instance
    if _loader_instance:
        if enabled:
            success = _loader_instance.start_module(module_id)
        else:
            success = _loader_instance.stop_module(module_id)
    else:
        logger.error("Loader instance not available")
        success = False
        
    return {"status": "ok", "enabled": enabled, "action_success": success}

@app.get("/api/modules/{module_id}/settings")
async def get_module_settings(module_id: str):
    return CORE_STATE.get_module_settings(module_id)

@app.post("/api/modules/{module_id}/settings")
async def update_module_settings(module_id: str, request: Request):
    new_settings = await request.json()
    await CORE_STATE.update_module_settings(module_id, new_settings)
    
    sid = CORE_STATE.get_sid_for_module(module_id)
    if sid:
        logger.info(f"Pushing config update to {module_id} (sid: {sid})")
        await sio.emit("config_update", new_settings, room=sid)
    else:
        logger.warning(f"Module {module_id} not connected, settings saved but not pushed yet.")
        
    return {"status": "ok", "settings": new_settings}

# ==================== Module UI Routes ====================

@app.get("/modules/{module_id}/ui/{file_path:path}")
async def serve_module_ui(module_id: str, file_path: str):
    """Serve static files from module's UI directory."""
    module_path = CORE_STATE.module_paths.get(module_id)
    if not module_path:
        raise HTTPException(status_code=404, detail="Module not found")
    
    ui_file = os.path.join(module_path, "ui", file_path)
    
    if not os.path.exists(ui_file) or not os.path.isfile(ui_file):
        raise HTTPException(status_code=404, detail="UI file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(ui_file)

@app.get("/overlay/{module_id}")
async def module_overlay(module_id: str):
    """Serve module's OBS overlay. This is the URL streamers add to OBS."""
    module_path = CORE_STATE.module_paths.get(module_id)
    if not module_path:
        raise HTTPException(status_code=404, detail="Module not found")
    
    overlay_file = os.path.join(module_path, "ui", "overlay.html")
    
    if not os.path.exists(overlay_file):
        # Return a helpful error page
        from fastapi.responses import HTMLResponse
        return HTMLResponse(
            content=f"""<html><body style='background:transparent;color:red;font-family:sans-serif;padding:20px;'>
                <h2>Module '{module_id}' does not have an overlay.</h2>
                <p>To create one, add ui/overlay.html to the module.</p>
            </body></html>""",
            status_code=404
        )
    
    from fastapi.responses import FileResponse
    return FileResponse(overlay_file)

@app.get("/api/modules/{module_id}/ui-info")
async def get_module_ui_info(module_id: str):
    """Get information about module's UI capabilities."""
    module_path = CORE_STATE.module_paths.get(module_id)
    if not module_path:
        raise HTTPException(status_code=404, detail="Module not found")
    
    manifest = CORE_STATE.loaded_manifests.get(module_id, {})
    ui_config = manifest.get("ui", {})
    
    # Check if files actually exist
    has_custom_settings = False
    has_overlay = False
    
    if ui_config.get("settings"):
        settings_file = os.path.join(module_path, "ui", ui_config["settings"].split("/")[-1])
        has_custom_settings = os.path.exists(settings_file)
    
    if ui_config.get("overlay"):
        overlay_file = os.path.join(module_path, "ui", ui_config["overlay"].split("/")[-1])
        has_overlay = os.path.exists(overlay_file)
    
    return {
        "has_custom_settings": has_custom_settings,
        "has_overlay": has_overlay,
        "settings_url": f"/modules/{module_id}/{ui_config.get('settings', '')}" if has_custom_settings else None,
        "overlay_url": f"/overlay/{module_id}" if has_overlay else None
    }

# Static Files
DIST_DIR = os.path.join(os.getcwd(), "static_dist")

if os.path.exists(DIST_DIR):
    logger.info(f"Serving UI from: {DIST_DIR}")
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="static")
else:
    logger.warning(f"{DIST_DIR} not found. Run 'npm run build' in src/frontend.")

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    if sid in CORE_STATE.active_sessions:
        del CORE_STATE.active_sessions[sid]

@sio.event
async def register_module(sid, data):
    module_id = data.get("module_id")
    if module_id:
        CORE_STATE.active_sessions[sid] = module_id
        logger.info(f"Session {sid} registered as module '{module_id}'")
        
        settings = CORE_STATE.get_module_settings(module_id)
        if settings:
             await sio.emit("config_update", settings, room=sid)

@sio.event
async def module_ui_event(sid, data):
    """
    Forward event from UI to Module Backend (or vice versa).
    Data structure:
    {
        "target": "module_id" (needed if sent from generic UI),
        "event": "custom_event_name",
        "payload": {}
    }
    """
    # 1. Determine sender (Module or UI?)
    sender_module_id = CORE_STATE.active_sessions.get(sid)
    
    if sender_module_id:
        # Sender is a MODULE. Broadcast to all UI clients interested in this module?
        # Better: use channel conventions.
        event_name = data.get("event")
        payload = data.get("payload")
        
        # We emit a "ui_event" but with routing info so frontend can filter
        await sio.emit("ui_event_from_module", {
            "module_id": sender_module_id,
            "event": event_name,
            "payload": payload
        })
        
    else:
        # Sender is UI (Client). Needs to send to specific module.
        target_module_id = data.get("target")
        event_name = data.get("event")
        payload = data.get("payload")
        
        if not target_module_id:
            return
            
        # Find module SID
        module_sid = CORE_STATE.get_sid_for_module(target_module_id)
        if module_sid:
            # Send to the specific module process
            await sio.emit("ui_event", {"event": event_name, "payload": payload}, room=module_sid)
        else:
            logger.warning(f"UI sent event to disconnected module {target_module_id}")

@sio.event
async def command_send_chat(sid, data):
    module_id = CORE_STATE.active_sessions.get(sid)
    if not module_id:
        logger.warning(f"Access Denied: Unregistered session {sid}")
        return

    if not CORE_STATE.check_permission(module_id, "chat_send"):
        logger.warning(f"Access Denied: Module '{module_id}' lacks 'chat_send' permission")
        return

    message = data.get("message")
    target = data.get("target_platform")
    
    platforms_to_use = []
    
    if target:
        if CORE_STATE.integrations.get(target, {}).get("status") == "connected":
            platforms_to_use.append(target)
        else:
             logger.error(f"Target platform {target} not available")
    else:
        for name, info in CORE_STATE.integrations.items():
            if info.get("status") == "connected":
                platforms_to_use.append(name)
    
    for platform in platforms_to_use:
        # Use real IntegrationManager to send messages
        await INTEGRATION_MANAGER.send_message(platform, message)
        logger.info(f">>> [{platform}] '{message}' (from {module_id})")

