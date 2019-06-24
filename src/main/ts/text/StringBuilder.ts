import { TextWriterBase } from "./TextWriterBase";
import { Converter } from "./Converter";

export class StringBuilder extends TextWriterBase {
    private _data = new Array<string>();

    constructor(converter = Converter.default) {
        super(converter);
    }

    writeText(text: string) {
        this._data.push(text);
    }

    toString() {
        return this._data.join("");
    }

    clear() {
        this._data.length = 0;
    }
}

const sb = new StringBuilder();

export function format(format: string, ...args: any): string;
export function format() {
    sb.clear();
    sb.write.apply(sb, arguments);
    return sb.toString();
}
