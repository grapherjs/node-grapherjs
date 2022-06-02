import { ClientOptions, LogOptions, SearchResponse } from "./types";
import { NextFunction, Request, Response } from "express";
export declare class Client {
    private axiosInstance;
    private options;
    auth: {
        access_token: string;
        type: string;
    };
    constructor(options: ClientOptions);
    private token;
    client(): Promise<{
        access_token: string;
        type: string;
    } | undefined>;
    log(req: Request, res: Response, { data, level, tags }: LogOptions, cb?: (data?: any, error?: Error) => any): Promise<any>;
    tracingHandler(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    errorHandler(): (err: Error, _: Request, res: Response, next: NextFunction) => Promise<void>;
    search(q: string): Promise<SearchResponse>;
}
