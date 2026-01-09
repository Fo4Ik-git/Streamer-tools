"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_socket_io_1 = __importDefault(require("fastify-socket.io"));
// @ts-ignore
const cors_1 = __importDefault(require("@fastify/cors"));
const server = (0, fastify_1.default)({ logger: true });
// 1. CORS (Важно для связи с Tauri UI)
server.register(cors_1.default, {
    origin: "*", // В продакшене можно уточнить
    methods: ["GET", "POST"]
});
// 2. Socket.IO
// @ts-ignore
server.register(fastify_socket_io_1.default, {
    cors: { origin: "*" }
});
const PORT = 3001;
// Когда Fastify готов, настраиваем логику сокетов
server.ready().then(() => {
    // server.io доступен благодаря fastify-socket.io
    server.io.on('connection', (socket) => {
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
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map