export class ConfigError extends Error {
    inner;

    path: string;

    configName: string;

    constructor(message: string, inner?) {
        super(message);
        this.inner = inner;
    }
}
