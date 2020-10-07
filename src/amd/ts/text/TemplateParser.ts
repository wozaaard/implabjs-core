import { argumentNotEmptyString } from "../safe";
import { MapOf } from "../interfaces";
import { TraceSource, DebugLevel } from "../log/TraceSource";
import m = require("module");

const trace = TraceSource.get(m.id);

const splitRx = /(<%=|<%~|\[%~|\[%=|<%|\[%|%\]|%>)/;

export enum TokenType {
    None,
    Text,
    OpenInlineBlock,
    OpenFilterBlock,
    OpenBlock,
    CloseBlock
}

const tokenMap: MapOf<TokenType> = {
    "<%": TokenType.OpenBlock,
    "[%": TokenType.OpenBlock,
    "<%=": TokenType.OpenInlineBlock,
    "[%=": TokenType.OpenInlineBlock,
    "<%~": TokenType.OpenFilterBlock,
    "[%~": TokenType.OpenFilterBlock,
    "%>": TokenType.CloseBlock,
    "%]": TokenType.CloseBlock
};

export interface ITemplateParser {
    next(): boolean;
    token(): TokenType;
    value(): string;
}

export class TemplateParser implements ITemplateParser {

    _tokens: string[];
    _pos = -1;
    _type: TokenType;
    _value: string | undefined;

    constructor(text: string) {
        argumentNotEmptyString(text, "text");

        this._tokens = text.split(splitRx);
        this._type = TokenType.None;
    }

    next() {
        this._pos++;
        if (this._pos < this._tokens.length) {
            this._value = this._tokens[this._pos];
            this._type = tokenMap[this._value] || TokenType.Text;

            return true;
        } else {
            this._type = TokenType.None;
            this._value = undefined;
            return false;
        }
    }

    token() {
        return this._type;
    }

    value() {
        if (this._value === undefined)
            throw new Error("The current token doesn't have a value");
        return this._value;
    }

}
