import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Activity } from "lucide-react";
import "./App.css";

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Подключаемся к Sidecar серверу
    const newSocket = io("http://127.0.0.1:3001");

    newSocket.on("connect", () => {
      setStatus("Connected to Core");
      newSocket.emit("ping");
    });

    newSocket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    newSocket.on("pong", (data: any) => {
      setMessages((prev) => [...prev, data.msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 font-sans">
      <header className="mb-8 flex items-center gap-4 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold  from-blue-400 to-purple-500 bg-clip-text text-transparent">
          StreamCore
        </h1>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          status.includes("Connected") ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
        }`}>
          {status}
        </div>
      </header>

      <main className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity size={20} /> Server Logs
        </h2>
        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto border border-slate-800">
          {messages.length === 0 ? (
            <span className="text-slate-500">Waiting for messages...</span>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="mb-1 text-green-400">
                <span className="text-slate-500 mr-2">[{i}]</span>
                {msg}
              </div>
            ))
          )}
        </div>

        <button 
          onClick={() => socket?.emit('ping')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
        >
          Send Ping
        </button>
      </main>
    </div>
  );
}

export default App;