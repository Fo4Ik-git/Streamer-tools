import os
import sys
import subprocess
import json
import time
from src.core.state import CORE_STATE

class ModuleLoader:
    def __init__(self, modules_dir="modules"):
        self.modules_dir = modules_dir
        self.processes = {} # module_id -> Popen

    def load_all(self):
        """Scans the modules directory and launches modules."""
        if not os.path.exists(self.modules_dir):
            os.makedirs(self.modules_dir)
            print(f"[Loader] Created directory {self.modules_dir}")

        print(f"[Loader] Scanning {self.modules_dir}...")
        
        for folder_name in os.listdir(self.modules_dir):
            module_path = os.path.join(self.modules_dir, folder_name)
            manifest_path = os.path.join(module_path, "manifest.json")

            if os.path.isdir(module_path) and os.path.exists(manifest_path):
                self._process_module(module_path, manifest_path)
                
    def _process_module(self, path, manifest_path):
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            module_id = manifest["id"]
            
            # 1. Register Manifest
            CORE_STATE.loaded_manifests[module_id] = manifest
            CORE_STATE.module_paths[module_id] = path # Store path for re-starting

            # 2. Check Requirement & Enabled state
            if not self._can_start(module_id, manifest):
                return

            # 3. Start
            self._start_module(module_id, path, manifest)

        except Exception as e:
            print(f"[Loader] Error processing {path}: {e}")

    def _can_start(self, module_id, manifest):
        # Check if enabled in settings (default True)
        settings = CORE_STATE.get_module_settings(module_id)
        # We need a system-level enabled flag, separate from user "settings_schema". 
        # let's assume CORE_STATE handles an 'enabled' metadata or we store it in module_settings under a reserved key like '_enabled'
        # Or better: CORE_STATE has a separate `module_states` dict.
        
        if not CORE_STATE.is_module_enabled(module_id):
            print(f"[Loader] SKIP '{manifest['name']}': Module is disabled.")
            return False

        requirements = manifest.get("requirements", [])
        for req in requirements:
            integration = CORE_STATE.integrations.get(req)
            if not integration or integration.get("status") != "connected":
                print(f"[Loader] SKIP '{manifest['name']}': Requirement '{req}' not connected.")
                return False
        return True

    def _start_module(self, module_id, path, manifest):
        if module_id in self.processes:
            print(f"[Loader] Module {module_id} is already running.")
            return

        try:
            entry_point = manifest.get("entry_point", "backend.py")
            script_path = os.path.join(path, entry_point)

            if not os.path.exists(script_path):
                print(f"[Loader] Error: {entry_point} not found in {path}")
                return

            print(f"[Loader] Launching module: {manifest['name']} (v{manifest['version']})")
            
            env = os.environ.copy()
            # Important: Add project root to PYTHONPATH so module can import src.sdk
            python_path = env.get("PYTHONPATH", "")
            env["PYTHONPATH"] = os.path.abspath(os.getcwd()) + os.pathsep + python_path

            proc = subprocess.Popen(
                [sys.executable, os.path.abspath(script_path)],
                cwd=path, 
                env=env,
                shell=False
            )
            self.processes[module_id] = proc

        except Exception as e:
            print(f"[Loader] Error launching module {path}: {e}")

    def stop_module(self, module_id):
        if module_id in self.processes:
            print(f"[Loader] Stopping module {module_id}...")
            p = self.processes[module_id]
            try:
                p.terminate()
                p.wait(timeout=5)
            except Exception:
                p.kill() # Force kill
            del self.processes[module_id]
            return True
        return False

    def start_module(self, module_id):
        if module_id in self.processes:
            print(f"[Loader] Module {module_id} is already running.")
            return True
        
        manifest = CORE_STATE.loaded_manifests.get(module_id)
        path = CORE_STATE.module_paths.get(module_id)
        
        if not manifest or not path:
             print(f"[Loader] Cannot start {module_id}: Unknown module.")
             return False

        if self._can_start(module_id, manifest):
             self._start_module(module_id, path, manifest)
             return True
        return False

    def stop_all(self):
        """Terminates all module processes."""
        print("[Loader] Stopping all modules...")
        ids = list(self.processes.keys())
        for mid in ids:
            self.stop_module(mid)