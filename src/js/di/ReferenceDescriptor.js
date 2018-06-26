define([
    "../declare", "../safe", "./Descriptor", "./ActivationError", "./ValueDescriptor"
],

function(declare, safe, Descriptor, ActivationError, Value) {
    return declare(Descriptor, {
        _name : null,
        _lazy : false,
        _optional : false,
        _default : undefined,

        constructor : function(name, lazy, optional, def, services) {
            safe.argumentNotEmptyString(name, "name");
            this._name = name;
            this._lazy = Boolean(lazy);
            this._optional = Boolean(optional);
            this._default = def;
            this._services = services;
        },

        activate : function(context, name) {
            var me = this;

            context.enter(name, this, true);

            // добавляем сервисы
            if (me._services) {
                for ( var p in me._services) {
                    var sv = me._services[p];
                    context.register(p, sv instanceof Descriptor ? sv : new Value(sv, false));
                }
            }

            if (me._lazy) {
                // сохраняем контекст активации
                context = context.clone();
                return function(cfg) {
                    // защищаем контекст на случай исключения в процессе
                    // активации
                    var ct = context.clone();
                    try {
                        if (cfg)
                            safe.each(cfg, function(v, k) {
                                ct.register(k, v instanceof Descriptor ? v : new Value(v, false));
                            });
                        return me._optional ? ct.getService(me._name, me._default) : ct
                            .getService(me._name);
                    } catch (error) {
                        throw new ActivationError(me._name, ct.getStack(), error);
                    }
                };
            }

            var v = me._optional ? context.getService(me._name, me._default) : context
                .getService(me._name);
            context.leave(me);
            return v;
        },

        isInstanceCreated : function() {
            return false;
        },

        toString : function() {
            var opts = [];
            if (this._optional)
                opts.push("optional");
            if (this._lazy)
                opts.push("lazy");

            var parts = [
                "@ref "
            ];
            if (opts.length) {
                parts.push("{");
                parts.push(opts.join());
                parts.push("} ");
            }

            parts.push(this._name);

            if (!safe.isNull(this._default)) {
                parts.push(" = ");
                parts.push(this._default);
            }

            return parts.join("");
        }
    });
});