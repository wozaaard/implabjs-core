import request = require("dojo/request");
import m = require("module");
import { TraceSource } from "../log/TraceSource";
import { TemplateCompiler } from "./TemplateCompiler";
import { TemplateParser } from "./TemplateParser";
import { isNullOrEmptyString } from "../safe";
import { MapOf } from "../interfaces";

type TemplateFn = (obj: object) => string;

const trace = TraceSource.get(m.id);

function compile(str: string) {
    if (isNullOrEmptyString(str))
        return () => "";

    const parser = new TemplateParser(str);
    const compiler = new TemplateCompiler();

    return compiler.compile(parser);
}

const cache: MapOf<TemplateFn> = {};

interface OnLoadFn<T> {
    (res: T): void;
    error(e: any): void;
}

compile.load = (id: string, require: Require, callback: OnLoadFn<TemplateFn>) => {
    const url = require.toUrl(id);
    if (url in cache) {
        trace.debug("{0} -> {1}: cached", id, url);
        callback(cache[url]);
    } else {
        trace.debug("{0} -> {1}: load", id, url);
        request<string>(url).then(compile).then((tc: TemplateFn) => {
            trace.debug("{0}: compiled", url);
            callback(cache[url] = tc);
        }, (err: any) => {
            if (callback.error)
                callback.error({
                    inner: err,
                    from: "@implab/core/text/template-compile"
                });
            else
                trace.error({
                    message: `Failed to load: ${url}`,
                    error: err,
                    from: "@implab/core/text/template-compile"
                });
        });
    }
};

export = compile;
