import { FormatScanner, TokeType } from "./FormatScanner";
import { isNullOrEmptyString, isPrimitive, get } from "../safe";
import { TextWriter, MapOf } from "../interfaces";

type CompiledPattern = (writer: TextWriter, args: any) => void;

export class FormatCompiler {
    _scanner: FormatScanner;
    _cache: MapOf<CompiledPattern> = {};

    _parts: Array<string | { name: string; format: string; }>;

    compile(pattern: string) {
        let compiledPattern = this._cache && this._cache[pattern];
        if (!compiledPattern) {
            this._scanner = new FormatScanner(pattern);
            this._parts = [];

            this.visitText();
            const parts = this._parts;

            compiledPattern = (writer: TextWriter, args: any) => {
                parts.forEach(x => {
                    if (isPrimitive(x))
                        writer.writeValue(x);
                    else
                        writer.writeValue(get(x.name, args), x.format);
                });
            };
            if (this._cache)
                this._cache[pattern] = compiledPattern;
        }
        return compiledPattern;
    }

    visitText() {
        while (this._scanner.next()) {
            // console.log(this._scanner.getTokenType(), this._scanner.getTokenValue());
            switch (this._scanner.getTokenType()) {
                case TokeType.CurlOpen:
                    this.visitCurlOpen();
                    break;
                case TokeType.CurlClose:
                    this.visitCurlClose();
                    break;
                default:
                    this.pushText(this._scanner.getTokenValue());
            }
        }
    }

    visitCurlClose() {
        if (!this._scanner.next())
            this.dieUnexpectedEnd("}");
        if (this._scanner.getTokenType() !== TokeType.CurlClose)
            this.dieUnexpectedToken("}");
        this.pushText("}");
    }

    visitCurlOpen() {
        if (!this._scanner.next())
            this.dieUnexpectedEnd("{ | TEXT");

        if (this._scanner.getTokenType() === TokeType.CurlOpen)
            this.pushText("{");
        else
            this.visitTemplateSubst();

    }

    visitTemplateSubst() {
        if (this._scanner.getTokenType() !== TokeType.Text)
            this.dieUnexpectedToken("TEXT");

        const fieldName = this._scanner.getTokenValue();
        const filedFormat = this.readColon() ? this.readFieldFormat() : null;

        if (this._scanner.getTokenType() !== TokeType.CurlClose)
            this.dieUnexpectedToken("}");

        this.pushSubst(fieldName, filedFormat);
    }

    readFieldFormat() {
        const parts = new Array<string>();
        do {
            if (this._scanner.getTokenType() === TokeType.CurlClose) {
                return parts.join("");
            } else {
                parts.push(this._scanner.getTokenValue());
            }
        } while (this._scanner.next());

        this.dieUnexpectedEnd("}");
    }

    readColon() {
        if (!this._scanner.next())
            this.dieUnexpectedEnd();
        if (this._scanner.getTokenType() !== TokeType.Colon)
            return false;
        if (!this._scanner.next())
            this.dieUnexpectedEnd();
        return true;
    }

    pushSubst(fieldName: string, filedFormat: string) {
        // console.log("pushSubst ", fieldName, filedFormat);
        this._parts.push({ name: fieldName, format: filedFormat });
    }

    pushText(text: string) {
        this._parts.push(text);
    }

    dieUnexpectedToken(expected?: string) {
        throw new Error(isNullOrEmptyString(expected) ?
            `Unexpected token ${this._scanner.getTokenValue()}` :
            `Unexpected token ${this._scanner.getTokenValue()}, expected ${expected}`
        );
    }

    dieUnexpectedEnd(expected?: string) {
        throw new Error(isNullOrEmptyString(expected) ? "Unexpected end of the string" : `Unexpected end of the string, expected ${expected}`);
    }
}
