declare function require(modules: string[], cb?: (...args: any[]) => any) : void;

declare function define(name:string, modules: string[], cb?: (...args: any[]) => any) : void;

import { Uuid } from "../Uuid";
import { ActivationContext } from "./ActivationContext";
import { ValueDescriptor } from "./ValueDescriptor";
import { ActivationError } from "./ActivationError";
import { isDescriptor, ActivationType } from "./interfaces";
import { AggregateDescriptor } from "./AggregateDescriptor";
import { isPrimitive } from "../safe";
import { ReferenceDescriptor } from "./ReferenceDescriptor";
import { ServiceDescriptor } from "./ServiceDescriptor";


export class Container {
    _services

    _cache

    _cleanup: any[]

    _root: Container

    _parent: Container

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

    getService<T = any>(name: string, def?: T) {
        let d = this._services[name];
        if (!d)
            if (arguments.length > 1)
                return def;
            else
                throw new Error("Service '" + name + "' isn't found");

        if (d.isInstanceCreated())
            return d.getInstance();

        var context = new ActivationContext(this, this._services);

        try {
            return d.activate(context, name);
        } catch (error) {
            throw new ActivationError(name, context.getStack(), error);
        }
    }

    register(nameOrCollection, service?) {
        if (arguments.length == 1) {
            var data = nameOrCollection;
            for (let name in data)
                this.register(name, data[name]);
        } else {
            if (!(isDescriptor(service)))
                service = new ValueDescriptor(service);
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
            for (var i = 0; i < this._cleanup.length; i++)
                this._cleanup[i].call(null);
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
    async configure(config, opts) {
        var me = this,
            contextRequire = (opts && opts.contextRequire);

        if (typeof (config) === "string") {
            let args;
            if (!contextRequire) {
                var shim = [config, Uuid()].join(config.indexOf("/") != -1 ? "-" : "/");
                args = await new Promise((resolve, reject) => {
                    define(shim, ["require", config], function (ctx, data) {
                        resolve([data, {
                            contextRequire: ctx
                        }]);
                    })
                });
                require([shim]);
            } else {
                // TODO how to get correct contextRequire for the relative config module?
                args = await new Promise((resolve, reject) => {
                    contextRequire([config], function (data) {
                        resolve([data, {
                            contextRequire: contextRequire
                        }]);
                    });
                });
            }

            return me._configure.apply(me, args);
        } else {
            return me._configure(config, opts);
        }
    }

    createChildContainer() {
        return new Container(this);
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

    async _configure(data, opts) {
        var typemap = {},
            me = this,
            p,
            contextRequire = (opts && opts.contextRequire) || require;

        var services = {};

        for (p in data) {
            var service = me._parse(data[p], typemap);
            if (!(isDescriptor(service)))
                service = new AggregateDescriptor(service);
            services[p] = service;
        }

        me.register(services);

        var names = [];

        for (p in typemap)
            names.push(p);

        return new Promise((resolve, reject) => {
            if (names.length) {
                contextRequire(names, function () {
                    for (var i = 0; i < names.length; i++)
                        typemap[names[i]] = arguments[i];
                    resolve(me);
                });
            } else {
                resolve(me);
            }
        });

    }

    _parse(data, typemap) {
        if (isPrimitive(data) || isDescriptor(data))
            return data;
        if (data.$dependency) {
            return new ReferenceDescriptor(
                data.$dependency,
                data.lazy,
                data.optional,
                data["default"],
                data.services && this._parseObject(data.services, typemap));
        } else if (data.$value) {
            return !data.parse ?
                new ValueDescriptor(data.$value) :
                new AggregateDescriptor(this._parse(data.$value, typemap));
        } else if (data.$type || data.$factory) {
            return this._parseService(data, typemap);
        } else if (data instanceof Array) {
            return this._parseArray(data, typemap);
        }

        return this._parseObject(data, typemap);
    }

    _parseService(data, typemap) {
        var me = this,
            opts: any = {
                owner: this
            };
        if (data.$type) {

            opts.type = data.$type;

            if (typeof (data.$type) === "string") {
                typemap[data.$type] = null;
                opts.typeMap = typemap;
            }
        }

        if (data.$factory)
            opts.factory = data.$factory;

        if (data.services)
            opts.services = me._parseObject(data.services, typemap);
        if (data.inject)
            opts.inject = data.inject instanceof Array ? data.inject.map(function (x) {
                return me._parseObject(x, typemap);
            }) : me._parseObject(data.inject, typemap);
        if (data.params)
            opts.params = me._parse(data.params, typemap);

        if (data.activation) {
            if (typeof (data.activation) === "string") {
                switch (data.activation.toLowerCase()) {
                    case "singleton":
                        opts.activation = ActivationType.SINGLETON;
                        break;
                    case "container":
                        opts.activation = ActivationType.CONTAINER;
                        break;
                    case "hierarchy":
                        opts.activation = ActivationType.HIERARCHY;
                        break;
                    case "context":
                        opts.activation = ActivationType.CONTEXT;
                        break;
                    case "call":
                        opts.activation = ActivationType.CALL;
                        break;
                    default:
                        throw new Error("Unknown activation type: " +
                            data.activation);
                }
            } else {
                opts.activation = Number(data.activation);
            }
        }

        if (data.cleanup)
            opts.cleanup = data.cleanup;

        return new ServiceDescriptor(opts);
    }

    _parseObject(data, typemap) {
        if (data.constructor &&
            data.constructor.prototype !== Object.prototype)
            return new ValueDescriptor(data);

        var o = {};

        for (var p in data)
            o[p] = this._parse(data[p], typemap);

        return o;
    }

    _parseArray(data, typemap) {
        if (data.constructor &&
            data.constructor.prototype !== Array.prototype)
            return new ValueDescriptor(data);

        var me = this;
        return data.map(function (x) {
            return me._parse(x, typemap);
        });
    }
}