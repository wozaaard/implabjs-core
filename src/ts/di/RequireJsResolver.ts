import { ModuleResolverBase } from "./ModuleResolverBase";
import { Uuid } from "../Uuid";
import { argumentNotEmptyString } from "../safe";
import { TraceSource } from "../log/TraceSource";

type RequireFn = (modules: string[], cb?: (...args: any[]) => any) => void;

declare const require: RequireFn;

declare function define(name: string, modules: string[], cb?: (...args: any[]) => any, eb?: (e) => any): void;
declare function define(modules: string[], cb?: (...args: any[]) => any, eb?: (e) => any): void;

interface RequireJsResolverParams {
    contextRequire: (modules: string[], cb?: (...args: any[]) => any) => void;

    base: string;
}

const trace = TraceSource.get("@implab/core/di/RequireJsResolver");

export class RequireJsResolver extends ModuleResolverBase {
    _contextRequire = require;

    _base: string;

    constructor(opts?: RequireJsResolverParams) {
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

        trace.log("createResolver({0})", moduleName);

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

        trace.debug(`define shim ${shim}`);

        try {
            const contextRequire = await new Promise<RequireFn>(
                (resolve, reject) => {
                    try {
                        define(shim, ["require"], r => {
                            trace.debug("shim resolved");
                            resolve(r);
                        }, reject);
                        require([shim]);
                    } catch (e) {
                        reject(e);
                    }
                }
            );

            trace.debug("creating new moduleResolver");

            return new RequireJsResolver({
                base: parts.slice(0, -1).join("/"),
                contextRequire
            });
        } catch (e) {
            trace.error(e);
            throw e;
        }

    }

    async loadModule(moduleName: string): Promise<object> {
        trace.log(`loadModule(${moduleName})`);
        return new Promise<object>(
            resolve => this._contextRequire.call(null, [moduleName], resolve)
        );
    }

}
