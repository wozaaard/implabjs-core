import { Resolver, ServiceModule, LazyDependencyOptions, DependencyOptions } from "./interfaces";
import { AnnotationBuilder } from "../Annotations";
import { Container } from "../Container";
import { Descriptor, ILifetime, ContainerKeys } from "../interfaces";
import { ActivationContext } from "../ActivationContext";

export class DescriptorBuilder<T, S extends object> {
    readonly _container: Container<S>;
    readonly _cb: (d: Descriptor<S, T>) => void;

    constructor(container: Container<S>, cb: (d: Descriptor<S, T>) => void) {
        this._container = container;
        this._cb = cb;
    }
    service(service: AnnotationBuilder<T, S> | ServiceModule<T, S>) {

    }

    factory(f: (resolve: Resolver<S>, activate: (lifetime: ILifetime, factory: () => any, cleanup?: (item: any) => void) => any) => T): void {
        this._cb({
            activate(context: ActivationContext<S>) {
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

                const activate = (lifetime: ILifetime, factory: () => any, cleanup?: (item: any) => void) => {
                    if (lifetime.has()) {
                        return lifetime.get();
                    } else {
                        lifetime.enter();
                        const instance = factory();
                        lifetime.store(instance, cleanup);
                        return instance;
                    }

                };

                return f(resolve, activate);
            }
        });
    }

    value(v: T): void {
        this._cb({
            activate() {
                return v;
            }
        });
    }

}
