import { isPrimitive, isNumber, isNull } from "../safe";

type SubstFn = (name: string, format?: string) => string;
type FormatFn = (subst: SubstFn) => string;
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
    return new Function("subst", code.join("\n")) as FormatFn;
}

const cache = {} as {
    [i: string]: FormatFn
};

export function compile(template: string) {
    let compiled = cache[template];
    if (!compiled) {
        compiled = _compile(template);
        cache[template] = compiled;
    }
    return compiled;
}

function convert(value: any, pattern) {
    if (!pattern)
        return value.toString();

    if (pattern.toLocaleLowerCase() === "json") {
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
    }

    defaultFormatter(value, pattern);
}

function defaultFormatter(value: any, pattern: string) {
    if (value instanceof Date) {
        return value.toISOString();
    } else {
        return value.toString(pattern);
    }
}

export function format(fmt: string, ...args: any[]) {
    if (args.length === 0)
        return fmt;

    const template = compile(fmt);

    return template((name, pattern) => {
        const value = args[name];
        return !isNull(value) ? convert(value, pattern) : "";
    });
}

export function compileFormat(fmt: string) {
    const template = compile(fmt);

    return (...args: any[]) => {
        return template((name, pattern) => {
            const value = args[name];
            return !isNull(value) ? convert(value, pattern) : "";
        });
    };
}
