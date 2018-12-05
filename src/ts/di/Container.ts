import { ActivationContext } from "./ActivationContext";
import { ValueDescriptor } from "./ValueDescriptor";
import { ActivationError } from "./ActivationError";
import { isDescriptor, ActivationType, ServiceMap, isDependencyRegistration, isValueRegistration, ServiceRegistration } from "./interfaces";
import { AggregateDescriptor } from "./AggregateDescriptor";
import { isPrimitive } from "../safe";
import { ReferenceDescriptor } from "./ReferenceDescriptor";
import { ServiceDescriptor, ServiceDescriptorParams } from "./ServiceDescriptor";
import { ModuleResolverBase } from "./ModuleResolverBase";
import format = require("../text/format");

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
    }

    getRootContainer() {
        return this._root;
    }

    getParent() {
        return this._parent;
    }

    getService(name: string, def?) {
        const d = this._services[name];
        if (!d)
            if (arguments.length > 1)
                return def;
            else
                throw new Error("Service '" + name + "' isn't found");

        if (!isDescriptor(d))
            return d;

        if (d.isInstanceCreated())
            return d.getInstance();

        const context = new ActivationContext(this, this._services);

        try {
            return d.activate(context, name);
        } catch (error) {
            throw new ActivationError(name, context.getStack(), error);
        }
    }

    register(nameOrCollection, service?) {
        if (arguments.length === 1) {
            const data = nameOrCollection;
            for (const name in data)
                this.register(name, data[name]);
        } else {
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
            const resolver = await this._resolver.createResolver(config, opts);
            const data = await this._resolver.loadModule(config);
            return this._configure(data, { resolver });
        } else {
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

        const services: ServiceMap = {};

        resolver.beginBatch();

        async function parse(k) {
            services[k] = await this._parse(data[k], resolver);
        }

        const batch = Object.keys(data).map(parse);

        resolver.completeBatch();

        await Promise.all(batch);

        this.register(services);
    }

    async _parse(registration: any, resolver: ModuleResolverBase) {
        if (isPrimitive(registration) || isDescriptor(registration))
            return registration;

        if (isDependencyRegistration(registration)) {

            return new ReferenceDescriptor({
                name: registration.$dependency,
                lazy: registration.lazy,
                optional: registration.optional,
                default: registration.default,
                services: registration.services && this._parseObject(registration.services, resolver)
            });

        } else if (isValueRegistration(registration)) {

            return !registration.parse ?
                new ValueDescriptor(registration.$value) :
                new AggregateDescriptor(this._parse(registration.$value, resolver));

        } else if (registration.$type || registration.$factory) {
            return this._parseService(registration, resolver);
        } else if (registration instanceof Array) {
            return this._parseArray(registration, resolver);
        }

        return this._parseObject(registration, resolver);
    }

    async _parseService(data: ServiceRegistration, resolver: ModuleResolverBase) {
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
            opts.services = await this._parseObject(data.services, resolver);

        if (data.inject instanceof Array)
            opts.inject = await Promise.all(data.inject.map(x => this._parseObject(x, resolver)));
        else
            opts.inject = [await this._parseObject(data.inject, resolver)];

        if (data.params)
            opts.params = this._parse(data.params, resolver);

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

    _parseObject(data: object, resolver: ModuleResolverBase) {
        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            return new ValueDescriptor(data);

        const o = {};

        for (const p in data)
            o[p] = this._parse(data[p], resolver);

        return o;
    }

    _parseArray(data: Array<any>, resolver: ModuleResolverBase) {
        if (data.constructor &&
            data.constructor.prototype !== Array.prototype)
            return new ValueDescriptor(data);

        return data.map(x => this._parse(x, resolver));
    }
}
