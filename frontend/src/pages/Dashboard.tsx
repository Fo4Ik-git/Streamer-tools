import { Activity, CircuitBoard, Cpu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';

export const Dashboard = () => {
    const { t } = useTranslation();
    const { messages, socket } = useSocket();
    const [stats, setStats] = useState({
        cpu: 0,
        memory: { used: 0, total: 0, percentage: 0 }
    });

    useEffect(() => {
        if (!socket) return;

        socket.on('system:stats', (data: any) => {
            setStats(data);
        });

        return () => {
            socket.off('system:stats');
        };
    }, [socket]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">{t('dashboard')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Stat Cards */}
                 <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl dark:bg-slate-900 bg-white dark:border-slate-800 border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-500 text-gray-400">{t('cpu_usage')}</p>
                            <h3 className="text-2xl font-bold text-white dark:text-white text-gray-800">{stats.cpu}%</h3>
                        </div>
                    </div>
                 </div>

                 <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl dark:bg-slate-900 bg-white dark:border-slate-800 border-gray-200">
                    <div className="flex items-center gap-4">
                         <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <CircuitBoard size={24} />
                        </div>
                         <div>
                            <p className="text-sm text-slate-500 dark:text-slate-500 text-gray-400">{t('memory_usage')}</p>
                            <h3 className="text-2xl font-bold text-white dark:text-white text-gray-800">{formatBytes(stats.memory.used)}</h3>
                            <p className="text-xs text-slate-500">{stats.memory.percentage}% of {formatBytes(stats.memory.total)}</p>
                        </div>
                     </div>
                 </div>

                 <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl dark:bg-slate-900 bg-white dark:border-slate-800 border-gray-200">
                    <div className="flex items-center gap-4">
                         <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                            <Cpu size={24} />
                        </div>
                         <div>
                            <p className="text-sm text-slate-500 dark:text-slate-500 text-gray-400">{t('active_modules')}</p>
                            <h3 className="text-2xl font-bold text-white dark:text-white text-gray-800">4</h3>
                        </div>
                     </div>
                 </div>
            </div>

            {/* Logs Section */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden dark:bg-slate-900 bg-white dark:border-slate-800 border-gray-200">
                <div className="px-6 py-4 border-b border-slate-800 dark:border-slate-800 border-gray-200 flex items-center justify-between">
                     <h3 className="font-semibold">{t('server_logs')}</h3>
                     <span className="text-xs text-slate-500">{messages.length} events</span>
                </div>
                <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-2 custom-scrollbar bg-slate-950/50 dark:bg-slate-950/50 bg-gray-50/50">
                     {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            No logs yet...
                        </div>
                     ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className="break-all border-l-2 border-blue-500 pl-3 py-1">
                                <span className="text-slate-400 block text-xs mb-0.5">{new Date().toLocaleTimeString()}</span>
                                <span className="text-slate-300 dark:text-slate-300 text-gray-700">{msg}</span>
                            </div>
                        ))
                     )}
                </div>
            </div>
        </div>
    );
};
