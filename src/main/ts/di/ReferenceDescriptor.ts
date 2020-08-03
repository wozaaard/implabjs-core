import { argumentNotEmptyString, each } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { Descriptor, PartialServiceMap, TypeOfService, ContainerKeys } from "./interfaces";

export interface ReferenceDescriptorParams<S extends object, K extends ContainerKeys<S>> {
    name: K;
    optional?: boolean;
    default?: TypeOfService<S, K>;
    services?: PartialServiceMap<S>;
}

export class ReferenceDescriptor<S extends object = any, K extends ContainerKeys<S> = ContainerKeys<S>>
    implements Descriptor<S, TypeOfService<S, K>> {

    _name: K;

    _optional = false;

    _default: TypeOfService<S, K> | undefined;

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

        const res = this._optional ?
            context.resolve(this._name, this._default) :
            context.resolve(this._name);

        return res;
    }

    toString() {
        const opts = [];
        if (this._optional)
            opts.push("optional");

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
