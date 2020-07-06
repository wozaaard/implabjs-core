import { isNull, argumentNotEmptyString, each, keys } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { ServiceMap, Descriptor, PartialServiceMap } from "./interfaces";
import { ActivationError } from "./ActivationError";

export interface ReferenceDescriptorParams<S, K extends keyof S> {
    name: K;
    lazy?: boolean;
    optional?: boolean;
    default?: S[K];
    services?: PartialServiceMap<S>;
}

function defined<T>(v: T | undefined) {
    if (v === undefined)
        throw Error();
    return v;
}

export class ReferenceDescriptor<S = any, K extends keyof S = keyof S> implements Descriptor<S, S[K] | ((args?: PartialServiceMap<S> ) => S[K])> {
    _name: K;

    _lazy = false;

    _optional = false;

    _default: S[K] | undefined;

    _services: PartialServiceMap<S>;

    constructor(opts: ReferenceDescriptorParams<S, K>) {
        argumentNotEmptyString(opts && opts.name, "opts.name");
        this._name = opts.name;
        this._lazy = !!opts.lazy;
        this._optional = !!opts.optional;
        this._default = opts.default;

        this._services = (opts.services || {}) as ServiceMap<S>;
    }

    activate(context: ActivationContext<S>) {
        // добавляем сервисы
        if (this._services) {
            each(this._services, (v, k) => context.register(k, v));
        }

        if (this._lazy) {
            const saved = context.clone();

            return (cfg?: PartialServiceMap<S>) => {
                // защищаем контекст на случай исключения в процессе
                // активации
                const ct = saved.clone();
                try {
                    if (cfg) {
                        each(cfg, (v, k) => ct.register(k, v));
                    }

                    return this._optional ? ct.resolve(this._name, this._default) : ct
                        .resolve(this._name);
                } catch (error) {
                    throw new ActivationError(this._name.toString(), ct.getStack(), error);
                }
            };
        } else {
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

        if (this._default !== undefined && this._default !== null) {
            parts.push(" = ");
            parts.push(String(this._default));
        }

        return parts.join("");
    }
}
