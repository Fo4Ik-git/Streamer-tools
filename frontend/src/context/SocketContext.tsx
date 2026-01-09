import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  status: string;
  sendMessage: (event: string, data?: any) => void;
  messages: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io("http://127.0.0.1:3001", {
       transports: ['websocket', 'polling']
    });

    newSocket.on("connect", () => {
      setStatus("Connected");
      newSocket.emit("ping");
    });

    newSocket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    newSocket.on("pong", (data: any) => {
        if(data && data.msg) {
             setMessages((prev) => [...prev, `[PONG] ${data.msg}`]);
        }
    });
    
    // Generic log listener if backend sends logs via socket
    newSocket.on("log", (data: any) => {
         // Handle object logs from broadcastLog
         const logMsg = typeof data === 'string' ? data : `[${data.type?.toUpperCase() || 'INFO'}] ${data.msg}`;
         setMessages((prev) => [...prev, logMsg]);
         
         // Also log to console so tauri-plugin-log picks it up if needed
         console.log("[BACKEND-SOCKET]", logMsg);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendMessage = (event: string, data?: any) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, status, sendMessage, messages }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
