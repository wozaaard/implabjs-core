import { ActivationContext } from "./ActivationContext";
import { ValueDescriptor } from "./ValueDescriptor";
import { ActivationError } from "./ActivationError";
import { ServiceMap, Descriptor, PartialServiceMap, ContainerProvided, Resolver, ContainerServiceMap, ContainerKeys, ContainerResolve } from "./interfaces";
import { TraceSource } from "../log/TraceSource";
import { Configuration, RegistrationMap } from "./Configuration";
import { Cancellation } from "../Cancellation";
import { MapOf } from "../interfaces";
import { isDescriptor } from "./traits";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export class Container<S extends object = any> implements Resolver<S> {
    readonly _services: ContainerServiceMap<S>;

    readonly _cache: MapOf<any>;

    readonly _cleanup: (() => void)[];

    readonly _root: Container<S>;

    readonly _parent?: Container<S>;

    _disposed: boolean;

    constructor(parent?: Container<S>) {
        this._parent = parent;
        this._services = parent ? Object.create(parent._services) : {};
        this._cache = {};
        this._cleanup = [];
        this._root = parent ? parent.getRootContainer() : this;
        this._services.container = new ValueDescriptor(this) as any;
        this._disposed = false;
    }

    getRootContainer() {
        return this._root;
    }

    getParent() {
        return this._parent;
    }

    resolve<K extends ContainerKeys<S>>(name: K, def?: ContainerResolve<S, K>): ContainerResolve<S, K> {
        trace.debug("resolve {0}", name);
        const d = this._services[name];
        if (d === undefined) {
            if (def !== undefined)
                return def;
            else
                throw new Error("Service '" + name + "' isn't found");
        } else {

            const context = new ActivationContext<S>(this, this._services);
            try {
                return context.activate(d, name.toString());
            } catch (error) {
                throw new ActivationError(name.toString(), context.getStack(), error);
            }
        }
    }

    /**
     * @deprecated use resolve() method
     */
    getService<K extends ContainerKeys<S>>(name: K, def?: ContainerResolve<S, K>) {
        return this.resolve(name, def);
    }

    register<K extends keyof S>(name: K, service: Descriptor<S, S[K]>): this;
    register(services: PartialServiceMap<S>): this;
    register<K extends keyof S>(nameOrCollection: K | ServiceMap<S>, service?: Descriptor<S, S[K]>) {
        if (arguments.length === 1) {
            const data = nameOrCollection as ServiceMap<S>;

            for (const name in data) {
                if (Object.prototype.hasOwnProperty.call(data, name)) {
                    this.register(name, data[name] as Descriptor<S, S[keyof S]>);
                }
            }
        } else {
            if (!isDescriptor(service))
                throw new Error("The service parameter must be a descriptor");

            this._services[nameOrCollection as K] = service as any;
        }
        return this;
    }

    onDispose(callback: () => void) {
        if (!(callback instanceof Function))
            throw new Error("The callback must be a function");
        this._cleanup.push(callback);
    }

    dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        for (const f of this._cleanup)
            f();
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
    async configure(config: string | RegistrationMap<S>, opts?: any, ct = Cancellation.none) {
        const c = new Configuration<S>(this);

        if (typeof (config) === "string") {
            return c.loadConfiguration(config, opts && opts.contextRequire, ct);
        } else {
            return c.applyConfiguration(config, opts && opts.contextRequire, ct);
        }
    }

    createChildContainer<S2 extends object = S>(): Container<S & S2> {
        return new Container<S & S2>(this as any);
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
