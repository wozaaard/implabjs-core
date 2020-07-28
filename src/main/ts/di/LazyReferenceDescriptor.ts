import { argumentNotEmptyString, each } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { Descriptor, PartialServiceMap, ContainerResolve, ContainerKeys } from "./interfaces";
import { ActivationError } from "./ActivationError";

export interface ReferenceDescriptorParams<S extends object, K extends ContainerKeys<S>> {
    name: K;
    optional?: boolean;
    default?: ContainerResolve<S, K>;
    services?: PartialServiceMap<S>;
}

export class LazyReferenceDescriptor<S extends object = any, K extends ContainerKeys<S> = ContainerKeys<S>>
    implements Descriptor<S, ((args?: PartialServiceMap<S>) => ContainerResolve<S, K>)> {

    _name: K;

    _optional = false;

    _default: ContainerResolve<S, K> | undefined;

    _services: PartialServiceMap<S>;

    constructor(opts: ReferenceDescriptorParams<S, K>) {
        argumentNotEmptyString(opts && opts.name, "opts.name");
        this._name = opts.name;
        this._optional = !!opts.optional;
        this._default = opts.default;

        this._services = (opts.services || {}) as PartialServiceMap<S>;
    }

    activate(context: ActivationContext<S>) {
        // добавляем сервисы
        if (this._services) {
            each(this._services, (v, k) => context.register(k, v));
        }

        const saved = context.clone();

        return (cfg?: PartialServiceMap<S>) => {
            // защищаем контекст на случай исключения в процессе
            // активации
            const ct = cfg ? saved.clone() : saved;
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

    }

    toString() {
        const opts = [];
        if (this._optional)
            opts.push("optional");

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
