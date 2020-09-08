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
    private _tokenType: TokeType | undefined;
    private _tokenValue: string | undefined;
    private _rx = /[^{}:]+|(.)/g;

    constructor(text: string) {
        argumentNotEmptyString(text, text);
        this._text = text;
    }

    next() {
        if (this._rx.lastIndex >= this._text.length)
            return false;

        const match = this._rx.exec(this._text);
        if (match === null)
            return false;

        this._tokenType = typeMap[match[1]] || TokeType.Text;
        this._tokenValue = match[0];

        return true;
    }

    getTokenValue() {
        if (this._tokenValue === undefined)
            throw new Error("The scanner is before the first element");
        return this._tokenValue;
    }

    getTokenType() {

        if (this._tokenType === undefined)
            throw new Error("The scanner is before the first element");
        return this._tokenType;
    }
}
