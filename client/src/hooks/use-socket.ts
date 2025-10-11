import { useEffect, useState } from "react";
import { socketService } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = socketService.connect();
    setSocket(socketInstance);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketService.disconnect();
    };
  }, []);

  return { socket, connected };
}
