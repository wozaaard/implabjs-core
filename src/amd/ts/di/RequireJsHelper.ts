import { Uuid } from "../Uuid";
import { argumentNotEmptyString, argumentNotNull } from "../safe";
import { TraceSource } from "../log/TraceSource";

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

    return new Promise<Require>(cb => {
        define(shim, ["require"], r => {
            trace.debug("shim resolved");
            return r;
        });
        require([shim], cb);
    });
}

export function makeResolver(req: Require) {
    argumentNotNull(req, "req");

    return (name: string) => {
        return new Promise<any>((cb, eb) => {
            req([name], cb, eb);
        });
    };
}
