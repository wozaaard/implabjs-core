import { ActivationContext } from "./ActivationContext";
import { ValueDescriptor } from "./ValueDescriptor";
import { ActivationError } from "./ActivationError";
import { isDescriptor, ServiceMap } from "./interfaces";
import { TraceSource } from "../log/TraceSource";
import { Configuration } from "./Configuration";
import { Cancellation } from "../Cancellation";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export class Container {
    _services: ServiceMap;

    _cache: object;

    _cleanup: (() => void)[];

    _root: Container;

    _parent: Container;

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

    resolve(name: string, def?) {
        trace.debug("resolve {0}", name);
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
    getService() {
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
    async configure(config: string | object, opts?: any, ct = Cancellation.none) {
        const c = new Configuration(this);

        if (typeof (config) === "string") {
            return c.loadConfiguration(config, opts && opts.contextRequire, ct);
        } else {
            return c.applyConfiguration(config, opts && opts.contextRequire, ct);
        }
    }

    createChildContainer() {
        return new Container(this);
    }

    has(id: string | number) {
        return id in this._cache;
    }

    get(id: string | number) {
        return this._cache[id];
    }

    store(id: string | number, value: any) {
        return (this._cache[id] = value);
    }

}
