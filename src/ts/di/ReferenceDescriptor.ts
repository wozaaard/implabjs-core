import { isNull, argumentNotEmptyString, each } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { ServiceMap, Descriptor } from "./interfaces";
import { ActivationError } from "./ActivationError";

export class ReferenceDescriptor implements Descriptor {
    _name: string

    _lazy = false

    _optional = false

    _default: any

    _services: ServiceMap

    constructor(name: string, lazy: boolean, optional: boolean, def, services: ServiceMap) {
        argumentNotEmptyString(name, "name");
        this._name = name;
        this._lazy = Boolean(lazy);
        this._optional = Boolean(optional);
        this._default = def;
        this._services = services;
    }

    activate(context: ActivationContext, name: string) {
        var me = this;

        context.enter(name, this, true);

        // добавляем сервисы
        if (me._services) {
            for (var p in me._services) {
                var sv = me._services[p];
                context.register(p, sv);
            }
        }

        if (me._lazy) {
            // сохраняем контекст активации
            context = context.clone();
            return function (cfg: ServiceMap) {
                // защищаем контекст на случай исключения в процессе
                // активации
                var ct = context.clone();
                try {
                    if (cfg)
                        for(let k in cfg)
                            ct.register(k, cfg[v]);

                    return me._optional ? ct.getService(me._name, me._default) : ct
                        .getService(me._name);
                } catch (error) {
                    throw new ActivationError(me._name, ct.getStack(), error);
                }
            };
        }

        var v = me._optional ?
            context.getService(me._name, me._default) :
            context.getService(me._name);

        context.leave();
        return v;
    }

    isInstanceCreated() {
        return false;
    }

    getInstance() {
        throw new Error("The reference descriptor doesn't allowed to hold an instance");
    }

    toString() {
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

        if (!isNull(this._default)) {
            parts.push(" = ");
            parts.push(this._default);
        }

        return parts.join("");
    }
}