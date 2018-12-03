import { ActivationContext } from "./ActivationContext";
import { Descriptor, ActivationType, ServiceMap, Constructor, Factory } from "./interfaces";
import { Container } from "./Container";
import { argumentNotNull, isPrimitive, oid } from "../safe";
import { ClientResponse } from "http";

let cacheId = 0;

function injectMethod(target, method, context, args) {
    const m = target[method];
    if (!m)
        throw new Error("Method '" + method + "' not found");

    if (args instanceof Array)
        m.apply(target, context.parse(args, "." + method));
    else
        m.call(target, context.parse(args, "." + method));
}

function makeClenupCallback(target, method: (instance) => void | string) {
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

export interface ServiceDescriptorParams<T = {}> {
    activation?: ActivationType;

    owner: Container;

    type?: Constructor<T>;

    factory?: Factory<T>;

    params?;

    inject?;

    services?: ServiceMap;

    cleanup?: (instance: T) => void | string;
}

export class ServiceDescriptor<T = {}> implements Descriptor {
    _instance: T = null;

    _hasInstance = false;

    _activationType = ActivationType.Call;

    _services: ServiceMap;

    _type: Constructor<T> = null;

    _factory: Factory<T> = null;

    _params;

    _inject: Array<object>;

    _cleanup: (instance: T) => void;

    _cacheId: any;

    _owner: Container;

    constructor(opts: ServiceDescriptorParams<T>) {
        argumentNotNull(opts, "opts");
        argumentNotNull(opts.owner, "owner");

        this._owner = opts.owner;

        if (!(opts.type || opts.factory))
            throw new Error(
                "Either a type or a factory must be specified");

        if (opts.activation)
            this._activationType = opts.activation;

        if (opts.type)
            this._type = opts.type;

        if (opts.params)
            this._params = opts.params;

        if (opts.inject)
            this._inject = opts.inject instanceof Array ? opts.inject : [opts.inject];

        if (opts.services)
            this._services = opts.services;

        if (opts.factory)
            this._factory = opts.factory;

        if (opts.cleanup) {
            if (!(typeof (opts.cleanup) === "string" || opts.cleanup instanceof Function))
                throw new Error(
                    "The cleanup parameter must be either a function or a function name");

            this._cleanup = opts.cleanup;
        }

        if (this._activationType === ActivationType.Singleton) {
            const tof = this._type || this._factory;

            // create the persistent cache identifier for the type
            if (isPrimitive(tof))
                this._cacheId = tof;
            else
                this._cacheId = oid(tof);
        } else {
            this._cacheId = ++cacheId;
        }
    }

    activate(context: ActivationContext, name: string) {
        // if we have a local service records, register them first
        let instance;

        switch (this._activationType) {
            case ActivationType.Singleton: // SINGLETON
                // if the value is cached return it
                if (this._hasInstance)
                    return this._instance;

                // singletons are bound to the root container
                const container = context.container.getRootContainer();

                if (container.has(this._cacheId)) {
                    instance = container.get(this._cacheId);
                } else {
                    instance = this._create(context, name);
                    container.store(this._cacheId, instance);
                    if (this._cleanup)
                        container.onDispose(
                            makeClenupCallback(instance, this._cleanup));
                }

                this._hasInstance = true;
                return (this._instance = instance);

            case ActivationType.Container: // CONTAINER
                // return a cached value

                if (this._hasInstance)
                    return this._instance;

                // create an instance
                instance = this._create(context, name);

                // the instance is bound to the container
                if (this._cleanup)
                    this._owner.onDispose(
                        makeClenupCallback(instance, this._cleanup));

                // cache and return the instance
                this._hasInstance = true;
                return (this._instance = instance);
            case ActivationType.Context: // CONTEXT
                // return a cached value if one exists

                if (context.has(this._cacheId))
                    return context.get(this._cacheId);
                // context context activated instances are controlled by callers
                return context.store(this._cacheId, this._create(
                    context,
                    name));
            case ActivationType.Call: // CALL
                // per-call created instances are controlled by callers
                return this._create(context, name);
            case ActivationType.Hierarchy: // HIERARCHY
                // hierarchy activated instances are behave much like container activated
                // except they are created and bound to the child container

                // return a cached value
                if (context.container.has(this._cacheId))
                    return context.container.get(this._cacheId);

                instance = this._create(context, name);

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

    _create(context, name) {
        context.enter(name, this, Boolean(this._services));

        if (this._activationType !== ActivationType.Call &&
            context.visit(this._cacheId) > 0)
            throw new Error("Recursion detected");

        if (this._services) {
            for (const p in this._services)
                context.register(p, this._services[p]);
        }

        let instance;

        if (!this._factory) {
            const ctor = this._type;
            this._factory = (...args)  => {
                return new ctor(...args);
            };
        }

        if (this._params === undefined) {
            instance = this._factory();
        } else if (this._params instanceof Array) {
            instance = this._factory.apply(this, context.parse(
                this._params,
                ".params"));
        } else {
            instance = this._factory(context.parse(
                this._params,
                ".params"));
        }

        if (this._inject) {
            this._inject.forEach(spec => {
                for (const m in spec)
                    injectMethod(instance, m, context, spec[m]);
            });
        }

        context.leave();

        return instance;
    }

    // @constructor {singleton} foo/bar/Baz
    // @factory {singleton}
    toString() {
        const parts = [];

        parts.push(this._type ? "@constructor" : "@factory");

        parts.push(ActivationType[this._activationType]);

        if (typeof (this._type) === "string")
            parts.push(this._type);

        return parts.join(" ");
    }
}
