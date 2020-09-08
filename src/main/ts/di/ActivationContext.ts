import { TraceSource } from "../log/TraceSource";
import { argumentNotEmptyString } from "../safe";
import { Descriptor, ContainerServiceMap, ContainerKeys, TypeOfService, ILifetime } from "./interfaces";
import { Container } from "./Container";
import { MapOf } from "../interfaces";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export interface ActivationContextInfo {
    name: string;

    service: string;

}

let nextId = 1;

/** This class is created once per `Container.resolve` method call and used to
 * cache dependencies and to track created instances. The activation context
 * tracks services with `context` activation type.
 */
export class ActivationContext<S extends object> {
    _cache: MapOf<any>;

    _services: ContainerServiceMap<S>;

    _visited: MapOf<any>;

    _name: string;

    _service: Descriptor<S, any>;

    _container: Container<S>;

    _parent: ActivationContext<S> | undefined;

    /** Creates a new activation context with the specified parameters.
     * @param container the container which starts the activation process
     * @param services the initial service registrations
     * @param name the name of the service being activated, this parameter is
     *  used for the debug purpose.
     * @param service the service to activate, this parameter is used for the
     *  debug purpose.
     */
    constructor(container: Container<S>, services: ContainerServiceMap<S>, name: string, service: Descriptor<S, any>) {
        this._name = name;
        this._service = service;
        this._visited = {};
        this._cache = {};
        this._services = services;
        this._container = container;
    }

    /** the name of the current resolving dependency */
    getName() {
        return this._name;
    }

    /** Returns the container for which 'resolve' method was called */
    getContainer() {
        return this._container;
    }

    /** Resolves the specified dependency in the current context
     * @param name The name of the dependency being resolved
     */
    resolve<K extends ContainerKeys<S>>(name: K): TypeOfService<S, K>;
    /** Resolves the specified dependency with the specified default value if
     * the dependency is missing.
     *
     * @param name The name of the dependency being resolved
     * @param def A default value to return in case of the specified dependency
     *   is missing.
     */
    resolve<K extends ContainerKeys<S>, T>(name: K, def: T): TypeOfService<S, K> | T;
    /** Resolves the specified dependency and returns undefined in case if the
     * dependency is missing.
     *
     * @param name The name of the dependency being resolved
     */
    resolve<K extends ContainerKeys<S>>(name: K, def: undefined): TypeOfService<S, K> | undefined;
    resolve<K extends ContainerKeys<S>, T>(name: K, def?: T): TypeOfService<S, K> | T | undefined {
        const d = this._services[name];

        if (d !== undefined) {
            return this.activate(d, name.toString());
        } else {
            if (arguments.length > 1)
                return def;
            else
                throw new Error(`Service ${name} not found`);
        }
    }

    /**
     * registers services local to the the activation context
     *
     * @name{string} the name of the service
     * @service{string} the service descriptor to register
     */
    register<K extends keyof S>(name: K, service: Descriptor<S, S[K]>) {
        argumentNotEmptyString(name, "name");

        this._services[name] = service as any;
    }

    createLifetime(): ILifetime {
        const id = nextId++;
        const me = this;
        return {
            initialize() {
            },
            has() {
                return id in me._cache;
            },
            get() {
                return me._cache[id];
            },
            store(item: any) {
                me._cache[id] = item;
            }
        };
    }

    activate<T>(d: Descriptor<S, T>, name: string) {
        if (trace.isLogEnabled())
            trace.log(`enter ${name} ${d}`);

        const ctx = this.enter(d, name);
        const v = d.activate(ctx);

        if (trace.isLogEnabled())
            trace.log(`leave ${name}`);

        return v;
    }

    visit(id: string) {
        const count = this._visited[id] || 0;
        this._visited[id] = count + 1;
        return count;
    }

    getStack(): ActivationContextInfo[] {
        const stack = [{
            name: this._name,
            service: this._service.toString()
        }];

        return this._parent ?
            stack.concat(this._parent.getStack()) :
            stack;
    }

    private enter(service: Descriptor<S, any>, name: string): this {
        const clone = Object.create(this);
        clone._name = name;
        clone._services = Object.create(this._services);
        clone._parent = this;
        clone._service = service;
        return clone;
    }

    /** Creates a clone for the current context, used to protect it from modifications */
    clone(): this {
        const clone = Object.create(this);
        clone._services = Object.create(this._services);
        return clone;
    }
}
