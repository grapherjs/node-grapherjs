"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_config_1 = __importDefault(require("./default-config"));
const gather_os_metrics_1 = __importDefault(require("./gather-os-metrics"));
const socket_io_client_1 = require("socket.io-client");
let socket;
function socketInit(token) {
    if (!token)
        return;
    if (!socket) {
        socket = (0, socket_io_client_1.io)(process.env.TEST_APM_URL || "https://api.grapherjs.com/apm", {
            auth: {
                token,
            },
        });
        socket.on("connect", () => { });
        default_config_1.default.spans.forEach((span) => {
            const interval = setInterval(() => (0, gather_os_metrics_1.default)(socket, span), span.interval * 1000);
            interval.unref();
        });
    }
}
exports.default = socketInit;
