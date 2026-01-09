import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

export function ModuleCustomUI() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [moduleInfo, setModuleInfo] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Fetch module info to get entry point
    fetch("/api/modules")
        .then(r => r.json())
        .then(modules => {
            const mod = modules.find((m: any) => m.id === moduleId);
            if (mod) setModuleInfo(mod);
        });
  }, [moduleId]);
  
  // Listen for messages from standard socket and forward to iframe
  useEffect(() => {
      const handleUiEvent = (data: any) => {
          if (data.module_id === moduleId && iframeRef.current?.contentWindow) {
               // Post message to iframe
               iframeRef.current.contentWindow.postMessage({
                   type: "streamer_core_event",
                   event: data.event,
                   payload: data.payload,
               }, "*");
          }
      };

      socket.on("ui_event_from_module", handleUiEvent);
      return () => {
          socket.off("ui_event_from_module", handleUiEvent);
      };
  }, [moduleId]);

  // Listen for messages FROM iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        // Security check: ensure origin is same as we serve
        // simplified for now as both are same origin usually or bridged
        if (event.data?.type === "module_to_core") {
             // Forward to backend via Socket.IO
             // We use a special event 'module_ui_event'
             socket.emit("module_ui_event", {
                 target: moduleId,
                 event: event.data.event,
                 payload: event.data.payload
             });
        }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [moduleId]);

  if (!moduleInfo) return <div>Loading...</div>;
  if (!moduleInfo.ui?.enabled) return <div>This module does not have a custom UI.</div>;

  const entryPoint = moduleInfo.ui.entry_point || "ui/index.html";
  const uiUrl = `/modules/${moduleId}/ui/${entryPoint}`;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-4 p-4 border-b border-gray-700 bg-gray-900">
        <button 
          onClick={() => navigate("/modules")}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">{moduleInfo.name} - Custom UI</h1>
      </div>

      <div className="flex-1 bg-white relative">
          <iframe 
             ref={iframeRef}
             src={uiUrl} 
             className="absolute inset-0 w-full h-full border-none"
             title={`UI for ${moduleInfo.name}`}
          />
      </div>
    </div>
  );
}
