import { Request, Response } from "express";
export declare const setResponseData: (res: Response) => Promise<void>;
export declare const extractRequestData: (req: Request, keys?: string[]) => Promise<Partial<{
    body: Record<string, any>;
    ip: string;
    headers: Record<string, any>;
    host: string;
    protocol: string;
    method: string;
    originalUrl: string;
    path: string;
    url: string;
    cookies: string;
    query: Record<string, any>;
}>>;
export declare const extractErrorObject: (error: Error) => {} | undefined;
