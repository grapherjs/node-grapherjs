import axios, { AxiosInstance } from "axios";
import defaultConifg from "./helpers/default-config";
import omit from "lodash.omit";
import pick from "lodash.pick";
import socketInit from "./helpers/socket-init";
import { ClientOptions, Level, LogOptions, SearchOptions, SearchResponse } from "./types";
import { extractErrorObject, extractRequestData, setResponseData } from "./utils";
import { json, NextFunction, Request, Response } from "express";

export class Client {
  private axiosInstance: AxiosInstance;
  private options: ClientOptions;

  constructor(options: ClientOptions) {
    this.options = options;
    this.axiosInstance = axios.create({
      baseURL: process.env.TEST_API_URL || "https://api.grapherjs.com",
    });
  }

  async client(): Promise<{ access_token: string; type: string } | null> {
    return new Promise((resolve, reject) => {
      this.axiosInstance
        .post(
          "/token",
          {},
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${this.options.client_id}:${this.options.client_secret}`
              ).toString("base64")}`,
            },
          }
        )
        .then(({ data }) => {
          resolve(data);
        })
        .catch(reject);
    });
  }

  async record(
    { data, level = Level.DEBUG, tags }: LogOptions,
    cb?: (data?: any, error?: Error) => any
  ) {
    try {
      const auth = await this.client();

      if (!auth) {
        cb?.(undefined, new Error("Invalid token"));
      }

      const { access_token, type } = auth!;

      const response = await this.axiosInstance.post(
        "/v1/logs",
        { level, tags, metadata: { data } },
        {
          headers: {
            Authorization: `${type} ${access_token}`,
          },
        }
      );

      cb?.(response.data);
    } catch (err: any) {
      cb?.(undefined, err);
    }
  }

  async log(
    req: Request,
    res: Response,
    { data, level = Level.DEBUG, tags }: LogOptions,
    cb?: (data?: any, error?: Error) => any
  ) {
    setResponseData(res);

    const requestData = await extractRequestData(req);

    res.once("finish", () => {
      setImmediate(async () => {
        const core = ["ip", "host", "method", "url"];

        const log: Record<string, any> = {
          ...pick(requestData, core),
          level,
          tags,
          metadata: omit(requestData, core),
        };

        log.metadata.data = data;

        if (res.locals.error) {
          log.metadata.error = res.locals.error;
          log.level = Level.ERROR;
        }

        if (res.locals.data) {
          log.status_code = res.statusCode;
          log.metadata.response = {
            data: res.locals.data,
          };
        }

        try {
          const auth = await this.client();

          if (!auth) {
            cb?.(undefined, new Error("Invalid token"));
          }

          const { access_token, type } = auth!;

          const { data } = await this.axiosInstance.post("/v1/logs", log, {
            headers: {
              Authorization: `${type} ${access_token}`,
            },
          });

          cb?.(data);
        } catch (err: any) {
          cb?.(undefined, err);
        }
      });
    });
  }

  tracingHandler() {
    const self = this;

    return async (req: Request, res: Response, next: NextFunction) => {
      json()(req, res, async (err) => {
        try {
          if (err) {
            throw err;
          }

          const auth = await self.client();

          if (!auth) {
            throw new Error("Invalid token");
          }

          const { access_token, type } = auth;

          setResponseData(res);
          const requestData = await extractRequestData(req);

          // ************* APM *************
          socketInit(access_token);
          const startTime = process.hrtime();
          // *******************************

          res.once("finish", () => {
            setImmediate(async () => {
              const core = ["ip", "host", "method", "url"];

              const log: Record<string, any> = {
                ...pick(requestData, core),
                level: Level.DEBUG,
                metadata: omit(requestData, core),
              };

              if (res.locals.error) {
                log.metadata.error = res.locals.error;
                log.level = Level.ERROR;
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

              defaultConifg.spans.forEach((span) => {
                const last = span.responses[span.responses.length - 1];

                if (
                  last !== undefined &&
                  last.timestamp / 1000 + span.interval > Date.now() / 1000
                ) {
                  last[category] += 1;
                  last.count += 1;
                  last.mean += (responseTime - last.mean) / last.count;
                } else {
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

              try {
                await self.axiosInstance.post("/v1/logs", log, {
                  headers: {
                    Authorization: `${type} ${access_token}`,
                  },
                });
              } catch (err: any) {
                console.log(err?.response?.data.errors);
              }
            });
          });
        } catch (err) {
          console.log(err);
        }

        next();
      });
    };
  }

  errorHandler() {
    return async function (err: Error, _: Request, res: Response, next: NextFunction) {
      res.locals.error = extractErrorObject(err);

      next(err);
    };
  }

  async search(q: string | SearchOptions): Promise<SearchResponse> {
    try {
      const auth = await this.client();

      if (!auth) {
        throw new Error("Invalid token");
      }

      const { access_token, type } = auth;

      if (typeof q === "string") {
        const { data } = await this.axiosInstance.get(`/v1/logs?q=${q}`, {
          headers: {
            Authorization: `${type} ${access_token}`,
          },
        });

        return data;
      }

      const queryString = Object.keys(q)
        .map((key, i) => {
          if (i === 0) {
            return `?${key}=${q[key]}`;
          }

          if (key === "unitl" || key === "from") {
            return `${key}=${(new Date(q[key]).valueOf() / 1000).toFixed(0)}`;
          }

          return `${key}=${q[key]}`;
        })
        .join("&");

      const { data } = await this.axiosInstance.get(`/v1/logs?${queryString}`, {
        headers: {
          Authorization: `${type} ${access_token}`,
        },
      });

      return data;
    } catch (err: any) {
      return {
        hits: [],
        nbhits: 0,
      };
    }
  }
}
