import { Descriptor, PartialServiceMap, ILifetime, ContainerKeys } from "../interfaces";
import { ActivationContext } from "../ActivationContext";
import { each } from "../../safe";
import { DependencyOptions, LazyDependencyOptions, Resolver } from "./interfaces";

export interface DescriptorImplArgs<S extends object, T> {
    lifetime: ILifetime;

    factory: (resolve: Resolver<S>) => T;

    cleanup?: (item: T) => void;

    overrides?: PartialServiceMap<S>;
}

export class DescriptorImpl<S extends object, T> implements Descriptor<S, T> {

    private readonly _overrides?: PartialServiceMap<S>;

    private readonly _lifetime: ILifetime;

    private readonly _factory: (resolve: Resolver<S>) => T;

    private readonly _cleanup?: (item: T) => void;

    constructor(args: DescriptorImplArgs<S, T>) {
        this._lifetime = args.lifetime;
        this._factory = args.factory;
        if (args.cleanup)
            this._cleanup = args.cleanup;
        if (args.overrides)
            this._overrides = args.overrides;
    }

    activate(context: ActivationContext<S>): T {

        if (this._lifetime.has())
            return this._lifetime.get();

        this._lifetime.initialize(context);

        if (this._overrides)
            each(this._overrides, (v, k) => context.register(k, v));

        const resolve = (name: ContainerKeys<S>, opts?: DependencyOptions | LazyDependencyOptions) => {
            if (opts && "lazy" in opts && opts.lazy) {
                const c2 = context.clone();
                return () => {
                    return opts.optional ? c2.resolve(name, opts.default) : c2.resolve(name);
                };
            } else {
                return opts && opts.optional ? context.resolve(name, opts.default) : context.resolve(name);
            }
        };

        const instance = this._factory.call(undefined, resolve);

        this._lifetime.store(instance, this._cleanup);

        return instance;
    }

}
