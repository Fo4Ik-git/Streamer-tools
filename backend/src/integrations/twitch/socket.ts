import { Server, Socket } from 'socket.io';
import { TwitchService } from './service.js';

export function setupTwitchSocket(server: Server) {
    const twitchService = new TwitchService();

    // Настраиваем реакцию сервиса на события -> отправляем в UI
    twitchService.setCallbacks(
        (msg) => {
            // Когда приходит сообщение из чата Twitch
            server.emit('twitch:message', msg);
        },
        (status) => {
            // Когда меняется статус подключения
            server.emit('twitch:status', { status });
        }
    );

    // Обработка входящих команд от UI
    server.on('connectservern', (socket: Socket) => {
        
        // Команда от UI: "Подключись к каналу"
        socket.on('twitch:connect', async (data: { channel: string }) => {
            try {
                await twitchService.connect(data.channel);
                socket.emit('twitch:status', { status: 'connected', channel: data.channel });
            } catch (e: any) {
                socket.emit('twitch:error', { message: e.message });
            }
        });

        // Команда от UI: "Отключись"
        socket.on('twitch:disconnect', async () => {
            await twitchService.disconnect();
            socket.emit('twitch:status', { status: 'disconnected' });
        });
    });
}