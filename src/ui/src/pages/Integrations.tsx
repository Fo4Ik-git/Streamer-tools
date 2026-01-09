import { Link2, Link2Off, RefreshCcw, Twitch, Youtube } from "lucide-react";
import { useEffect, useState } from "react";

interface IntegrationState {
  status: "connected" | "disconnected" | "error";
  token?: string;
  name: string;
}

export function Integrations() {
  const [integrations, setIntegrations] = useState<Record<string, IntegrationState>>({});
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Failed to fetch integrations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const toggleIntegration = async (name: string, currentStatus: string) => {
    const action = currentStatus === "connected" ? "disconnect" : "connect";
    try {
      await fetch(`/api/integrations/${name}/${action}`, { method: "POST" });
      fetchIntegrations();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "twitch": return <Twitch size={32} />;
      case "youtube": return <Youtube size={32} />;
      default: return <Link2 size={32} />;
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <button 
          onClick={fetchIntegrations}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             <div className="text-gray-400">Loading integrations...</div>
        ) : (
            Object.entries(integrations).map(([name, info]) => (
                <div key={name} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-lg ${info.status === 'connected' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-400'}`}>
                            {getIcon(name)}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                            info.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                            {info.status}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold capitalize mb-4">{name}</h3>

                    <button 
                        onClick={() => toggleIntegration(name, info.status)}
                        className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                            info.status === 'connected' 
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        {info.status === 'connected' ? (
                            <>
                                <Link2Off size={18} /> Disconnect
                            </>
                        ) : (
                             <>
                                <Link2 size={18} /> Connect
                            </>
                        )}
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
