import { argumentNotEmptyString } from "../safe";
import { MapOf } from "../interfaces";

export const enum TokeType {
    CurlOpen = 1,
    CurlClose = 2,
    Colon = 3,
    Text = 4
}

const typeMap = {
    "{": TokeType.CurlOpen,
    "}": TokeType.CurlClose,
    ":": TokeType.Colon
} as MapOf<TokeType>;

export class FormatScanner {
    private _text: string;
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
