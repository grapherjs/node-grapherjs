"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const axios_1 = __importDefault(require("axios"));
const default_config_1 = __importDefault(require("./helpers/default-config"));
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const lodash_omit_1 = __importDefault(require("lodash.omit"));
const lodash_pick_1 = __importDefault(require("lodash.pick"));
const socket_init_1 = __importDefault(require("./helpers/socket-init"));
const types_1 = require("./types");
const utils_1 = require("./utils");
const express_1 = require("express");
class Client {
    axiosInstance;
    options;
    auth;
    constructor(options) {
        this.options = options;
        this.axiosInstance = axios_1.default.create({
            baseURL: process.env.TEST_API_URL || "https://api.grapherjs.com",
        });
    }
    async token() {
        return new Promise((resolve, reject) => {
            this.axiosInstance
                .post("/token", {}, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${this.options.client_id}:${this.options.client_secret}`).toString("base64")}`,
                },
            })
                .then(({ data }) => {
                this.auth = data;
                resolve(data);
            })
                .catch(reject);
        });
    }
    async client() {
        if (!this.auth?.access_token) {
            return this.token();
        }
        try {
            const decoded = (0, jwt_decode_1.default)(this.auth.access_token);
            if (decoded <= Date.now()) {
                return Promise.resolve(this.auth);
            }
        }
        catch {
            return this.token();
        }
    }
    async log(req, res, { data, level = types_1.Level.DEBUG, tags }, cb) {
        try {
            await this.client();
        }
        catch (err) {
            return cb?.(undefined, err);
        }
        (0, utils_1.setResponseData)(res);
        const requestData = await (0, utils_1.extractRequestData)(req);
        res.once("finish", () => {
            setImmediate(async () => {
                const core = ["ip", "host", "method", "url"];
                const log = {
                    ...(0, lodash_pick_1.default)(requestData, core),
                    level,
                    tags,
                    metadata: (0, lodash_omit_1.default)(requestData, core),
                };
                log.metadata.data = data;
                if (res.locals.error) {
                    log.metadata.error = res.locals.error;
                    log.level = types_1.Level.ERROR;
                }
                if (res.locals.data) {
                    log.status_code = res.statusCode;
                    log.metadata.response = {
                        data: res.locals.data,
                    };
                }
                try {
                    const { data } = await this.axiosInstance.post("/v1/logs", log, {
                        headers: {
                            Authorization: `${this.auth.type} ${this.auth.access_token}`,
                        },
                    });
                    cb?.(data);
                }
                catch (err) {
                    cb?.(undefined, err);
                }
            });
        });
    }
    tracingHandler() {
        const self = this;
        return async (req, res, next) => {
            (0, express_1.json)()(req, res, async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    await this.client();
                }
                catch {
                    return next();
                }
                (0, utils_1.setResponseData)(res);
                const requestData = await (0, utils_1.extractRequestData)(req);
                (0, socket_init_1.default)(this.auth?.access_token);
                const startTime = process.hrtime();
                res.once("finish", () => {
                    setImmediate(async () => {
                        const core = ["ip", "host", "method", "url"];
                        const log = {
                            ...(0, lodash_pick_1.default)(requestData, core),
                            level: types_1.Level.DEBUG,
                            metadata: (0, lodash_omit_1.default)(requestData, core),
                        };
                        if (res.locals.error) {
                            log.metadata.error = res.locals.error;
                            log.level = types_1.Level.ERROR;
                        }
                        if (res.locals.data) {
                            log.status_code = res.statusCode;
                            log.metadata.response = {
                                data: res.locals.data,
                            };
                        }
                        const diff = process.hrtime(startTime);
                        const responseTime = (diff[0] * 1e3 + diff[1]) * 1e-6;
                        const category = Math.floor(res.statusCode / 100);
                        default_config_1.default.spans.forEach((span) => {
                            const last = span.responses[span.responses.length - 1];
                            if (last !== undefined && last.timestamp / 1000 + span.interval > Date.now() / 1000) {
                                last[category] += 1;
                                last.count += 1;
                                last.mean += (responseTime - last.mean) / last.count;
                            }
                            else {
                                span.responses.push({
                                    2: category === 2 ? 1 : 0,
                                    3: category === 3 ? 1 : 0,
                                    4: category === 4 ? 1 : 0,
                                    5: category === 5 ? 1 : 0,
                                    count: 1,
                                    mean: responseTime,
                                    timestamp: Date.now(),
                                });
                            }
                        });
                        await self.axiosInstance.post("/v1/logs", log, {
                            headers: {
                                Authorization: `${self.auth.type} ${self.auth.access_token}`,
                            },
                        });
                    });
                });
                next();
            });
        };
    }
    errorHandler() {
        return async function (err, _, res, next) {
            res.locals.error = (0, utils_1.extractErrorObject)(err);
            next(err);
        };
    }
    async search(q) {
        try {
            await this.client();
            const { data } = await this.axiosInstance.get(`/v1/logs?q=${q}`, {
                headers: {
                    Authorization: `${this.auth.type} ${this.auth.access_token}`,
                },
            });
            return data;
        }
        catch (err) {
            return {
                hits: [],
                nbhits: 0,
            };
        }
    }
}
exports.Client = Client;
