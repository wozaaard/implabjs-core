import { TraceSource } from "../log/TraceSource";
import { argumentNotNull, argumentNotEmptyString, isPrimitive, each, isNull } from "../safe";
import { Uuid } from '../Uuid';
import { Container, ActivationContextInfo, ServiceMap, Descriptor, isDescriptor } from "../di";

let trace = TraceSource.get("di");


export class ActivationContext {
    _cache: object

    _services: ServiceMap

    _stack: ActivationContextInfo[]

    _visited: any

    container: any


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
        let d = this._services[name];

        if (!d)
            if (arguments.length > 1)
                return def;
            else
                throw new Error("Service '" + name + "' not found");

        return d.activate(this, name);
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

    has(id) {
        return id in this._cache;
    }

    get(id) {
        return this._cache[id];
    }

    store(id, value) {
        return (this._cache[id] = value);
    }

    parse(data: any, name) {
        var me = this;
        if (isPrimitive(data))
            return data;

        if (isDescriptor(data)) {
            return data.activate(this, name);
        } else if (data instanceof Array) {
            me.enter(name);
            var v = data.map(function (x, i) {
                return me.parse(x, "." + i);
            });
            me.leave();
            return v;
        } else {
            me.enter(name);
            var result = {};
            for (var p in data)
                result[p] = me.parse(data[p], "." + p);
            me.leave();
            return result;
        }
    }

    visit(id) {
        var count = this._visited[id] || 0;
        this._visited[id] = count + 1;
        return count;
    }

    getStack() {
        return this._stack.slice().reverse();
    }

    enter(name, d?, localize?) {
        if (trace.isLogEnabled())
            trace.log("enter " + name + " " + (d || "") +
                (localize ? " localize" : ""));
        this._stack.push({
            name: name,
            service: d,
            scope: this._services
        });
        if (localize)
            this._services = Object.create(this._services);
    }

    leave() {
        var ctx = this._stack.pop();
        this._services = ctx.scope;

        if (trace.isLogEnabled())
            trace.log("leave " + ctx.name + " " + (ctx.service || ""));
    }
}