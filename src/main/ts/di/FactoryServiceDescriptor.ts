import { ServiceDescriptor, ServiceDescriptorParams } from "./ServiceDescriptor";
import { Factory } from "../interfaces";
import { argumentNotNull, oid } from "../safe";
import { ActivationType } from "./interfaces";

export interface FactoryServiceDescriptorParams extends ServiceDescriptorParams {
    factory: Factory;
}

export class FactoryServiceDescriptor extends ServiceDescriptor {
    constructor(opts: FactoryServiceDescriptorParams) {
        super(opts);

        argumentNotNull(opts && opts.factory, "opts.factory");

        // bind to null
        this._factory = (...args) => opts.factory.apply(null, args);

        if (opts.activation === ActivationType.Singleton) {
            this._cacheId = oid(opts.factory);
        }
    }
}
