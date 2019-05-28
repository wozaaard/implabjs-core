import { Uuid } from "../Uuid";
import { argumentNotEmptyString, getGlobal } from "../safe";
import { TraceSource } from "../log/TraceSource";
import m = require("module");

const sandboxId = Uuid();
define(sandboxId, ["require"], r => r);

const globalRequire = getGlobal().require as Require || requirejs;

const trace = TraceSource.get(m.id);
trace.debug("globalRequire = {0}", globalRequire);

class ModuleResolver {
    _base: string;
    _require: Require;

    constructor(req: Require, base?: string) {
        this._base = base;
        this._require = req;
    }

    resolve(moduleName: string) {
        argumentNotEmptyString(moduleName, "moduleName");
        const resolvedName = moduleName[0] === "." && this._base ? [this._base, moduleName].join("/") : moduleName;
        trace.debug(`${moduleName} -> ${resolvedName}`);

        const req = this._require;

        return new Promise<any>((cb, eb) => {
            req([resolvedName], cb, eb);
        });
    }
}

export function makeResolver(moduleName: string, contextRequire: Require) {
    const base = moduleName && moduleName.split("/").slice(0, -1).join("/");

    const req = contextRequire || globalRequire;
    if (!req)
        throw new Error("A global require isn't defined, the contextRequire parameter is mandatory");

    const resolver = new ModuleResolver(req, base);
    return (id: string) => resolver.resolve(id);
}
