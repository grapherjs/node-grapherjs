import config from "./default-config";
import gatherOsMetrics from "./gather-os-metrics";
import { io, Socket } from "socket.io-client";

let socket: Socket | null;

export default function socketInit(token: string) {
  if (!token) return;

  if (!socket) {
    socket = io(process.env.TEST_APM_URL || "https://api.grapherjs.com/apm", {
      auth: {
        token,
      },
    });

    socket.on("connect", () => {});
    socket.on("disconnect", () => {
      socket = null;
    });

    config.spans.forEach((span) => {
      const interval = setInterval(() => gatherOsMetrics(socket, span), span.interval * 1000);

      // Don't keep Node.js process up
      interval.unref();
    });
  }
}
