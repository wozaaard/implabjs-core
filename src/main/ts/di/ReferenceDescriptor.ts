import { argumentNotEmptyString, each } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { Descriptor, PartialServiceMap, TypeOfService, ContainerKeys } from "./interfaces";

export interface ReferenceDescriptorParams<S extends object, K extends ContainerKeys<S>> {
    /**
     * The name of the descriptor
     */
    name: K;

    /**
     * The flag that indicates that the referenced service isn't required to exist.
     * If the reference is optional and the referenced service doesn't exist,
     * the undefined or a default value will be returned.
     */
    optional?: boolean;

    /**
     * a default value for the reference when the referenced service doesn't exist.
     */
    default?: TypeOfService<S, K>;

    /**
     * The service overrides
     */
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

    /** This method activates the referenced service if one exists
     * @param context activation context which is used during current activation
     */
    activate(context: ActivationContext<S>): any {
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
