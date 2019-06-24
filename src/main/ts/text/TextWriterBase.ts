import { TextWriter } from "../interfaces";
import { FormatCompiler } from "./FormatCompiler";
import { isString, argumentNotNull } from "../safe";
import { Converter } from "./Converter";

const compiler = new FormatCompiler();

export abstract class TextWriterBase implements TextWriter {
    private _converter: Converter;

    constructor(converter = Converter.default) {
        argumentNotNull(converter, "converter");
        this._converter = converter;
    }

    writeNewLine() {
        this.writeValue("\n");
    }

    write(obj: any): void;
    write(format: string, ...args: any[]): void;
    write(format: any, ...args: any[]): void {
        if (args.length) {
            const compiled = compiler.compile(format);
            compiled(this, args);
        } else {
            this.writeValue(format);
        }
    }

    writeLine(obj?: any): void;
    writeLine(format: string, ...args: any[]): void;
    writeLine(): void {
        if (arguments.length)
            this.write.apply(this, arguments);
        this.writeNewLine();
    }

    writeValue(value: any, spec?: string): void {
        this.writeText(
            isString(value) ?
                value :
                this._converter.convert(value, spec)
        );
    }

    abstract writeText(text: string);
}
