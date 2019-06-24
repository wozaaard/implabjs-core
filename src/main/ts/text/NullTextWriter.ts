import { TextWriter } from "../interfaces";

export class NullTextWriter implements TextWriter {
    static readonly instance = new NullTextWriter();

    write(obj: any): void;
    write(format: string, ...args: any[]): void;
    write() {
    }

    writeLine(obj: any): void;
    writeLine(format: string, ...args: any[]): void;
    writeLine() {
    }

    writeValue(value: any, spec?: string): void;
    writeValue() {
    }
}
