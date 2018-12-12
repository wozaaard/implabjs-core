import { ServiceDescriptor, ServiceDescriptorParams } from "./ServiceDescriptor";
import { Constructor, Factory } from "../interfaces";
import { argumentNotNull, isPrimitive } from "../safe";

export interface TypeServiceDescriptorParams extends ServiceDescriptorParams {
    type: Constructor;
}

export class TypeServiceDescriptor extends ServiceDescriptor {
    _type: Constructor;

    constructor(opts: TypeServiceDescriptorParams) {
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
