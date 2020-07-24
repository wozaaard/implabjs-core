import { ActivationContext } from "./ActivationContext";
import { Descriptor, ServiceMap, PartialServiceMap, ActivationType, ILifetimeManager } from "./interfaces";
import { argumentNotNull, isPrimitive, keys, isNull } from "../safe";
import { TraceSource } from "../log/TraceSource";
import { isDescriptor } from "./traits";
import { LifetimeManager } from "./LifetimeManager";
import { MatchingMemberKeys } from "../interfaces";

let cacheId = 0;

const trace = TraceSource.get("@implab/core/di/ActivationContext");

function injectMethod<T, M extends keyof T, S extends object, A>(target: T, method: M, context: ActivationContext<S>, args: A) {

    const m = target[method];
    if (!m || typeof m !== "function")
        throw new Error("Method '" + method + "' not found");

    if (args instanceof Array)
        return m.apply(target, _parse(args, context, "." + method));
    else
        return m.call(target, _parse(args, context, "." + method));
}

function makeCleanupCallback<T>(method: Cleaner<T>) {
    if (typeof (method) === "function") {
        return (target: T) => {
            method(target);
        };
    } else {
        return (target: T) => {
            const m = target[method] as any;
            m.apply(target);
        };
    }
}

function _parse(value: any, context: ActivationContext<any>, path: string): any {
    if (isPrimitive(value))
        return value as any;

    trace.debug("parse {0}", path);

    if (isDescriptor(value))
        return context.activate(value, path);

    if (value instanceof Array)
        return value.map((x, i) => _parse(x, context, `${path}[${i}]`)) as any;

    const t: any = {};

    keys(value).forEach(p => t[p] = _parse(value[p], context, `${path}.${p}`));

    return t;
}

export type Cleaner<T> = ((x: T) => void) | MatchingMemberKeys<() => void, T>;

export type InjectionSpec<T> = {
    [m in keyof T]?: any;
};

export interface ServiceDescriptorParams<S extends object, T, P extends any[]> {
    lifetime: ILifetimeManager;

    params?: P;

    inject?: InjectionSpec<T>[];

    services?: PartialServiceMap<S>;

    cleanup?: Cleaner<T>;
}

export class ServiceDescriptor<S extends object, T, P extends any[]> implements Descriptor<S, T> {
    _services: ServiceMap<S>;

    _params: P | undefined;

    _inject: InjectionSpec<T>[];

    _cleanup: ((item: T) => void) | undefined;

    _cacheId = String(++cacheId);

    _lifetime = LifetimeManager.empty;

    constructor(opts: ServiceDescriptorParams<S, T, P>) {
        argumentNotNull(opts, "opts");

        if (opts.lifetime)
            this._lifetime = opts.lifetime;

        if (!isNull(opts.params))
            this._params = opts.params;

        this._inject = opts.inject || [];

        this._services = (opts.services || {}) as ServiceMap<S>;

        if (opts.cleanup) {
            if (!(typeof (opts.cleanup) === "string" || opts.cleanup instanceof Function))
                throw new Error(
                    "The cleanup parameter must be either a function or a function name");

            this._cleanup = makeCleanupCallback(opts.cleanup);
        }
    }

    activate(context: ActivationContext<S>) {
        const lifetime = this._lifetime.initialize(this._cacheId, context);

        if (lifetime.has()) {
            return lifetime.get();
        } else {
            lifetime.enter();
            const instance = this._create(context);
            lifetime.store(this._cacheId, this._cleanup);
            return instance;
        }
    }

    _factory(...params: any[]): T {
        throw Error("Not implemented");
    }

    _create(context: ActivationContext<S>) {
        trace.debug(`constructing ${context._name}`);

        if (this._services) {
            keys(this._services).forEach(p => context.register(p, this._services[p]));
        }

        let instance: T;

        if (this._params === undefined) {
            instance = this._factory();
        } else if (this._params instanceof Array) {
            instance = this._factory.apply(this, _parse(this._params, context, "args"));
        } else {
            instance = this._factory(_parse(this._params, context, "args"));
        }

        if (this._inject) {
            this._inject.forEach(spec => {
                for (const m in spec)
                    injectMethod(instance, m, context, spec[m]);
            });
        }
        return instance;
    }

    clone() {
        return Object.create(this);
    }

}
