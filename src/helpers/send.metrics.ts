import { Config } from "./default-config";
import { Socket } from "socket.io-client";

export default function sendMetrics(sock: Socket, span: Config["spans"][0]) {
  sock.emit("stats", {
    os: span.os[span.os.length - 2],
    responses: span.responses[span.responses.length - 2],
    interval: span.interval,
    retention: span.retention,
  });
}
