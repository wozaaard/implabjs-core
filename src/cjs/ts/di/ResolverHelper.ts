import { argumentNotEmptyString } from "../safe";
import { TraceSource } from "../log/TraceSource";

const trace = TraceSource.get(module.id);

const mainModule = require.main;
const mainRequire = (id: string) => mainModule.require(id);

class ModuleResolver {
    _base: string;
    _require: NodeRequireFunction;

    constructor(req: NodeRequireFunction, base?: string) {
        this._base = base;
        this._require = (req || mainRequire).bind(null);
    }

    resolve(moduleName: string) {
        argumentNotEmptyString(moduleName, "moduleName");
        const resolvedName = moduleName[0] === "." && this._base ? [this._base, moduleName].join("/") : moduleName;

        trace.debug(`${moduleName} -> ${resolvedName}`);

        return this._require(resolvedName);
    }
}

export function makeResolver(moduleName: string, contextRequire: NodeRequireFunction) {
    const base = moduleName && moduleName.split("/").slice(0, -1).join("/");

    const resolver = new ModuleResolver(contextRequire, base);
    return (id: string) => resolver.resolve(id);
}
