import { Uuid } from "../Uuid";
import { argumentNotEmptyString } from "../safe";
import { TraceSource } from "../log/TraceSource";

export const rjs = require;

declare function define(name: string, modules: string[], cb?: (...args: any[]) => any, eb?: (e) => any): void;
declare function define(modules: string[], cb?: (...args: any[]) => any, eb?: (e) => any): void;

const trace = TraceSource.get("@implab/core/di/RequireJsHelper");

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

    return new Promise<Require>(fulfill => {
        define(shim, ["require"], r => {
            trace.debug("shim resolved");
            return r;
        });
        require([shim], fulfill);
    });
}
