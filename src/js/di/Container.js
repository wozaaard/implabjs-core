define([
    "../declare",
    "../safe",
    "../Uuid",
    "../Deferred",
    "./ActivationContext",
    "./Descriptor",
    "./ValueDescriptor",
    "./ReferenceDescriptor",
    "./ServiceDescriptor",
    "./ActivationError"
], function (
    declare,
    safe,
    Uuid,
    Deferred,
    ActivationContext,
    Descriptor,
    Value,
    Reference,
    Service,
    ActivationError) {
    var Container = declare(null, {
        _services: null,
        _cache: null,
        _cleanup: null,
        _root: null,
        _parent: null,

        constructor: function (parent) {
            this._parent = parent;
            this._services = parent ? Object.create(parent._services) : {};
            this._cache = {};
            this._cleanup = [];
            this._root = parent ? parent.getRootContainer() : this;
            this._services.container = new Value(this, true);
        },

        getRootContainer: function () {
            return this._root;
        },

        getParent: function () {
            return this._parent;
        },

        /**
         * 
         */
        getService: function (name, def) {
            var d = this._services[name];
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
        },

        register: function (name, service) {
            if (arguments.length == 1) {
                var data = name;
                for (name in data)
                    this.register(name, data[name]);
            } else {
                if (!(service instanceof Descriptor))
                    service = new Value(service, true);
                this._services[name] = service;
            }
            return this;
        },

        onDispose: function (callback) {
            if (!(callback instanceof Function))
                throw new Error("The callback must be a function");
            this._cleanup.push(callback);
        },

        dispose: function () {
            if (this._cleanup) {
                for (var i = 0; i < this._cleanup.length; i++)
                    this._cleanup[i].call(null);
                this._cleanup = null;
            }
        },

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
        configure: function (config, opts) {
            var p, me = this,
                contextRequire = (opts && opts.contextRequire);

            if (typeof (config) === "string") {
                p = new Deferred();
                if (!contextRequire) {
                    var shim = [config, new Uuid()].join(config.indexOf("/") != -1 ? "-" : "/");
                    define(shim, ["require", config], function (ctx, data) {
                        p.resolve([data, {
                            contextRequire: ctx
                        }]);
                    });
                    require([shim]);
                } else {
                    // TODO how to get correct contextRequire for the relative config module?
                    contextRequire([config], function (data) {
                        p.resolve([data, {
                            contextRequire: contextRequire
                        }]);
                    });
                }

                return p.then(function (args) {
                    return me._configure.apply(me, args);
                });
            } else {
                return me._configure(config, opts);
            }
        },

        createChildContainer: function () {
            return new Container(this);
        },

        has: function (id) {
            return id in this._cache;
        },

        get: function (id) {
            return this._cache[id];
        },

        store: function (id, value) {
            return (this._cache[id] = value);
        },

        _configure: function (data, opts) {
            var typemap = {},
                d = new Deferred(),
                me = this,
                p,
                contextRequire = (opts && opts.contextRequire) || require;

            var services = {};

            for (p in data) {
                var service = me._parse(data[p], typemap);
                if (!(service instanceof Descriptor))
                    service = new Value(service, false);
                services[p] = service;
            }

            me.register(services);

            var names = [];

            for (p in typemap)
                names.push(p);

            if (names.length) {
                contextRequire(names, function () {
                    for (var i = 0; i < names.length; i++)
                        typemap[names[i]] = arguments[i];
                    d.resolve(me);
                });
            } else {
                d.resolve(me);
            }
            return d.promise;
        },

        _parse: function (data, typemap) {
            if (safe.isPrimitive(data) || data instanceof Descriptor)
                return data;
            if (data.$dependency)
                return new Reference(
                    data.$dependency,
                    data.lazy,
                    data.optional,
                    data["default"],
                    data.services && this._parseObject(data.services, typemap));
            if (data.$value) {
                var raw = !data.parse;
                return new Value(raw ? data.$value : this._parse(
                    data.$value,
                    typemap), raw);
            }
            if (data.$type || data.$factory)
                return this._parseService(data, typemap);
            if (data instanceof Array)
                return this._parseArray(data, typemap);

            return this._parseObject(data, typemap);
        },

        _parseService: function (data, typemap) {
            var me = this,
                opts = {
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
                            opts.activation = Service.SINGLETON;
                            break;
                        case "container":
                            opts.activation = Service.CONTAINER;
                            break;
                        case "hierarchy":
                            opts.activation = Service.HIERARCHY;
                            break;
                        case "context":
                            opts.activation = Service.CONTEXT;
                            break;
                        case "call":
                            opts.activation = Service.CALL;
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

            return new Service(opts);
        },

        _parseObject: function (data, typemap) {
            if (data.constructor &&
                data.constructor.prototype !== Object.prototype)
                return new Value(data, true);

            var o = {};

            for (var p in data)
                o[p] = this._parse(data[p], typemap);

            return o;
        },

        _parseArray: function (data, typemap) {
            if (data.constructor &&
                data.constructor.prototype !== Array.prototype)
                return new Value(data, true);

            var me = this;
            return data.map(function (x) {
                return me._parse(x, typemap);
            });
        }

    });

    return Container;
});