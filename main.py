import uvicorn
import asyncio
from src.core.server import socket_app, app, set_loader
from src.core.loader import ModuleLoader
from src.core.state import CORE_STATE
from src.core.logger import core_logger as logger
from src.core.db.database import init_db

# Initialize Loader
loader = ModuleLoader()
set_loader(loader) # Inject into server

@app.on_event("startup")
async def startup_event():
    logger.info("=== STARTING STREAMER CORE ===")
    
    # Initialize DB
    await init_db()
    logger.info("Database initialized.")

    # Initialize State from DB
    await CORE_STATE.initialize_from_db()

    # Load Modules
    loader.load_all()

@app.on_event("shutdown")
def shutdown_event():
    logger.info("=== STOPPING STREAMER CORE ===")
    loader.stop_all()

def run():
    # Run server
    uvicorn.run(socket_app, host="127.0.0.1", port=8080)

if __name__ == "__main__":
    run()
