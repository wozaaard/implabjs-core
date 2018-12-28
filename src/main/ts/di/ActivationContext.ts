import { TraceSource } from "../log/TraceSource";
import { argumentNotNull, argumentNotEmptyString, isPrimitive, each, isNull } from "../safe";
import { Descriptor, ServiceMap } from "./interfaces";
import { Container } from "./Container";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export interface ActivationContextInfo {
    name: string;

    service: string;

    scope: ServiceMap;
}

export class ActivationContext {
    _cache: object;

    _services: ServiceMap;

    _stack: ActivationContextInfo[];

    _visited: object;

    _name: string;

    _localized: boolean;

    container: Container;

    constructor(container: Container, services: ServiceMap, name?: string, cache?: object, visited?) {
        argumentNotNull(container, "container");
        argumentNotNull(services, "services");

        this._name = name;
        this._visited = visited || {};
        this._stack = [];
        this._cache = cache || {};
        this._services = services;
        this.container = container;
    }

    getName() {
        return this._name;
    }

    resolve(name, def?): any {
        const d = this._services[name];

        if (!d)
            if (arguments.length > 1)
                return def;
            else
                throw new Error(`Service ${name} not found`);

        return this.activate(d, name);
    }

    /**
     * registers services local to the the activation context
     *
     * @name{string} the name of the service
     * @service{string} the service descriptor to register
     */
    register(name: string, service: Descriptor) {
        argumentNotEmptyString(name, "name");

        this._services[name] = service;
    }

    clone() {
        return new ActivationContext(
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

    get(id: string) {
        return this._cache[id];
    }

    store(id: string, value) {
        return (this._cache[id] = value);
    }

    activate(d: Descriptor, name: string) {
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
        this._services = ctx.scope;
        this._name = ctx.name;
    }
}
