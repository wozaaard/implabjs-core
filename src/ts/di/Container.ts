import { ActivationContext } from "./ActivationContext";
import { ValueDescriptor } from "./ValueDescriptor";
import { ActivationError } from "./ActivationError";
import { isDescriptor, ActivationType, ServiceMap, isDependencyRegistration, isValueRegistration, ServiceRegistration, DependencyRegistration, ValueRegistration } from "./interfaces";
import { AggregateDescriptor } from "./AggregateDescriptor";
import { isPrimitive, pmap } from "../safe";
import { ReferenceDescriptor } from "./ReferenceDescriptor";
import { ServiceDescriptor, ServiceDescriptorParams } from "./ServiceDescriptor";
import { ModuleResolverBase } from "./ModuleResolverBase";
import format = require("../text/format");
import { TraceSource } from "../log/TraceSource";
import { RequireJsResolver } from "./RequireJsResolver";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export class Container {
    _services: ServiceMap;

    _cache: object;

    _cleanup: (() => void)[];

    _root: Container;

    _parent: Container;

    _resolver: ModuleResolverBase;

    constructor(parent?: Container) {
        this._parent = parent;
        this._services = parent ? Object.create(parent._services) : {};
        this._cache = {};
        this._cleanup = [];
        this._root = parent ? parent.getRootContainer() : this;
        this._services.container = new ValueDescriptor(this);
        this._resolver = new RequireJsResolver();
    }

    getRootContainer() {
        return this._root;
    }

    getParent() {
        return this._parent;
    }

    resolve(name: string, def?) {
        const d = this._services[name];
        if (d === undefined) {
            if (arguments.length > 1)
                return def;
            else
                throw new Error("Service '" + name + "' isn't found");
        }

        const context = new ActivationContext(this, this._services);
        try {
            return context.activate(d, name);
        } catch (error) {
            throw new ActivationError(name, context.getStack(), error);
        }
    }

    /**
     * @deprecated use resolve() method
     */
    getService(name: string, def?) {
        return this.resolve.apply(this, arguments);
    }

    register(nameOrCollection, service?) {
        if (arguments.length === 1) {
            const data = nameOrCollection;
            for (const name in data)
                this.register(name, data[name]);
        } else {
            if (!isDescriptor(service))
                throw new Error("The service parameter must be a descriptor");

            this._services[nameOrCollection] = service;
        }
        return this;
    }

    onDispose(callback) {
        if (!(callback instanceof Function))
            throw new Error("The callback must be a function");
        this._cleanup.push(callback);
    }

    dispose() {
        if (this._cleanup) {
            for (const f of this._cleanup)
                f();
            this._cleanup = null;
        }
    }

    /**
     * @param{String|Object} config
     *  The configuration of the contaier. Can be either a string or an object,
     *  if the configuration is an object it's treated as a collection of
     *  services which will be registed in the contaier.
     *
     * @param{Function} opts.contextRequire
     *  The function which will be used to load a configuration or types for services.
     *
     */
    async configure(config: string | object, opts?: object) {
        if (typeof (config) === "string") {
            trace.log(`load configuration '${config}'`);
            const resolver = await this._resolver.createResolver(config, opts);
            const data = await this._resolver.loadModule(config);
            return this._configure(data, { resolver });
        } else {
            trace.log(`json configuration`);
            return this._configure(config);
        }
    }

    createChildContainer() {
        return new Container(this);
    }

    has(id) {
        return id in this._cache;
    }

    get(id) {
        return this._cache[id];
    }

    store(id, value) {
        return (this._cache[id] = value);
    }

    async _configure(data: object, opts?: { resolver: ModuleResolverBase }) {
        const resolver = (opts && opts.resolver) || this._resolver;

        const services = await this._parseRegistrations(data, resolver);

        this.register(services);
    }

    async _parse(data: any, resolver: ModuleResolverBase) {
        if (isPrimitive(data) || isDescriptor(data))
            return data;

        if (isDependencyRegistration(data)) {
            return this._makeReferenceDescriptor(data, resolver);
        } else if (isValueRegistration(data)) {
            return this._makeValueDescriptor(data, resolver);
        } else if (data.$type || data.$factory) {
            return this._makeServiceDescriptor(data, resolver);
        } else if (data instanceof Array) {
            return this._parseArray(data, resolver);
        }

        return this._parseObject(data, resolver);
    }

    async _makeValueDescriptor(data: ValueRegistration, resolver: ModuleResolverBase) {
        return !data.parse ?
            new ValueDescriptor(data.$value) :
            new AggregateDescriptor(this._parse(data.$value, resolver));
    }

    async _makeReferenceDescriptor(registration: DependencyRegistration, resolver: ModuleResolverBase) {
        return new ReferenceDescriptor({
            name: registration.$dependency,
            lazy: registration.lazy,
            optional: registration.optional,
            default: registration.default,
            services: registration.services && await this._parseRegistrations(registration.services, resolver)
        });
    }

    async _makeServiceDescriptor(data: ServiceRegistration, resolver: ModuleResolverBase) {
        const opts: ServiceDescriptorParams = {
            owner: this
        };

        if (data.$type) {
            if (data.$type instanceof Function)
                opts.type = data.$type;
            else if (typeof data.$type === "string")
                opts.type = await resolver.resolve(data.$type);
            else
                throw new Error(format("Unsupported type specification: {0:json}", data.$type));
        } else {
            if (data.$factory instanceof Function)
                opts.factory = data.$factory;
            else if (typeof data.$factory === "string")
                opts.factory = await resolver.resolve(data.$factory);
            else
                throw new Error(format("Unsupported factory specification: {0:json}", data.$factory));
        }

        if (data.services)
            opts.services = await this._parseRegistrations(data.services, resolver);

        if (data.inject) {
            if (data.inject instanceof Array)
                opts.inject = await Promise.all(data.inject.map(x => this._parseObject(x, resolver)));
            else
                opts.inject = [await this._parseObject(data.inject, resolver)];
        }

        if (data.params)
            opts.params = await this._parse(data.params, resolver);

        if (data.activation) {
            if (typeof (data.activation) === "string") {
                switch (data.activation.toLowerCase()) {
                    case "singleton":
                        opts.activation = ActivationType.Singleton;
                        break;
                    case "container":
                        opts.activation = ActivationType.Container;
                        break;
                    case "hierarchy":
                        opts.activation = ActivationType.Hierarchy;
                        break;
                    case "context":
                        opts.activation = ActivationType.Context;
                        break;
                    case "call":
                        opts.activation = ActivationType.Call;
                        break;
                    default:
                        throw new Error("Unknown activation type: " +
                            data.activation);
                }
            } else {
                opts.activation = Number(data.activation);
            }
        }

        if (data.cleanup)
            opts.cleanup = data.cleanup;

        return new ServiceDescriptor(opts);
    }

    async _parseObject(data: object, resolver: ModuleResolverBase) {
        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            return new ValueDescriptor(data);

        const o = {};

        for (const p in data)
            o[p] = await this._parse(data[p], resolver);

        // TODO: handle inline descriptors properly
        // const ex = {
        //     activate(ctx) {
        //         const value = ctx.activate(this.prop, "prop");
        //         // some code
        //     },

        //     // will be turned to ReferenceDescriptor
        //     prop: { $dependency: "depName" }
        // };

        return o;
    }

    async _parseArray(data: Array<any>, resolver: ModuleResolverBase) {
        if (data.constructor &&
            data.constructor.prototype !== Array.prototype)
            return new ValueDescriptor(data);

        return pmap(data, x => this._parse(x, resolver));
    }

    async _parseRegistrations(data: object, resolver: ModuleResolverBase) {
        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            throw new Error("Registrations must be a simple object");

        const o: ServiceMap = {};

        for (const p of Object.keys(data)) {
            const v = await this._parse(data[p], resolver);
            o[p] = isDescriptor(v) ? v : new AggregateDescriptor(v);
        }

        return o;
    }
}
