import { Box, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Modules = () => {
  const { t } = useTranslation();

  const modules = [
    { id: 1, name: 'Chat Bot', status: 'active', desc: 'Auto-moderation and commands' },
    { id: 2, name: 'Alerts', status: 'inactive', desc: 'On-screen notifications' },
    { id: 3, name: 'Points System', status: 'active', desc: 'Loyalty rewards for viewers' },
  ];

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">{t('modules')}</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                + Add Module
            </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {modules.map((mod) => (
               <div key={mod.id} className="group relative p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all dark:bg-slate-900 bg-white dark:border-slate-800 border-gray-200 shadow-sm hover:shadow-md">
                   <div className="flex justify-between items-start mb-4">
                       <div className="p-3 bg-slate-800 rounded-lg dark:bg-slate-800 bg-gray-100 text-slate-200 dark:text-slate-200 text-gray-700">
                           <Box size={24} />
                       </div>
                       <div className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                           mod.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'
                       }`}>
                           {mod.status}
                       </div>
                   </div>
                   
                   <h3 className="text-xl font-bold mb-2 text-slate-100 dark:text-slate-100 text-gray-800">{mod.name}</h3>
                   <p className="text-slate-400 dark:text-slate-400 text-gray-500 text-sm mb-4">{mod.desc}</p>
                   
                   <button className="w-full py-2 flex items-center justify-center gap-2 border border-slate-700 rounded-lg hover:bg-slate-800 dark:border-slate-700 border-gray-300 dark:hover:bg-slate-800 hover:bg-gray-50 transition-colors text-sm font-medium text-slate-300 dark:text-slate-300 text-gray-600">
                       <Settings size={16} />
                       {t('configure')}
                   </button>
               </div>
           ))}
       </div>
    </div>
  );
};
