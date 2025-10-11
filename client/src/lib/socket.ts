import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.socket = io(wsUrl, {
      transports: ["websocket", "polling"],
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinAuction(auctionId: string) {
    if (this.socket) {
      this.socket.emit("joinAuction", auctionId);
    }
  }

  leaveAuction(auctionId: string) {
    if (this.socket) {
      this.socket.emit("leaveAuction", auctionId);
    }
  }

  onAuctionUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("auctionUpdate", callback);
    }
  }

  onTimerUpdate(callback: (timers: Record<string, number>) => void) {
    if (this.socket) {
      this.socket.on("timerUpdate", callback);
    }
  }

  offAuctionUpdate() {
    if (this.socket) {
      this.socket.off("auctionUpdate");
    }
  }

  offTimerUpdate() {
    if (this.socket) {
      this.socket.off("timerUpdate");
    }
  }
}

export const socketService = new SocketService();
