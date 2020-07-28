import { ServiceDescriptor, ServiceDescriptorParams } from "./ServiceDescriptor";
import { argumentNotNull, isPrimitive } from "../safe";

export interface TypeServiceDescriptorParams<S extends object, T extends object, P extends any[]> extends ServiceDescriptorParams<S, T, P> {
    type: new (...args: any[]) => T;
}

export class TypeServiceDescriptor<S extends object, T extends object, P extends any[]> extends ServiceDescriptor<S, T, P> {
    _type: new (...args: any[]) => T;

    constructor(opts: TypeServiceDescriptorParams<S, T, P>) {
        super(opts);
        argumentNotNull(opts && opts.type, "opts.type");

        const ctor = this._type = opts.type;

        if (this._params) {
            if (this._params.length) {
                this._factory = (...args) => {
                    /*const t = Object.create(ctor.prototype);
                    const inst = ctor.apply(t, args);
                    return isPrimitive(inst) ? t : inst;*/
                    return new ctor(...args);
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
