import { ActivationContext } from "./ActivationContext";
import { Descriptor, ServiceMap, PartialServiceMap, ActivationType } from "./interfaces";
import { Container } from "./Container";
import { argumentNotNull, isPrimitive, keys, isNull } from "../safe";
import { TraceSource } from "../log/TraceSource";
import { isDescriptor } from "./traits";

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

function makeClenupCallback<T>(target: T, method: Cleaner<T>): () => void;
function makeClenupCallback(target: any, method: any) {
    if (typeof (method) === "string") {
        return () => {
            target[method]();
        };
    } else {
        return () => {
            method(target);
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

export type Cleaner<T> = ((x: T) => void) | keyof Extract<T, { [M in keyof T]: () => void }>;

export type InjectionSpec<T> = {
    [m in keyof T]?: any;
};

export interface ServiceDescriptorParams<S extends object, T, P extends any[]> {
    activation?: ActivationType;

    owner: Container<S>;

    params?: P;

    inject?: InjectionSpec<T>[];

    services?: PartialServiceMap<S>;

    cleanup?: Cleaner<T>;
}

export class ServiceDescriptor<S extends object, T, P extends any[]> implements Descriptor<S, T> {
    _instance: T | undefined;

    _hasInstance = false;

    _activationType: ActivationType = "call";

    _services: ServiceMap<S>;

    _params: P | undefined;

    _inject: InjectionSpec<T>[];

    _cleanup: Cleaner<T> | undefined;

    _cacheId: any;

    _owner: Container<S>;

    constructor(opts: ServiceDescriptorParams<S, T, P>) {
        argumentNotNull(opts, "opts");
        argumentNotNull(opts.owner, "owner");

        this._owner = opts.owner;

        if (!isNull(opts.activation))
            this._activationType = opts.activation;

        if (!isNull(opts.params))
            this._params = opts.params;

        this._inject = opts.inject || [];

        this._services = (opts.services || {}) as ServiceMap<S>;

        if (opts.cleanup) {
            if (!(typeof (opts.cleanup) === "string" || opts.cleanup instanceof Function))
                throw new Error(
                    "The cleanup parameter must be either a function or a function name");

            this._cleanup = opts.cleanup;
        }
    }

    activate(context: ActivationContext<S>) {
        // if we have a local service records, register them first
        let instance: T;

        // ensure we have a cache id
        if (!this._cacheId)
            this._cacheId = ++cacheId;

        switch (this._activationType) {
            case "singleton": // SINGLETON
                // if the value is cached return it
                if (this._hasInstance)
                    return this._instance;

                // singletons are bound to the root container
                const container = context.container.getRootContainer();

                if (container.has(this._cacheId)) {
                    instance = container.get(this._cacheId);
                } else {
                    instance = this._create(context);
                    container.store(this._cacheId, instance);
                    if (this._cleanup)
                        container.onDispose(
                            makeClenupCallback(instance, this._cleanup));
                }

                this._hasInstance = true;
                return (this._instance = instance);

            case "container": // CONTAINER
                // return a cached value

                if (this._hasInstance)
                    return this._instance;

                // create an instance
                instance = this._create(context);

                // the instance is bound to the container
                if (this._cleanup)
                    this._owner.onDispose(
                        makeClenupCallback(instance, this._cleanup));

                // cache and return the instance
                this._hasInstance = true;
                return (this._instance = instance);
            case "context": // CONTEXT
                // return a cached value if one exists

                if (context.has(this._cacheId))
                    return context.get(this._cacheId);
                // context context activated instances are controlled by callers
                return context.store(this._cacheId, this._create(context));
            case "call": // CALL
                // per-call created instances are controlled by callers
                return this._create(context);
            case "hierarchy": // HIERARCHY
                // hierarchy activated instances are behave much like container activated
                // except they are created and bound to the child container

                // return a cached value
                if (context.container.has(this._cacheId))
                    return context.container.get(this._cacheId);

                instance = this._create(context);

                if (this._cleanup)
                    context.container.onDispose(makeClenupCallback(
                        instance,
                        this._cleanup));

                return context.container.store(this._cacheId, instance);
            default:
                throw new Error("Invalid activation type: " + this._activationType);
        }
    }

    isInstanceCreated() {
        return this._hasInstance;
    }

    getInstance() {
        return this._instance;
    }

    _factory(...params: any[]): T {
        throw Error("Not implemented");
    }

    _create(context: ActivationContext<S>) {
        trace.debug(`constructing ${context._name}`);

        if (this._activationType !== "call" &&
            context.visit(this._cacheId) > 0)
            throw new Error("Recursion detected");

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
}
