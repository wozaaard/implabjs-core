import { ActivationContext } from "./ActivationContext";
import { ValueDescriptor } from "./ValueDescriptor";
import { ActivationError } from "./ActivationError";
import { ServiceMap, Descriptor, PartialServiceMap, ContainerProvided, ServiceLocator, ContainerServiceMap, ContainerKeys, TypeOfService, ILifetimeManager } from "./interfaces";
import { TraceSource } from "../log/TraceSource";
import { Configuration, RegistrationMap } from "./Configuration";
import { Cancellation } from "../Cancellation";
import { MapOf, IDestroyable } from "../interfaces";
import { isDescriptor } from "./traits";
import { LifetimeManager } from "./LifetimeManager";
import { each } from "../safe";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export class Container<S extends object = any> implements ServiceLocator<S>, IDestroyable {
    readonly _services: ContainerServiceMap<S>;

    readonly _lifetimeManager: ILifetimeManager;

    readonly _cleanup: (() => void)[];

    readonly _root: Container<S>;

    readonly _parent?: Container<S>;

    _disposed: boolean;

    constructor(parent?: Container<S>) {
        this._parent = parent;
        this._services = parent ? Object.create(parent._services) : {};
        this._cleanup = [];
        this._root = parent ? parent.getRootContainer() : this;
        this._services.container = new ValueDescriptor(this) as any;
        this._disposed = false;
        this._lifetimeManager = new LifetimeManager();
    }

    getRootContainer() {
        return this._root;
    }

    getParent() {
        return this._parent;
    }

    getLifetimeManager() {
        return this._lifetimeManager;
    }

    resolve<K extends ContainerKeys<S>>(name: K, def?: TypeOfService<S, K>): TypeOfService<S, K> {
        trace.debug("resolve {0}", name);
        const d = this._services[name];
        if (d === undefined) {
            if (def !== undefined)
                return def;
            else
                throw new Error("Service '" + name + "' isn't found");
        } else {

            const context = new ActivationContext<S>(this, this._services, String(name), d);
            try {
                return d.activate(context);
            } catch (error) {
                throw new ActivationError(name.toString(), context.getStack(), error);
            }
        }
    }

    /**
     * @deprecated use resolve() method
     */
    getService<K extends ContainerKeys<S>>(name: K, def?: TypeOfService<S, K>) {
        return this.resolve(name, def);
    }

    register<K extends keyof S>(name: K, service: Descriptor<S, S[K]>): this;
    register(services: PartialServiceMap<S>): this;
    register<K extends keyof S>(nameOrCollection: K | ServiceMap<S>, service?: Descriptor<S, S[K]>) {
        if (arguments.length === 1) {
            const data = nameOrCollection as ServiceMap<S>;

            each(data, (v, k) => this.register(k, v));
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

    destroy() {
        return this.dispose();
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
}
