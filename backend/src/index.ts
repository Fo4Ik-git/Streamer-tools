import Fastify, { FastifyInstance } from 'fastify';
import fastifySocketIO from 'fastify-socket.io';
// @ts-ignore
import cors from '@fastify/cors';
import { Server } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

const server = Fastify({ logger: true });

// 1. CORS (Важно для связи с Tauri UI)
server.register(cors, { 
    origin: "*", // В продакшене можно уточнить
    methods: ["GET", "POST"]
});

// 2. Socket.IO
// @ts-ignore
server.register(fastifySocketIO, {
    cors: { origin: "*" }
});

const PORT = 3001;

// Когда Fastify готов, настраиваем логику сокетов
server.ready().then(() => {
    // server.io доступен благодаря fastify-socket.io
    server.io.on('connection', (socket: any) => {
        server.log.info(`UI connected: ${socket.id}`);

        socket.on('ping', () => {
            socket.emit('pong', { msg: 'Hello from Fastify Sidecar!' });
        });

        // Здесь будет логика загрузки модулей...
    });
});

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