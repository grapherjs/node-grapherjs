export declare enum Level {
    EMERGENCY = "EMERGENCY",
    ALERT = "ALERT",
    CRITICAL = "CRITICAL",
    ERROR = "ERROR",
    WARNING = "WARNING",
    NOTICE = "NOTICE",
    INFO = "INFO",
    DEBUG = "DEBUG"
}
export declare type ClientOptions = {
    client_id: string;
    client_secret: string;
    health_checks?: {
        protocol: string;
        host: string;
        port: number;
    }[];
};
export declare type SearchResponse = {
    hits: Partial<Core>[];
    nbhits: number;
};
export declare type Core = {
    ip: string;
    host: string;
    method: string;
    url: string;
    level: Level;
    tags: string[];
    metadata: Metadata;
};
export interface Metadata extends StrictMetadata {
    [k: string]: any;
}
export interface StrictMetadata {
    headers: Record<string, any>;
    protocol: string;
    path: string;
    originalUrl: string;
    cookies: string;
    query: Record<string, any>;
    body: Record<string, any>;
}
export declare type RequestData = Partial<{
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
}>;
export declare type LogOptions = {
    data: string | Record<string, any>;
    level?: Level;
    tags?: string[];
};
