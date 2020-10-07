export class ConfigError {
    inner?: {};

    message: string;

    path?: string;

    configName?: string;

    constructor(message: string, inner?: {}) {
        this.message = message;
        this.inner = inner;
    }
}
