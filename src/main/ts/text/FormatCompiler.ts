import { FormatScanner, TokeType } from "./FormatScanner";

export class FormatCompiler {

    visitText(scanner: FormatScanner) {
        while (scanner.next()) {
            if (scanner.getTokenType() === TokeType.CurlOpen)
                this.visitCurlOpen(scanner);
        }
    }

    visitCurlOpen(scanner: FormatScanner) {
        if (scanner.next()) {
            if (scanner.getTokenType() === TokeType.CurlOpen)
                this.pushText("{");
            else
                this.visitTemplateSubst(scanner);

        }
    }

    visitTemplateSubst(scanner: FormatScanner) {
        if (scanner.getTokenType() !== TokeType.Text)
            this.dieUnexpectedToken(scanner);

        const fieldName = scanner.getTokenValue();
        let filedFormat: string;
        if (this.readColon(scanner)) {
            filedFormat = this.readFieldFormat(scanner);
        } else {
            if (scanner.getTokenType() !== TokeType.CurlClose)
                this.dieUnexpectedToken(scanner);
        }

        this.pushSubst(fieldName, filedFormat);
    }

    pushSubst(fieldName: string, filedFormat: string) {
        throw new Error("Method not implemented.");
    }

    readFieldFormat(scanner: FormatScanner): string {
        throw new Error("Method not implemented.");
    }

    readColon(scanner: FormatScanner) {
        if (!scanner.next())
            this.dieUnexpectedEnd();
        if (scanner.getTokenType() !== TokeType.Colon)
            return false;

    }

    pushText(text: string) {

    }

    dieUnexpectedToken(scanner: FormatScanner) {
        throw new Error(`Unexpected token ${scanner.getTokenValue()}`);
    }

    dieUnexpectedEnd() {
        throw new Error("Unexpected end of string");
    }
}
