define(
    [
        "../declare",
        "../safe",
        "./Descriptor",
        "./ValueDescriptor"
    ],

    function (declare, safe, Descriptor, Value) {
        var SINGLETON_ACTIVATION = 1,
            CONTAINER_ACTIVATION = 2,
            CONTEXT_ACTIVATION = 3,
            CALL_ACTIVATION = 4,
            HIERARCHY_ACTIVATION = 5;

        var injectMethod = function (target, method, context, args) {
            var m = target[method];
            if (!m)
                throw new Error("Method '" + method + "' not found");

            if (args instanceof Array)
                m.apply(target, context.parse(args, "." + method));
            else
                m.call(target, context.parse(args, "." + method));
        };

        var makeClenupCallback = function (target, method) {
            if (typeof (method) === "string") {
                return function () {
                    target[method]();
                };
            } else {
                return function () {
                    method(target);
                };
            }
        };

        var cacheId = 0;

        var cls = declare(
            Descriptor, {
                _instance: null,
                _hasInstance: false,
                _activationType: CALL_ACTIVATION,
                _services: null,
                _type: null,
                _typeMap: null,
                _factory: null,
                _params: undefined,
                _inject: null,
                _cleanup: null,
                _cacheId: null,
                _owner: null,

                constructor: function (opts) {
                    safe.argumentNotNull(opts, "opts");
                    safe.argumentNotNull(opts.owner, "opts.owner");

                    this._owner = opts.owner;

                    if (!(opts.type || opts.factory))
                        throw new Error(
                            "Either a type or a factory must be specified");

                    if (typeof (opts.type) === "string" && !opts.typeMap)
                        throw new Error(
                            "The typeMap is required when the type is specified by its name");

                    if (opts.activation)
                        this._activationType = opts.activation;
                    if (opts.type)
                        this._type = opts.type;
                    if (opts.params)
                        this._params = opts.params;
                    if (opts.inject)
                        this._inject = opts.inject instanceof Array ? opts.inject : [opts.inject];
                    if (opts.services)
                        this._services = opts.services;
                    if (opts.factory)
                        this._factory = opts.factory;
                    if (opts.typeMap)
                        this._typeMap = opts.typeMap;
                    if (opts.cleanup) {
                        if (!(typeof (opts.cleanup) === "string" || opts.cleanup instanceof Function))
                            throw new Error(
                                "The cleanup parameter must be either a function or a function name");

                        this._cleanup = opts.cleanup;
                    }

                    this._cacheId = ++cacheId;
                },

                activate: function (context, name) {

                    // if we have a local service records, register them first

                    var instance;

                    switch (this._activationType) {
                        case 1: // SINGLETON
                            // if the value is cached return it
                            if (this._hasInstance)
                                return this._instance;

                            var tof = this._type || this._factory;

                            // create the persistent cache identifier for the type
                            if (safe.isPrimitive(tof))
                                this._cacheId = this._type;
                            else
                                this._cacheId = safe.oid(tof);

                            // singletons are bound to the root container
                            var container = context.container.getRootContainer();

                            if (container.has(this._cacheId)) {
                                instance = container.get(this._cacheId);
                            } else {
                                instance = this._create(context, name);
                                container.store(this._cacheId, instance);
                                if (this._cleanup)
                                    container.onDispose(
                                        makeClenupCallback(instance, this._cleanup));
                            }

                            this._hasInstance = true;
                            return (this._instance = instance);

                        case 2: // CONTAINER
                            //return a cached value
                            if (this._hasInstance)
                                return this._instance;

                            // create an instance
                            instance = this._create(context, name);

                            // the instance is bound to the container
                            if (this._cleanup)
                                this._owner.onDispose(
                                    makeClenupCallback(instance, this._cleanup));

                            // cache and return the instance
                            this._hasInstance = true;
                            return (this._instance = instance);
                        case 3: // CONTEXT
                            //return a cached value if one exists
                            if (context.has(this._cacheId))
                                return context.get(this._cacheId);
                            // context context activated instances are controlled by callers  
                            return context.store(this._cacheId, this._create(
                                context,
                                name));
                        case 4: // CALL
                            // per-call created instances are controlled by callers
                            return this._create(context, name);
                        case 5: // HIERARCHY
                            // hierarchy activated instances are behave much like container activated
                            // except they are created and bound to the child container

                            // return a cached value
                            if (context.container.has(this._cacheId))
                                return context.container.get(this._cacheId);

                            instance = this._create(context, name);

                            if (this._cleanup)
                                context.container.onDispose(makeClenupCallback(
                                    instance,
                                    this._cleanup));

                            return context.container.store(this._cacheId, instance);
                        default:
                            throw "Invalid activation type: " + this._activationType;
                    }
                },

                isInstanceCreated: function () {
                    return this._hasInstance;
                },

                getInstance: function () {
                    return this._instance;
                },

                _create: function (context, name) {
                    context.enter(name, this, Boolean(this._services));

                    if (this._activationType != CALL_ACTIVATION &&
                        context.visit(this._cacheId) > 0)
                        throw new Error("Recursion detected");

                    if (this._services) {
                        for (var p in this._services) {
                            var sv = this._services[p];
                            context.register(p, sv instanceof Descriptor ? sv : new Value(sv, false));
                        }
                    }

                    var instance;

                    if (!this._factory) {
                        var ctor, type = this._type;

                        if (typeof (type) === "string") {
                            ctor = this._typeMap[type];
                            if (!ctor)
                                throw new Error("Failed to resolve the type '" +
                                    type + "'");
                        } else {
                            ctor = type;
                        }

                        if (this._params === undefined) {
                            this._factory = function () {
                                return new ctor();
                            };
                        } else if (this._params instanceof Array) {
                            this._factory = function () {
                                var inst = Object.create(ctor.prototype);
                                var ret = ctor.apply(inst, arguments);
                                return typeof (ret) === "object" ? ret : inst;
                            };
                        } else {
                            this._factory = function (param) {
                                return new ctor(param);
                            };
                        }
                    }

                    if (this._params === undefined) {
                        instance = this._factory();
                    } else if (this._params instanceof Array) {
                        instance = this._factory.apply(this, context.parse(
                            this._params,
                            ".params"));
                    } else {
                        instance = this._factory(context.parse(
                            this._params,
                            ".params"));
                    }

                    if (this._inject) {
                        this._inject.forEach(function (spec) {
                            for (var m in spec)
                                injectMethod(instance, m, context, spec[m]);
                        });
                    }

                    context.leave();

                    return instance;
                },

                // @constructor {singleton} foo/bar/Baz
                // @factory {singleton}
                toString: function () {
                    var parts = [];

                    parts.push(this._type ? "@constructor" : "@factory");

                    parts.push(activationNames[this._activationType]);

                    if (typeof (this._type) === "string")
                        parts.push(this._type);

                    return parts.join(" ");
                }

            });

        cls.SINGLETON = SINGLETON_ACTIVATION;
        cls.CONTAINER = CONTAINER_ACTIVATION;
        cls.CONTEXT = CONTEXT_ACTIVATION;
        cls.CALL = CALL_ACTIVATION;
        cls.HIERARCHY = HIERARCHY_ACTIVATION;

        var activationNames = [
            "",
            "{singleton}",
            "{container}",
            "{context}",
            "{call}",
            "{hierarchy}"
        ];

        return cls;
    });