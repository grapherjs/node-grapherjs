import axios, { AxiosInstance } from "axios";
import omit from "lodash.omit";
import pick from "lodash.pick";
import { ClientOptions, LogOptions, SearchResponse, Level } from "./types";
import { extractErrorObject, extractRequestData, setResponseData } from "./utils";
import { json, NextFunction, Request, Response } from "express";

export class Client {
  private axiosInstance: AxiosInstance;
  private options: ClientOptions;

  constructor(options: ClientOptions) {
    this.options = options;
    this.axiosInstance = axios.create({
      baseURL: process.env.TEST_API_URL || "https://api.grapherjs.com/api",
    });
  }

  async client(): Promise<{ access_token: string; type: string } | null> {
    return new Promise((resolve, reject) => {
      this.axiosInstance
        .post(
          "/v1/token",
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
        if (err) {
          throw err;
        }

        setResponseData(res);
        const requestData = await extractRequestData(req);

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

            try {
              const auth = await self.client();

              if (!auth) {
                throw new Error("Invalid token");
              }

              const { access_token, type } = auth!;

              await self.axiosInstance.post("/v1/logs", log, {
                headers: {
                  Authorization: `${type} ${access_token}`,
                },
              });
            } catch (err) {}
          });
        });

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

  async search(q: string): Promise<SearchResponse> {
    try {
      const auth = await this.client();

      if (!auth) {
        throw new Error("Invalid token");
      }

      const { access_token, type } = auth!;

      const { data } = await this.axiosInstance.get(`/v1/logs?q=${q}`, {
        headers: {
          Authorization: `${type} ${access_token}`,
        },
      });

      return data;
    } catch (err: any) {
      return {
        logs: [],
        total: 0,
      };
    }
  }
}
