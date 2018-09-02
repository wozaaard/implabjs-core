declare interface ILog {
    debug(...args: any[]): void;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

declare module "@implab/core/log/trace!*" {
    const channel: ILog;

    export = channel;
}