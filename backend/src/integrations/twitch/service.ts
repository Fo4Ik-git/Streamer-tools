import { ChatClient } from '@twurple/chat';
import { StaticAuthProvider } from '@twurple/auth';
import { ChatMessage } from './types.js';

// Тип для функции-колбэка, которая будет вызываться при новом сообщении
type MessageCallback = (msg: ChatMessage) => void;
type StatusCallback = (status: string) => void;

export class TwitchService {
    private chatClient: ChatClient | null = null;
    private onMessageCb: MessageCallback | null = null;
    private onStatusCb: StatusCallback | null = null;

    constructor() {}

    // Регистрация колбэков
    public setCallbacks(onMessage: MessageCallback, onStatus: StatusCallback) {
        this.onMessageCb = onMessage;
        this.onStatusCb = onStatus;
    }

    public async connect(channelName: string) {
        try {
            if (this.chatClient) {
                await this.chatClient.quit();
            }

            // TODO: Заменить на реальные токены или OAuth Flow
            // Для режима "только чтение" (anon) Twurple требует специфической настройки,
            // либо можно использовать любой валидный App Access Token.
            // Для примера используем заглушку authProvider
            const authProvider = new StaticAuthProvider('CLIENT_ID', 'ACCESS_TOKEN');

            this.chatClient = new ChatClient({
                channels: [channelName],
                // authProvider // Раскомментировать, когда будут ключи
            });

            this.chatClient.onConnect(() => {
                console.log(`[Twitch] Connected to ${channelName}`);
                if (this.onStatusCb) this.onStatusCb('connected');
            });

            this.chatClient.onDisconnect((_, reason) => {
                console.log(`[Twitch] Disconnected: ${reason}`);
                if (this.onStatusCb) this.onStatusCb('disconnected');
            });

            this.chatClient.onMessage((channel, user, text, msg) => {
                const messageData: ChatMessage = {
                    platform: 'twitch',
                    user: msg.userInfo.displayName,
                    text: text,
                    color: msg.userInfo.color || '#a855f7', // Fallback color
                    isMod: msg.userInfo.isMod,
                    isSub: msg.userInfo.isSubscriber,
                    timestamp: Date.now()
                };

                if (this.onMessageCb) {
                    this.onMessageCb(messageData);
                }
            });

            await this.chatClient.connect();

        } catch (error: any) {
            console.error('[Twitch Error]', error);
            throw error;
        }
    }

    public async disconnect() {
        if (this.chatClient) {
            await this.chatClient.quit();
            this.chatClient = null;
        }
    }
}