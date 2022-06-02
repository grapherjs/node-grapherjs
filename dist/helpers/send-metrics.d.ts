import { Config } from "./default-config";
import { Socket } from "socket.io-client";
export default function sendMetrics(sock: Socket, span: Config["spans"][0]): void;
