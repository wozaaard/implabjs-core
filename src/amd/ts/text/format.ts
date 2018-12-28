import { format as dojoFormatNumber } from "dojo/number";
import { format as dojoFormatDate } from "dojo/date/locale";
import { Formatter } from "./StringFormat";

import { isNumber } from "../safe";

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

export = function format(msg: string, ...args: any[]) {
    return _formatter.format.apply(msg, ...args);
};
