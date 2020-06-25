import { isNull, argumentNotEmptyString, each } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { ServiceMap, Descriptor } from "./interfaces";
import { ActivationError } from "./ActivationError";

export interface ReferenceDescriptorParams<S, K extends keyof S> {
    name: K;
    lazy?: boolean;
    optional?: boolean;
    default?: S[K];
    services?: ServiceMap;
}

export class ReferenceDescriptor<S, K extends keyof S> implements Descriptor<S[K]> {
    _name: K;

    _lazy = false;

    _optional = false;

    _default: any;

    _services: ServiceMap;

    constructor(opts: ReferenceDescriptorParams<S, K>) {
        argumentNotEmptyString(opts && opts.name, "opts.name");
        this._name = opts.name;
        this._lazy = !!opts.lazy;
        this._optional = !!opts.optional;
        this._default = opts.default;

        this._services = opts.services || {};
    }

    activate(context: ActivationContext, name: string) {
        // добавляем сервисы
        if (this._services) {
            for (const p of Object.keys(this._services))
                context.register(p, this._services[p]);
        }

        if (this._lazy) {
            const saved = context.clone();

            return (cfg: ServiceMap) => {
                // защищаем контекст на случай исключения в процессе
                // активации
                const ct = saved.clone();
                try {
                    if (cfg) {
                        for (const k in cfg)
                            ct.register(k, cfg[k]);
                    }

                    return this._optional ? ct.resolve(this._name, this._default) : ct
                        .resolve(this._name);
                } catch (error) {
                    throw new ActivationError(this._name.toString(), ct.getStack(), error);
                }
            };
        } else {
            // добавляем сервисы
            if (this._services) {
                for (const p of Object.keys(this._services))
                    context.register(p, this._services[p]);
            }

            const v = this._optional ?
                context.resolve(this._name, this._default) :
                context.resolve(this._name);

            return v;
        }
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

        parts.push(this._name.toString());

        if (!isNull(this._default)) {
            parts.push(" = ");
            parts.push(this._default);
        }

        return parts.join("");
    }
}
