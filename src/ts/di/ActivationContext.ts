import { TraceSource } from "../log/TraceSource";
import { argumentNotNull, argumentNotEmptyString, isPrimitive, each, isNull } from "../safe";
import { Descriptor, ServiceMap, isDescriptor } from "./interfaces";
import { Container } from "./Container";

const trace = TraceSource.get("@implab/core/di/ActivationContext");

export interface ActivationContextInfo {
    name: string;

    service: Descriptor;

    scope: ServiceMap;
}

export class ActivationContext {
    _cache: object;

    _services: ServiceMap;

    _stack: ActivationContextInfo[];

    _visited: object;

    container: Container;

    constructor(container: Container, services: ServiceMap, cache?: object, visited?) {
        argumentNotNull(container, "container");
        argumentNotNull(services, "services");

        this._visited = visited || {};
        this._stack = [];
        this._cache = cache || {};
        this._services = services;
        this.container = container;
    }

    getService(name, def?): any {
        const d = this._services[name];

        if (!d)
            if (arguments.length > 1)
                return def;
            else
                throw new Error(`Service ${name} not found`);

        return isDescriptor(d) ? d.activate(this, name) : d;
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
            Object.create(this._services),
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

    parse(data, name: string) {
        if (isPrimitive(data))
            return data;

        if (isDescriptor(data)) {
            return data.activate(this, name);
        } else if (data instanceof Array) {
            this.enter(name);
            const v = data.map( (x, i) => this.parse(x, `[${i}]`));
            this.leave();
            return v;
        } else {
            this.enter(name);
            const result = {};
            for (const p in data)
                result[p] = this.parse(data[p], "." + p);
            this.leave();
            return result;
        }
    }

    visit(id: string) {
        const count = this._visited[id] || 0;
        this._visited[id] = count + 1;
        return count;
    }

    getStack() {
        return this._stack.slice().reverse();
    }

    enter(name: string, d?: Descriptor, localize?: boolean) {
        if (trace.isLogEnabled())
            trace.log("enter " + name + " " + (d || "") +
                (localize ? " localize" : ""));
        this._stack.push({
            name,
            service: d,
            scope: this._services
        });
        if (localize)
            this._services = Object.create(this._services);
    }

    leave() {
        const ctx = this._stack.pop();
        this._services = ctx.scope;

        if (trace.isLogEnabled())
            trace.log("leave " + ctx.name + " " + (ctx.service || ""));
    }
}
