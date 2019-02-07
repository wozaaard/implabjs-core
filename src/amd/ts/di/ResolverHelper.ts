import { Uuid } from "../Uuid";
import { argumentNotEmptyString, getGlobal, isNullOrEmptyString } from "../safe";
import { TraceSource, DebugLevel } from "../log/TraceSource";
import m = require("module");

const sandboxId = Uuid();
define(sandboxId, ["require"], r => r);

// tslint:disable-next-line:no-var-requires
const globalRequire = getGlobal().require as Require;

const trace = TraceSource.get(m.id);

export async function createContextRequire(moduleName: string): Promise<Require> {
    argumentNotEmptyString(moduleName, "moduleName");

    const parts = moduleName.split("/");
    if (parts[0] === ".")
        throw new Error("An absolute module path is required");

    if (parts.length > 1)
        parts.splice(-1, 1, Uuid());
    else
        parts.push(Uuid());

    const shim = parts.join("/");

    trace.debug(`define shim ${shim}`);

    return new Promise<Require>(cb => {
        define(shim, ["require"], r => {
            trace.debug("shim resolved");
            return r;
        });
        require([shim], cb);
    });
}

class ModuleResolver {
    _base: string;
    _require: Require;

    constructor(req: Require, base?: string) {
        this._base = base;
        this._require = req || globalRequire;
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

export async function makeResolver(moduleName: string, contextRequire: Require) {
    trace.debug(
        "makeResolver moduleName={0}, contextRequire={1}",
        moduleName || "<nil>",
        contextRequire ? typeof (contextRequire) : "<nil>"
    );

    const nestedRequire = isNullOrEmptyString(moduleName) ? null : await createContextRequire(moduleName);

    // const base = moduleName && moduleName.split("/").slice(0, -1).join("/");

    const resolver = new ModuleResolver(nestedRequire, null);
    return (id: string) => resolver.resolve(id);
}
