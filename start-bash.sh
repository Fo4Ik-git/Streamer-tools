#!/bin/bash

# Exit on error
set -e

echo "Building backend..."
cd backend
npm run build
npm run package:mac-arm
cd ..

echo "Starting frontend with Tauri..."
cd frontend
npm run tauri dev