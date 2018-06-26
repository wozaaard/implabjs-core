define([
    "../declare",
    "../safe",
    "./Descriptor",
    "./ValueDescriptor",
    "../log/trace!"
], function (declare, safe, Descriptor, Value, trace) {
    var Context = declare(null, {

        _cache: null,

        _services: null,

        _stack: null,

        _visited: null,

        container: null,

        _trace: true,

        constructor: function (container, services, cache, visited) {
            safe.argumentNotNull(container, "container");
            safe.argumentNotNull(services, "services");

            this._visited = visited || {};
            this._stack = [];
            this._cache = cache || {};
            this._services = services;
            this.container = container;
        },

        getService: function (name, def) {
            var d = this._services[name];

            if (!d)
                if (arguments.length > 1)
                    return def;
                else
                    throw new Error("Service '" + name + "' not found");

            return d.activate(this, name);
        },

        /**
         * registers services local to the the activation context
         * 
         * @name{string} the name of the service
         * @service{string} the service descriptor to register
         */
        register: function (name, service) {
            safe.argumentNotEmptyString(name, "name");

            if (!(service instanceof Descriptor))
                service = new Value(service, true);
            this._services[name] = service;
        },

        clone: function () {
            return new Context(
                this.container,
                Object.create(this._services),
                this._cache,
                this._visited
            );

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

        parse: function (data, name) {
            var me = this;
            if (safe.isPrimitive(data))
                return data;

            if (data instanceof Descriptor) {
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
        },

        visit: function (id) {
            var count = this._visited[id] || 0;
            this._visited[id] = count + 1;
            return count;
        },

        getStack: function () {
            return this._stack.slice().reverse();
        },

        enter: function (name, d, localize) {
            if (this._trace)
                trace.log("enter " + name + " " + (d || "") +
                    (localize ? " localize" : ""));
            this._stack.push({
                name: name,
                service: d,
                scope: this._services
            });
            if (localize)
                this._services = Object.create(this._services);
        },

        leave: function () {
            var ctx = this._stack.pop();
            this._services = ctx.scope;

            if (this._trace)
                trace.log("leave " + ctx.name + " " + (ctx.service || ""));
        }
    });

    return Context;
});