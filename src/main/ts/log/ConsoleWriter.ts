import { TextWriterBase } from "../text/TextWriterBase";
import { isNull, isNullOrEmptyString, isPrimitive } from "../safe";
import { NullConsole } from "./NullConsole";

interface LogConsole {
    debug(...args: any[]): void;
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

function hasConsole() {
    try {
        // tslint:disable-next-line:no-console
        return (typeof console !== "undefined" && typeof console.log === "function");
    } catch {
        return false;
    }
}

function getConsole() {
    return hasConsole() ? console : NullConsole.instance;
}

export class ConsoleWriter extends TextWriterBase {
    static readonly default = new ConsoleWriter(getConsole());

    private _buffer: any[];

    private _out: LogConsole;
    private _level: keyof LogConsole;

    constructor(out?: LogConsole) {
        super();
        this._out = out || NullConsole.instance;
        this._buffer = [];
        this._level = "log";
    }

    getLogLevel() {
        return this._level;
    }

    setLogLevel(level: keyof LogConsole) {
        this._level = level;
    }

    /** Flushes the buffer to the console
     */
    writeNewLine() {
        // group text chunks together, and let objects as is
        // ['a', 'b', {foo: 'bar'}, 'c', 'd'] -> ['ab', {foo: 'bar'}, 'cd']
        // this will prevent from additional spaces to occur in the console
        // ['a', 'b'] will be printed as 'a b' rather then 'ab'.

        // console.log("writeLine", this._buffer);

        let offset = 0;
        const args = [];
        this._buffer.forEach((v, i) => {
            if (!isPrimitive(v)) {
                if (offset < i)
                    args.push(i - offset > 1 ? this._buffer.slice(offset, i).join("") : this._buffer[offset]);
                args.push(v);
                offset = i + 1;
            }
        });
        if (offset < this._buffer.length)
            args.push(this._buffer.slice(offset).join(""));

        // console.log("WriteLine", args);

        this._out[this._level].apply(this._out, args);

        this._buffer = [];
    }

    /** Adds a text chunk to the buffer. Buffer contents will be flushed when
     * the end of line will be printed.
     *
     * @param text The text to be added to the buffer.
     */
    writeText(text: string) {
        this._buffer.push(text);
    }

    /** Wrotes the specified value to the buffer.
     *
     * @param value The value to be added to the buffer
     * @param spec The instructions how to format the value, is this parameter
     *             is ommited the raw value will be added to the buffer and
     *             passed directly to the console out.
     */
    writeValue(value: any, spec?: string) {
        if (isNullOrEmptyString(spec))
            this._buffer.push(value);
        else
            super.writeValue(value);
    }
}
