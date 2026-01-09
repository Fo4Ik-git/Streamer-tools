import Fastify, { FastifyInstance } from 'fastify';
import fastifySocketIO from 'fastify-socket.io';
// @ts-ignore
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { setupTwitchSocket } from './integrations/twitch';
import { storage, getStoragePath } from './storage/storage';

declare module 'fastify' {
    interface FastifyInstance {
        io: Server;
    }
}

const server = Fastify({ logger: true });

// 1. CORS (Важно для связи с Tauri UI)
server.register(cors, {
    origin: '*', // В продакшене можно уточнить
    methods: ['GET', 'POST'],
});

// 2. Socket.IO
// @ts-ignore
server.register(fastifySocketIO, {
    cors: { origin: '*' },
});

const PORT = 3001;
broadcastLog(`Storage initialized at: ${getStoragePath()}`);

// Wrapper for logging to both stdout (Tauri Sidecar capture) and Socket.IO (Dashboard UI)
function broadcastLog(msg: string, type: 'info' | 'error' | 'warn' = 'info') {
    if (type === 'error') server.log.error(msg);
    else server.log.info(msg);

    // Emit to all connected clients
    if (server.io) {
        server.io.emit('log', {
            msg,
            type,
            timestamp: new Date().toISOString(),
        });
    }
}

// Когда Fastify готов, настраиваем логику сокетов
server.ready().then(() => {
    // server.io доступен благодаря fastify-socket.io
    server.io.on('connection', (socket: any) => {
        broadcastLog(`UI connected: ${socket.id}`);

        socket.on('ping', () => {
            socket.emit('pong', { msg: 'Hello from Fastify Sidecar!' });
            broadcastLog(`Ping received from ${socket.id}`);
        });

        // --- Storage API via Socket ---
        socket.on('storage:set', (data: { key: string; value: any }) => {
            try {
                // If value is an object, stringify it
                const val =
                    typeof data.value === 'object'
                        ? JSON.stringify(data.value)
                        : String(data.value);
                storage.setItem(data.key, val);
                broadcastLog(`Storage updated: ${data.key}`);
                // Ack
                socket.emit('storage:updated', {
                    key: data.key,
                    value: data.value,
                });
            } catch (err: any) {
                broadcastLog(`Storage set error: ${err.message}`, 'error');
            }
        });

        socket.on(
            'storage:get',
            (key: string, callback?: (val: any) => void) => {
                try {
                    const val = storage.getItem(key);
                    let parsed = val;
                    // Try json parse
                    try {
                        if (val) parsed = JSON.parse(val);
                    } catch {}

                    if (typeof callback === 'function') {
                        callback(parsed);
                    } else {
                        socket.emit('storage:value', { key, value: parsed });
                    }
                } catch (err: any) {
                    broadcastLog(`Storage get error: ${err.message}`, 'error');
                }
            }
        );
        // ------------------------------

        // Connections to various integrations
        connectToIntegrations(server);
    });
});

function connectToIntegrations(server: FastifyInstance) {
    // Здесь можно инициализировать интеграции, например Twitch, YouTube и т.д.
    // Пример для Twitch:
    // TODO Надо сделать проверку на включенную интеграцию из настроек пользователя + созданение в DB / localstorage
    setupTwitchSocket(server.io);
}

// 3. Запуск сервера
const start = async () => {
    try {
        // Слушаем 127.0.0.1, чтобы не светить в локальную сеть
        await server.listen({ port: PORT, host: '127.0.0.1' });
        console.log(`Backend running on http://127.0.0.1:${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
