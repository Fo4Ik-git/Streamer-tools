import { Link, MessageCircle, Twitch, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';

interface Integration {
    id: string;
    name: string;
    icon: any;
    connected: boolean;
    description: string;
}

export const Integrations = () => {
    const { t } = useTranslation();
    const { socket, sendMessage } = useSocket();
    
    // In a real app, you might fetch this list from backend via socket
    const [integrations, setIntegrations] = useState<Integration[]>([
        { id: 'twitch', name: 'Twitch', icon: Twitch, connected: false, description: 'Connect chat & alerts' },
        { id: 'youtube', name: 'YouTube', icon: Youtube, connected: false, description: 'Stream info & chat' },
        { id: 'discord', name: 'Discord', icon: MessageCircle, connected: true, description: 'Bot status & notifications' },
    ]);

    useEffect(() => {
        if(!socket) return;
        
        // Listen for updates from backend about integrations
        socket.on('integrations:list', (data: Integration[]) => {
             // console.log("Received integrations list", data);
             // setIntegrations(data); 
             // Commented out as backend doesn't send this yet, use mock for UI
        });

        // Request initial state
        sendMessage('integrations:get');

        return () => {
            socket.off('integrations:list');
        }
    }, [socket]);

    const handleConnect = (id: string) => {
        // Toggle mock state for UI purpose
        setIntegrations(prev => prev.map(int => 
            int.id === id ? { ...int, connected: !int.connected } : int
        ));
        
        // Send command to backend
        sendMessage('integrations:connect', { id });
    };

    return (
        <div className="space-y-6">
            <div>
                 <h2 className="text-3xl font-bold">{t('integrations')}</h2>
                 <p className="text-slate-400 dark:text-slate-400 text-gray-500 mt-2">{t('integrations_desc')}</p>
            </div>

            <div className="space-y-4">
                {integrations.map((int) => (
                    <div key={int.id} className="flex items-center justify-between p-6 rounded-xl bg-slate-900 border border-slate-800 dark:bg-slate-900 bg-white dark:border-slate-800 border-gray-200 shadow-sm transition-all hover:border-slate-600">
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-xl ${
                                int.id === 'twitch' ? 'bg-purple-600/20 text-purple-500' :
                                int.id === 'youtube' ? 'bg-red-600/20 text-red-500' :
                                'bg-indigo-600/20 text-indigo-500'
                            }`}>
                                <int.icon size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 text-gray-800">{int.name}</h3>
                                <p className="text-slate-500 text-sm">{int.description}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleConnect(int.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                                int.connected 
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                            }`}
                        >
                            {int.connected ? (
                                <>
                                    <Link size={16} className="rotate-45" />
                                    {t('disconnect')}
                                </>
                            ) : (
                                <>
                                    <Link size={16} />
                                    {t('connect')}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
