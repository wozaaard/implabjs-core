import { ServiceDescriptor, ServiceDescriptorParams } from "./ServiceDescriptor";
import { Constructor, Factory } from "../interfaces";
import { argumentNotNull, isPrimitive } from "../safe";

export interface TypeServiceDescriptorParams<S, T extends object, P extends any[]> extends ServiceDescriptorParams<S, T, P> {
    type: Constructor<T>;
}

export class TypeServiceDescriptor<S, T extends object, P extends any[]> extends ServiceDescriptor<S, T, P> {
    _type: Constructor;

    constructor(opts: TypeServiceDescriptorParams<S, T, P>) {
        super(opts);
        argumentNotNull(opts && opts.type, "opts.type");

        const ctor = this._type = opts.type;

        if (this._params) {
            if (this._params.length) {
                this._factory = (...args) => {
                    const t = Object.create(ctor.prototype);
                    const inst = ctor.apply(t, args);
                    return isPrimitive(inst) ? t : inst;
                };
            } else {
                this._factory = arg => {
                    return new ctor(arg);
                };
            }
        } else {
            this._factory = () => {
                return new ctor();
            };
        }

    }

    toString() {
        // @constructor {singleton} foo/bar/Baz
        return ``;
    }
}
