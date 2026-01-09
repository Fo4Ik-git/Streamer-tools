import { Power, Puzzle, RefreshCcw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Module {
  id: string;
  name: string;
  version: string;
  permissions: string[];
  requirements: string[];
  settings_schema?: Record<string, any>;
  settings_values?: Record<string, any>;
  enabled: boolean;
  ui?: {
      enabled: boolean;
      entry_point: string;
  }
}

export function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/modules");
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (error) {
      console.error("Failed to fetch modules", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const toggleModule = async (moduleId: string, currentState: boolean) => {
    // Optimistic update
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, enabled: !currentState } : m));
    
    try {
        const res = await fetch(`/api/modules/${moduleId}/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: !currentState }),
        });
        if (!res.ok) {
             // Revert on failure
             fetchModules();
        }
    } catch (e) {
        fetchModules();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Modules</h1>
        <button 
          onClick={() => { setLoading(true); fetchModules(); }}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="text-gray-400">Loading modules...</div>
        ) : modules.length === 0 ? (
           <div className="text-gray-400">No modules loaded.</div>
        ) : (
          modules.map((mod) => (
            <div key={mod.id} className={`p-6 rounded-xl border transition-all ${
                mod.enabled 
                ? "bg-gray-800 border-gray-700 hover:border-indigo-500" 
                : "bg-gray-800/50 border-gray-800 opacity-75"
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${mod.enabled ? "bg-indigo-500/10 text-indigo-400" : "bg-gray-700 text-gray-500"}`}>
                  <Puzzle size={24} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">v{mod.version}</span>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {/* 1. Custom UI Button */}
                        {mod.ui?.enabled && (
                            <button 
                            onClick={() => navigate(`/modules/${mod.id}/custom-ui`)}
                            disabled={!mod.enabled}
                            className={`p-2 rounded-lg transition-colors ${
                                mod.enabled 
                                ? "bg-gray-700 hover:bg-green-600 text-white" 
                                : "bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                            }`}
                            title="Open Module UI"
                            >
                                <Power size={16} /> {/* Placeholder icon */}
                            </button>
                        )}

                        {/* 2. Standard Settings Button */}
                        {mod.settings_schema && (
                            <button 
                            onClick={() => navigate(`/modules/${mod.id}/settings`)}
                            className={`p-2 rounded-lg transition-colors ${
                                mod.enabled 
                                ? "bg-gray-700 hover:bg-indigo-600 text-white" 
                                : "bg-gray-800 text-gray-600 border border-gray-700 hover:border-indigo-500 hover:text-indigo-400"
                            }`}
                            title="Settings"
                            >
                                <Settings size={16} />
                            </button>
                        )}
                    </div>
                    
                    <button
                        onClick={() => toggleModule(mod.id, mod.enabled)}
                        className={`p-2 rounded-lg transition-colors ${
                            mod.enabled 
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" 
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }`}
                        title={mod.enabled ? "Disable Module" : "Enable Module"}
                    >
                        <Power size={16} />
                    </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{mod.name}</h3>
              <p className="text-gray-400 text-sm mb-4">ID: {mod.id}</p>
              
              <div className="space-y-2">
                <div className="text-xs text-gray-500 font-semibold uppercase">Permissions</div>
                <div className="flex flex-wrap gap-2">
                  {mod.permissions.map(p => (
                    <span key={p} className="text-xs bg-gray-700/50 px-2 py-1 rounded text-blue-300 border border-blue-500/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
