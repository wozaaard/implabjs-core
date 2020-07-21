import { ServiceDescriptor, ServiceDescriptorParams } from "./ServiceDescriptor";
import { argumentNotNull, oid } from "../safe";

export interface FactoryServiceDescriptorParams<S extends object, T, P extends any[]> extends ServiceDescriptorParams<S, T, P> {
    factory: (...args: P) => T;
}

export class FactoryServiceDescriptor<S extends object, T, P extends any[]> extends ServiceDescriptor<S, T, P> {
    constructor(opts: FactoryServiceDescriptorParams<S, T, P>) {
        super(opts);

        argumentNotNull(opts && opts.factory, "opts.factory");

        // bind to null
        this._factory = (...args) => opts.factory.apply(null, args as any);

    }
}
