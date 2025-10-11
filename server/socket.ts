import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setSocketIO(socketServer: SocketIOServer) {
  io = socketServer;
}

export function getSocketIO() {
  return io;
}

export function broadcastAuctionUpdate(auctionId: string, data: any) {
  if (io) {
    io.to(`auction-${auctionId}`).emit("auctionUpdate", data);
    io.emit("auctionUpdate", data); // Also broadcast to all clients for home page updates
  }
}

export function broadcastBidBalanceUpdate(userId: string, newBalance: number) {
  if (io) {
    io.emit("bidBalanceUpdate", { userId, newBalance });
  }
}