import { format as dojoFormatNumber } from "dojo/number";
import { format as dojoFormatDate } from "dojo/date/locale";
import { Formatter, compile as _compile } from "./StringFormat";

import { isNumber, isNull } from "../safe";

interface NumberFormatOptions {
    round?: number;
    pattern?: string;
}

function convertNumber(value: any, pattern: string) {
    if (isNumber(value)) {
        const nopt = {} as NumberFormatOptions;
        if (pattern.indexOf("!") === 0) {
            nopt.round = -1;
            pattern = pattern.substr(1);
        }
        nopt.pattern = pattern;

        return dojoFormatNumber(value, nopt);
    }
}

function convertDate(value: any, pattern: string) {
    if (value instanceof Date) {
        const m = pattern.match(/^(\w+)-(\w+)$/);
        if (m)
            return dojoFormatDate(value, {
                selector: m[2],
                formatLength: m[1]
            });
        else if (pattern === "iso")
            return value.toISOString();
        else
            return dojoFormatDate(value, {
                selector: "date",
                datePattern: pattern
            });
    }
}

const _formatter = new Formatter([convertNumber, convertDate]);

function format(msg: string, ...args: any[]) {
    return _formatter.format(msg, ...args);
}

function _convert(value: any, pattern: string) {
    return _formatter.convert(value, pattern);
}

namespace format {
    export const convert = _convert;
    export function compile(text: string) {
        const template = _compile(text);

        return (...data) => {
            return template((name, pattern) => {
                const value = data[name];
                return !isNull(value) ? convert(value, pattern) : "";
            });
        };
    }
}

export = format;
