"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sendMetrics(sock, span) {
    sock.emit("stats", {
        os: span.os,
        responses: span.responses,
        interval: span.interval,
        retention: span.retention,
    });
}
exports.default = sendMetrics;
