import { TraceSource } from "../log/TraceSource";
import { argumentNotNull, argumentNotEmptyString, isPrimitive, each, isNull } from "../safe";
import { Descriptor, ServiceMap, PartialServiceMap } from "./interfaces";
import { Container } from "./Container";
import { MapOf } from "../interfaces";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export interface ActivationContextInfo<S> {
    name: string;

    service: string;

    scope: PartialServiceMap<S>;
}

export class ActivationContext<S> {
    _cache: MapOf<any>;

    _services: PartialServiceMap<S>;

    _stack: ActivationContextInfo<S>[];

    _visited: MapOf<any>;

    _name: string;

    _localized: boolean = false;

    container: Container<S>;

    constructor(container: Container<S>, services: PartialServiceMap<S>, name?: string, cache?: object, visited?: MapOf<any>) {
        argumentNotNull(container, "container");
        argumentNotNull(services, "services");

        this._name = name || "<unnamed>";
        this._visited = visited || {};
        this._stack = [];
        this._cache = cache || {};
        this._services = services;
        this.container = container;
    }

    getName() {
        return this._name;
    }

    resolve<K extends keyof S, T extends S[K]>(name: K, def?: T): T {
        const d = this._services[name];

        if (d !== undefined) {
            return this.activate(d as Descriptor<S, T>, name.toString());
        } else {
            if (def !== undefined && def !== null)
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

        this._services[name] = service;
    }

    clone() {
        return new ActivationContext<S>(
            this.container,
            this._services,
            this._name,
            this._cache,
            this._visited
        );
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

        this.enter(name, d.toString());
        const v = d.activate(this);
        this.leave();

        if (trace.isLogEnabled())
            trace.log(`leave ${name}`);

        return v;
    }

    visit(id: string) {
        const count = this._visited[id] || 0;
        this._visited[id] = count + 1;
        return count;
    }

    getStack() {
        return this._stack.slice().reverse();
    }

    private enter(name: string, service: string) {
        this._stack.push({
            name,
            service,
            scope: this._services
        });
        this._name = name;
        this._services = Object.create(this._services);
    }

    private leave() {
        const ctx = this._stack.pop();
        if (ctx) {
            this._services = ctx.scope;
            this._name = ctx.name;
        } else {
            trace.error("Trying to leave the last activation scope");
        }
    }
}
