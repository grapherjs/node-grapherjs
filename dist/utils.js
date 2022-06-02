"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractErrorObject = exports.extractRequestData = exports.setResponseData = void 0;
const cookie_1 = __importDefault(require("cookie"));
const lodash_isempty_1 = __importDefault(require("lodash.isempty"));
const url_1 = __importDefault(require("url"));
const request_ip_1 = require("request-ip");
const setResponseData = async (res) => {
    const oldSend = res.send;
    res.send = function (data) {
        res.send = oldSend;
        if (!res.locals) {
            res.locals = {};
        }
        res.locals.data = data;
        return res.send(data);
    };
};
exports.setResponseData = setResponseData;
const extractRequestData = async (req, keys = []) => {
    const requestData = {};
    const headers = req.headers || req.header || {};
    requestData.headers = headers;
    requestData.body = req.body;
    requestData.host = req.hostname || req.host || "<no host>";
    requestData.ip = (0, request_ip_1.getClientIp)(req) || "";
    requestData.method = req.method;
    requestData.url = `${req.protocol}://${req.hostname || req.host || "<no host>"}${req.path || ""}`;
    requestData.cookies = req.cookies || cookie_1.default.parse(headers.cookie || "");
    const query = req.query || url_1.default.parse(req.originalUrl || req.url || "" || "", false).query;
    if (!(0, lodash_isempty_1.default)(query)) {
        requestData.query = req.query || url_1.default.parse(req.originalUrl || req.url || "" || "", false).query;
    }
    keys.forEach(async (key) => {
        if ({}.hasOwnProperty.call(req, key)) {
            requestData[key] = req[key];
        }
    });
    return requestData;
};
exports.extractRequestData = extractRequestData;
const extractErrorObject = (error) => {
    try {
        return Object.getOwnPropertyNames(error).reduce((acc, cur) => ({
            ...acc,
            [cur]: error[cur],
        }), {});
    }
    catch { }
};
exports.extractErrorObject = extractErrorObject;
