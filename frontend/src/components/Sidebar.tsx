import clsx from 'clsx';
import { Box, LayoutDashboard, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

export const Sidebar = () => {
  const { t } = useTranslation();

  const links = [
    { to: "/",        icon: LayoutDashboard, label: t('dashboard') },
    { to: "/modules", icon: Box,             label: t('modules') },
    { to: "/integrations", icon: Workflow,   label: t('integrations') },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-screen dark:bg-slate-900 bg-gray-100 dark:border-slate-700 border-gray-200 transition-colors duration-300">
      <div className="p-6 flex items-center justify-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          StreamCore
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-800 hover:bg-gray-200 dark:text-slate-400 text-gray-600"
            )}
          >
            <link.icon size={20} />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700 dark:border-slate-700 border-gray-200">
        <div className="flex items-center gap-3 px-4 py-2 text-slate-500 dark:text-slate-500 text-gray-400 text-sm">
             v0.1.0
        </div>
      </div>
    </aside>
  );
};
