from sqlalchemy import Column, Integer, String, Boolean, JSON, Text
from src.core.db.database import Base

class Integration(Base):
    __tablename__ = "integrations"

    platform = Column(String, primary_key=True, index=True)
    status = Column(String, default="disconnected")
    token = Column(String, nullable=True) # Access Token
    credentials = Column(JSON, nullable=True) # {client_id, client_secret, refresh_token}
    meta_data = Column(JSON, nullable=True) # {user_id, username, etc}

class ModuleSettings(Base):
    __tablename__ = "module_settings"

    module_id = Column(String, primary_key=True, index=True)
    enabled = Column(Boolean, default=True)
    settings = Column(JSON, default={})
