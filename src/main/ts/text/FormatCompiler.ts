import { FormatScanner, TokeType } from "./FormatScanner";
import { isNullOrEmptyString } from "../safe";
import { TextWriter } from "../interfaces";

export class FormatCompiler {
    _scanner: FormatScanner;

    _parts: [];

    compile() {
        return (writer: TextWriter, args: any) => {
            this._parts.forEach(x => writer.WriteValue(x))
        };
    }

    visitText() {
        while (this._scanner.next()) {
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
            if (this._scanner.getTokenType() === TokeType.CurlOpen)
                this.visitCurlOpen();
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
        if (this._scanner.next()) {
            if (this._scanner.getTokenType() === TokeType.CurlOpen)
                this.pushText("{");
            else
                this.visitTemplateSubst();
        }
    }

    visitTemplateSubst() {
        if (this._scanner.getTokenType() !== TokeType.Text)
            this.dieUnexpectedToken("TEXT");

        const fieldName = this._scanner.getTokenValue();
        const filedFormat = this.readColon() && this.readFieldFormat();

        this.pushSubst(fieldName, filedFormat);
    }

    readFieldFormat() {
        const parts = new Array<string>();
        while (this._scanner.next()) {
            if (this._scanner.getTokenType() === TokeType.CurlClose) {
                return parts.join("");
            } else {
                parts.push(this._scanner.getTokenValue());
            }
        }

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

    }

    pushText(text: string) {

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
