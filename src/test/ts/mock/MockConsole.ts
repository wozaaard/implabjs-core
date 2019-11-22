import {NullConsole} from "../log/NullConsole";

interface ConsoleLineData {
    level: string;
    data: any[];
}

export class MockConsole extends NullConsole {
    _buffer: ConsoleLineData[] = [];

    debug(...args: any[]) {
        this._buffer.push({
            level: "debug",
            data: args
        });
    }

    log(...args: any[]) {
        this._buffer.push({
            level: "log",
            data: args
        });
    }

    warn(...args: any[]) {
        this._buffer.push({
            level: "warn",
            data: args
        });
    }

    error(...args: any[]) {
        this._buffer.push({
            level: "error",
            data: args
        });
    }

    getBuffer() {
        return this._buffer;
    }

    getLine(i: number) {
        if (i >= this._buffer.length)
            throw new Error(`Line number ${i} is out of range, buffer.length = ${this._buffer.length}`);
        return this._buffer[i].data;
    }

    clear() {
        this._buffer = [];
    }
}
