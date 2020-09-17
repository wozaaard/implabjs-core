import { ActivationContext } from "./ActivationContext";
import { ValueDescriptor } from "./ValueDescriptor";
import { ActivationError } from "./ActivationError";
import { ServiceMap, Descriptor, PartialServiceMap, ContainerServiceMap, ContainerKeys, TypeOfService, ServiceContainer } from "./interfaces";
import { TraceSource } from "../log/TraceSource";
import { Configuration, RegistrationMap } from "./Configuration";
import { Cancellation } from "../Cancellation";
import { ICancellation } from "../interfaces";
import { isDescriptor } from "./traits";
import { LifetimeManager } from "./LifetimeManager";
import { each, isString } from "../safe";
import { ContainerConfiguration, FluentRegistrations } from "./fluent/interfaces";
import { FluentConfiguration } from "./fluent/FluentConfiguration";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export class Container<S extends object = any> implements ServiceContainer<S> {
    readonly _services: ContainerServiceMap<S>;

    readonly _lifetimeManager: LifetimeManager;

    readonly _cleanup: (() => void)[];

    readonly _root: Container<S>;

    readonly _parent?: Container<S>;

    _disposed: boolean;

    constructor(parent?: Container<S>) {
        this._parent = parent;
        this._services = Object.create(parent ? parent._services : null);
        this._cleanup = [];
        this._root = parent ? parent.getRootContainer() : this;
        this._services.container = new ValueDescriptor(this) as any;
        this._services.childContainer = { activate: () => this.createChildContainer() };
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

    /** @deprecated use getLifetimeManager() */
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
     *  The configuration of the container. Can be either a string or an object,
     *  if the configuration is an object it's treated as a collection of
     *  services which will be registered in the container.
     *
     * @param{Function} opts.contextRequire
     *  The function which will be used to load a configuration or types for services.
     *
     */
    async configure(config: string | RegistrationMap<S>, opts?: { contextRequire: any; baseModule?: string }, ct = Cancellation.none) {
        const _opts = Object.create(opts || null);

        if (typeof (config) === "string") {
            _opts.baseModule = config;

            const module = await import(config);
            if (module && module.default && typeof (module.default.apply) === "function")
                return module.default.apply(this);
            else
                return this._applyLegacyConfig(module, _opts, ct);
        } else {
            return this._applyLegacyConfig(config, _opts, ct);
        }
    }

    applyConfig<S2 extends object>(config: Promise<{ default: ContainerConfiguration<S2>; }>, ct?: ICancellation): Promise<ServiceContainer<S & S2>>;
    applyConfig<S2 extends object, P extends string>(config: Promise<{ [p in P]: ContainerConfiguration<S2>; }>, prop: P, ct?: ICancellation): Promise<ServiceContainer<S & S2>>;
    async applyConfig<S2 extends object, P extends string>(
        config: Promise<{ [p in P | "default"]: ContainerConfiguration<S2>; }>,
        propOrCt?: P | ICancellation,
        ct?: ICancellation
    ): Promise<ServiceContainer<S & S2>> {
        const mod = await config;

        let _ct: ICancellation;
        let _prop: P | "default";

        if (isString(propOrCt)) {
            _prop = propOrCt;
            _ct = ct || Cancellation.none;
        } else {
            _ct = propOrCt || Cancellation.none;
            _prop = "default";
        }

        return mod[_prop].apply(this, _ct);
    }

    async _applyLegacyConfig(config: RegistrationMap<S>, opts: { contextRequire: any; baseModule?: string }, ct = Cancellation.none) {
        return new Configuration<S>(this).applyConfiguration(config, opts);
    }

    async fluent<K extends keyof S>(config: FluentRegistrations<K, S>, ct = Cancellation.none): Promise<this> {
        await new FluentConfiguration<S>().register(config).apply(this, ct);
        return this;
    }

    createChildContainer<S2 extends object = S>(): Container<S & S2> {
        return new Container<S & S2>(this as any);
    }
}
