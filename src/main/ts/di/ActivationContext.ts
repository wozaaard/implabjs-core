import { TraceSource } from "../log/TraceSource";
import { argumentNotEmptyString } from "../safe";
import { Descriptor, ContainerServiceMap, ContainerKeys, TypeOfService } from "./interfaces";
import { Container } from "./Container";
import { MapOf } from "../interfaces";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export interface ActivationContextInfo {
    name: string;

    service: string;

}

export class ActivationContext<S extends object> {
    _cache: MapOf<any>;

    _services: ContainerServiceMap<S>;

    _visited: MapOf<any>;

    _name: string;

    _service: Descriptor<S, any>;

    _container: Container<S>;

    _parent: ActivationContext<S> | undefined;

    constructor(container: Container<S>, services: ContainerServiceMap<S>, name: string, service: Descriptor<S, any>) {
        this._name = name;
        this._service = service;
        this._visited = {};
        this._cache = {};
        this._services = services;
        this._container = container;
    }

    getName() {
        return this._name;
    }

    getContainer() {
        return this._container;
    }

    resolve<K extends ContainerKeys<S>>(name: K): TypeOfService<S, K>;
    resolve<K extends ContainerKeys<S>, T>(name: K, def: T): TypeOfService<S, K> | T;
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

    has(id: string) {
        return id in this._cache;
    }

    get<T>(id: string) {
        return this._cache[id];
    }

    store(id: string, value: any) {
        return (this._cache[id] = value);
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
