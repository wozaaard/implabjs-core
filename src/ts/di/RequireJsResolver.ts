import { ModuleResolverBase } from "./ModuleResolverBase";
import { Uuid } from "../Uuid";
import { argumentNotEmptyString } from "../safe";
import { TraceSource } from "../log/TraceSource";

declare function require(modules: string[], cb?: (...args: any[]) => any): void;

declare function define(name: string, modules: string[], cb?: (...args: any[]) => any): void;

interface RequireJsResolverParams {
    contextRequire: (modules: string[], cb?: (...args: any[]) => any) => void;

    base: string;
}

TraceSource.get("RequireJsResolver");

export class RequireJsResolver extends ModuleResolverBase {
    _contextRequire = require;

    _base: string;

    constructor(opts) {
        super();

        if (opts) {

            if (opts.contextRequire)
                this._contextRequire = opts.contextRequire;

            if (opts.base) {
                if (opts.base.indexOf("./") === 0)
                    throw new Error(`A module id should be an absolute: '${opts.base}'`);
                this._base = opts.base;
            }
        }

    }

    async createResolver(moduleName: string): Promise<ModuleResolverBase> {
        argumentNotEmptyString(moduleName, "moduleName");

        const parts = moduleName.split("/");
        if (parts[0] === ".") {
            if (this._base)
                parts[0] = this._base;
            else
                throw new Error(`Can't resolve a relative module '${moduleName}'`);
        }

        if (parts.length > 1)
            parts.splice(-1, 1, Uuid());
        else
            parts.push(Uuid());

        const shim = parts.join("/");

        const contextRequire = await new Promise(
            resolve => define(shim, ["require"], resolve)
        );

        return new RequireJsResolver({
            base: parts.slice(0, -1).join("/"),
            contextRequire
        });
    }

    async loadModule(moduleName: string): Promise<object> {
        return new Promise<object>(
            resolve => this._contextRequire.call(null, [moduleName], resolve)
        );
    }

}
