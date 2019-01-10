export class ConfigError extends Error {
    inner: any;

    path: string;

    configName: string;

    constructor(message: string, inner?: any) {
        super(message);
        this.inner = inner;
    }
}
