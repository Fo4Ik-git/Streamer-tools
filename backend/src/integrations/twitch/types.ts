export interface ChatMessage {
    platform: 'twitch';
    user: string;
    text: string;
    color: string;
    isMod: boolean;
    isSub: boolean;
    timestamp: number;
}

export interface TwitchStatus {
    connected: boolean;
    channel?: string;
    error?: string;
}