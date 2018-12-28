import { isPrimitive, isNull, each } from "../safe";
import { MapOf } from "../interfaces";

type SubstFn = (name: string, format?: string) => string;
type TemplateFn = (subst: SubstFn) => string;
type ConvertFn = (value: any, format?: string) => string;

const map = {
    "\\{": "&curlopen;",
    "\\}": "&curlclose;",
    "&": "&amp;",
    "\\:": "&colon;"
};

const rev = {
    curlopen: "{",
    curlclose: "}",
    amp: "&",
    colon: ":"
};

function espaceString(s: string) {
    if (!s)
        return s;
    return "'" + s.replace(/('|\\)/g, "\\$1").replace("\n", "\\n") + "'";
}

function encode(s: string) {
    if (!s)
        return s;
    return s.replace(/\\{|\\}|&|\\:|\n/g, m => map[m] || m);
}

function decode(s: string) {
    if (!s)
        return s;
    return s.replace(/&(\w+);/g, (m, $1) => rev[$1] || m);
}

function subst(s: string) {
    const i = s.indexOf(":");
    let name: string;
    let pattern: string;
    if (i >= 0) {
        name = s.substr(0, i);
        pattern = s.substr(i + 1);
    } else {
        name = s;
    }

    if (pattern)
        return [
            espaceString(decode(name)),
            espaceString(decode(pattern))];
    else
        return [espaceString(decode(name))];
}

function _compile(str: string) {
    if (!str)
        return () => void 0;

    const chunks = encode(str).split("{");
    let chunk: string;

    const code = ["var result=[];"];

    for (let i = 0; i < chunks.length; i++) {
        chunk = chunks[i];

        if (i === 0) {
            if (chunk)
                code.push("result.push(" + espaceString(decode(chunk)) +
                    ");");
        } else {
            const len = chunk.indexOf("}");
            if (len < 0)
                throw new Error("Unbalanced substitution #" + i);

            code.push("result.push(subst(" +
                subst(chunk.substr(0, len)).join(",") + "));");
            if (chunk.length > len + 1)
                code.push("result.push(" +
                    espaceString(decode(chunk.substr(len + 1))) + ");");
        }
    }

    code.push("return result.join('');");

    // the code for this function is generated from the template
    // tslint:disable-next-line:function-constructor
    return new Function("subst", code.join("\n")) as TemplateFn;
}

const cache: MapOf<TemplateFn> = {};

export function compile(template: string) {
    let compiled = cache[template];
    if (!compiled) {
        compiled = _compile(template);
        cache[template] = compiled;
    }
    return compiled;
}

function defaultConverter(value: any, pattern: string) {
    if (pattern && pattern.toLocaleLowerCase() === "json") {
        const seen = [];
        return JSON.stringify(value, (k, v) => {
            if (!isPrimitive(v)) {
                const id = seen.indexOf(v);
                if (id >= 0)
                    return "@ref-" + id;
                else {
                    seen.push(v);
                    return v;
                }
            } else {
                return v;
            }
        }, 2);
    } else if (isNull(value)) {
        return "";
    } else if (value instanceof Date) {
        return value.toISOString();
    } else {
        return pattern ? value.toString(pattern) : value.toString();
    }
}

export class Formatter {
    _converters: ConvertFn[];

    constructor(converters?: ConvertFn[]) {
        this._converters = converters || [];
        this._converters.push(defaultConverter);
    }

    convert(value: any, pattern: string) {
        for (const c of this._converters) {
            const res = c(value, pattern);
            if (!isNull(res))
                return res;
        }
        return "";
    }

    format(msg: string, ...args: any[]) {
        const template = compile(msg);

        return template((name, pattern) => {
            const value = args[name];
            return !isNull(value) ? this.convert(value, pattern) : "";
        });

    }

    compile(msg: string) {
        const template = compile(msg);
        return (...args: any[]) => {
            return template((name, pattern) => {
                const value = args[name];
                return !isNull(value) ? this.convert(value, pattern) : "";
            });
        };
    }
}

const _default = new Formatter();

export function format(msg: string, ...args: any[]) {
    return _default.format(msg, ...args);
}
