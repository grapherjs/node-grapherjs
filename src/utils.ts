import cookie from "cookie";
import isEmpty from "lodash.isempty";
import url from "url";
import { getClientIp } from "request-ip";
import { Request, Response } from "express";
import { RequestData } from "./types";

/**
 * Set response data on res.locals.data
 * @param res { Express.Response }
 */
export const setResponseData = async (res: Response) => {
  const oldSend = res.send;

  res.send = function (data: any) {
    res.send = oldSend;

    if (!res.locals) {
      res.locals = {};
    }

    res.locals.data = data;

    return res.send(data);
  };
};

export const extractRequestData = async (req: Request, keys: string[] = []) => {
  const requestData: RequestData = {};

  // const body = await bodyParser(req);
  const headers = req.headers || req.header || {};

  requestData.headers = headers;
  requestData.body = req.body;
  requestData.host = req.hostname || req.host || "<no host>";
  requestData.ip = getClientIp(req) || "";
  requestData.method = req.method;
  requestData.url = `${req.protocol}://${req.hostname || req.host || "<no host>"}${req.path || ""}`;
  requestData.cookies = req.cookies || cookie.parse(headers.cookie || "");

  const query = req.query || url.parse(req.originalUrl || req.url || "" || "", false).query;

  if (!isEmpty(query)) {
    requestData.query = req.query || url.parse(req.originalUrl || req.url || "" || "", false).query;
  }

  keys.forEach(async (key) => {
    if ({}.hasOwnProperty.call(req, key)) {
      requestData[key] = (req as { [key: string]: any })[key];
    }
  });

  return requestData;
};

export const extractErrorObject = (error: Error) => {
  try {
    return Object.getOwnPropertyNames(error).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: error[cur],
      }),
      {}
    );
  } catch {}
};
