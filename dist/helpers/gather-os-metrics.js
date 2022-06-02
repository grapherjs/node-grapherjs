"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const pidusage_1 = __importDefault(require("pidusage"));
const send_metrics_1 = __importDefault(require("./send-metrics"));
const v8_1 = __importDefault(require("v8"));
function gatherOsMetrics(io, span) {
    const defaultResponse = {
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        count: 0,
        mean: 0,
        timestamp: Date.now(),
    };
    (0, pidusage_1.default)(process.pid, (err, stat) => {
        if (err) {
            return;
        }
        const last = span.responses[span.responses.length - 1];
        stat.memory = stat.memory / 1024 / 1024;
        stat.load = os_1.default.loadavg();
        stat.timestamp = Date.now();
        stat.heap = v8_1.default.getHeapStatistics();
        span.os.push(stat);
        if (!span.responses[0] || last.timestamp + span.interval < Date.now()) {
            span.responses.push(defaultResponse);
        }
        if (span.os.length >= span.retention)
            span.os.shift();
        if (span.responses[0] && span.responses.length > span.retention)
            span.responses.shift();
        (0, send_metrics_1.default)(io, span);
    });
}
exports.default = gatherOsMetrics;
