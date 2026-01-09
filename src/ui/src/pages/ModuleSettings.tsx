import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface ModuleSettingsSchema {
  [key: string]: {
    type: "string" | "number" | "boolean";
    title: string;
    default?: any;
    description?: string;
  };
}

export function ModuleSettings() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<ModuleSettingsSchema | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!moduleId) return;
    
    // We need both the schema (from module list/manifest) and current values
    // Since we don't store schema in a separate API, let's fetch module info
    const fetchData = async () => {
      try {
        const modulesRes = await fetch("/api/modules");
        const modules = await modulesRes.json();
        const module = modules.find((m: any) => m.id === moduleId);
        
        if (module && module.settings_schema) {
          setSchema(module.settings_schema);
          
          // Current values might be in module object or separate API
          // Let's check if settings_values came with module
          if (module.settings_values) {
             setValues(module.settings_values);
          } else {
             // Fallback to fetch generic settings endpoint
            const settingsRes = await fetch(`/api/modules/${moduleId}/settings`);
            if (settingsRes.ok) {
                setValues(await settingsRes.json());
            }
          }
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [moduleId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/modules/${moduleId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      // Optionally show toast
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;
  if (!schema) return <div className="p-6">No settings schema found for this module.</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/modules")}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">Module Settings</h1>
      </div>

      <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 space-y-6">
        {Object.entries(schema).map(([key, field]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {field.title || key}
            </label>
            
            {field.type === "string" && (
              <input
                type="text"
                value={values[key] || ""}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            )}
            
            {field.type === "number" && (
              <input
                type="number"
                value={values[key] || 0}
                onChange={(e) => setValues({ ...values, [key]: Number(e.target.value) })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            )}

            {field.type === "boolean" && (
               <label className="flex items-center gap-3 cursor-pointer">
                 <div className={`w-12 h-6 rounded-full p-1 transition-colors ${values[key] ? "bg-indigo-500" : "bg-gray-700"}`}
                      onClick={() => setValues({ ...values, [key]: !values[key] })}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${values[key] ? "translate-x-6" : ""}`} />
                 </div>
                 <span className="text-gray-400">{values[key] ? "Enabled" : "Disabled"}</span>
               </label>
            )}
            
            {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        ))}

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
