import { isNull, argumentNotEmptyString, each } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { ServiceMap, Descriptor } from "./interfaces";
import { ActivationError } from "./ActivationError";

export interface ReferenceDescriptorParams {
    name: string;
    lazy?: boolean;
    optional?: boolean;
    default?;
    services?: ServiceMap;
}

export class ReferenceDescriptor implements Descriptor {
    _name: string;

    _lazy = false;

    _optional = false;

    _default: any;

    _services: ServiceMap;

    constructor(opts: ReferenceDescriptorParams) {
        argumentNotEmptyString(opts && opts.name, "opts.name");
        this._name = opts.name;
        this._lazy = !!opts.lazy;
        this._optional = !!opts.optional;
        this._default = !!opts.default;
        this._services = opts.services;
    }

    activate(context: ActivationContext, name: string) {

        if (this._lazy) {
            // сохраняем контекст активации
            context = context.clone();

            // добавляем сервисы
            if (this._services) {
                for (const p of Object.keys(this._services))
                    context.register(p, this._services[p]);
            }

            return (cfg: ServiceMap) => {
                // защищаем контекст на случай исключения в процессе
                // активации
                const ct = context.clone();
                try {
                    if (cfg) {
                        for (const k in cfg)
                            ct.register(k, cfg[k]);
                    }

                    return this._optional ? ct.getService(this._name, this._default) : ct
                        .getService(this._name);
                } catch (error) {
                    throw new ActivationError(this._name, ct.getStack(), error);
                }
            };
        } else {
            context.enter(name, this, !!this._services);

            // добавляем сервисы
            if (this._services) {
                for (const p of Object.keys(this._services))
                    context.register(p, this._services[p]);
            }

            const v = this._optional ?
            context.getService(this._name, this._default) :
            context.getService(this._name);

            context.leave();

            return v;
        }
    }

    isInstanceCreated() {
        return false;
    }

    getInstance() {
        throw new Error("The reference descriptor doesn't allowed to hold an instance");
    }

    toString() {
        const opts = [];
        if (this._optional)
            opts.push("optional");
        if (this._lazy)
            opts.push("lazy");

        const parts = [
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
