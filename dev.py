import os

class DevConfig:
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    DATABASE_URL = "sqlite+aiosqlite:///./dev_database.db"

    def __init__(self):
        self.pip = "pip"

    def check_pip(self):
        import shutil

        pip_path = shutil.which("pip")
        if pip_path:
            self.pip = pip_path
            return True
        else:
            pip_path = shutil.which("pip3")
            if pip_path:
                self.pip = pip_path
                return True
        SystemExit("Pip is not installed. Please install pip to proceed.")


    def check_python_dependencies(self):
        import importlib.util

        required_packages = []
        if os.path.exists("requirements.txt"):
            with open("requirements.txt", "r") as f:
                required_packages = [line.strip() for line in f.readlines() if line.strip() and not line.startswith("#")]

        missing_packages = []
        for package in required_packages:
            if importlib.util.find_spec(package) is None:
                missing_packages.append(package)

        return missing_packages

    def intall_python_dependencies(self):
        import subprocess
        import sys

        missing_packages = self.check_python_dependencies()
        if missing_packages:
            print(f"Installing missing packages: {', '.join(missing_packages)}")
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
        else:
            print("All required packages are already installed.")
        
    def install_npm_dependencies(self):
        import subprocess

        if os.path.exists("src/ui/package.json"):
            print("Installing NPM dependencies...")
            subprocess.check_call(["npm", "install"], cwd="src/ui")
        else:
            print("No package.json found in src/ui. Skipping NPM dependencies installation.")
            
    def build_frontend(self):
        import subprocess

        if os.path.exists("src/ui/package.json"):
            print("Building frontend...")
            subprocess.check_call(["npm", "run", "build"], cwd="src/ui")
        else:
            print("No package.json found in src/ui. Skipping frontend build.")
            
    def setup(self):
        try:
            self.check_pip()
            self.intall_python_dependencies()
            self.install_npm_dependencies()
            self.build_frontend()
            print("Development environment setup completed successfully.")
        except Exception as e:
            print(f"Error during setup: {e}")
        
if __name__ == "__main__":
    dev = DevConfig()
    dev.setup()
    ## Run the main application after setup
    import main
    main.run()