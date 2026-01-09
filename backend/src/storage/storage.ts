import { LocalStorage } from 'node-localstorage';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Determine storage path
// Using user's home directory to ensure write permissions and persistence
const appName = '.streamer-tools';
const storageName = 'backend-storage';
const storagePath = path.join(os.homedir(), appName, storageName);

// Ensure directory exists
if (!fs.existsSync(storagePath)) {
    try {
        fs.mkdirSync(storagePath, { recursive: true });
    } catch (error) {
        console.error('Failed to create storage directory:', error);
    }
}

// Initialize LocalStorage
export const storage = new LocalStorage(storagePath);

export const getStoragePath = () => storagePath;

console.log(`Storage initialized at: ${storagePath}`);
