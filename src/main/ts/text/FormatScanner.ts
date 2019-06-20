import { argumentNotEmptyString } from "../safe";
import { MapOf } from "../interfaces";

export const enum TokeType {
    CurlOpen,
    CurlClose,
    Colon,
    Text
}

const typeMap = {
    "{": TokeType.CurlOpen,
    "}": TokeType.CurlClose,
    ":": TokeType.Colon
} as MapOf<TokeType>;

export class FormatScanner {
    private _text: string;
    private _pos: number;
    private _tokenType: TokeType;
    private _tokenValue: string;
    private _rx = /[^{}:]+|(.)/g;

    constructor(text: string) {
        argumentNotEmptyString(text, text);
        this._text = text;
    }

    next() {
        if (this._rx.lastIndex >= this._text.length)
            return false;
        this._pos = this._rx.lastIndex;

        const match = this._rx.exec(this._text);
        this._tokenType = typeMap[match[1]] || TokeType.Text;
        this._tokenValue = match[0];

        return true;
    }

    getTokenValue() {
        return this._tokenValue;
    }

    getTokenType() {
        return this._tokenType;
    }
}
