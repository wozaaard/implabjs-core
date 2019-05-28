import { Uuid } from "../Uuid";
import { argumentNotEmptyString, getGlobal, isNullOrEmptyString } from "../safe";
import { TraceSource } from "../log/TraceSource";
import m = require("module");

const sandboxId = Uuid();
define(sandboxId, ["require"], r => r);

// tslint:disable-next-line:no-var-requires
const globalRequire = getGlobal().require as Require;

const trace = TraceSource.get(m.id);

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

    const resolver = new ModuleResolver(contextRequire, base);
    return (id: string) => resolver.resolve(id);
}
