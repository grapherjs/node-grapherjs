import { Config } from "./default-config";
import { Socket } from "socket.io-client";

export default function sendMetrics(sock: Socket | null, span: Config["spans"][0]) {
  sock?.emit("stats", {
    os: span.os,
    responses: span.responses,
    interval: span.interval,
    retention: span.retention,
  });
}
