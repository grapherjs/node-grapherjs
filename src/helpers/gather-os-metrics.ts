import os from "os";
import pidusage from "pidusage";
import sendMetrics from "./send-metrics";
import v8 from "v8";
import { Config } from "./default-config";
import { Socket } from "socket.io-client";

export default function gatherOsMetrics(io: Socket | null, span: Config["spans"][0]) {
  const defaultResponse = {
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    count: 0,
    mean: 0,
    timestamp: Date.now(),
  };

  pidusage(process.pid, (err, stat: any) => {
    if (err) {
      return;
    }

    const last = span.responses[span.responses.length - 1];

    // Convert from B to MB
    stat.memory = stat.memory / 1024 / 1024;
    stat.load = os.loadavg();
    stat.timestamp = Date.now();
    stat.heap = v8.getHeapStatistics();

    span.os.push(stat);

    if (!span.responses[0] || last.timestamp + span.interval < Date.now()) {
      span.responses.push(defaultResponse);
    }

    if (span.os.length >= span.retention) span.os.shift();
    if (span.responses[0] && span.responses.length > span.retention) span.responses.shift();

    sendMetrics(io, span);
  });
}
