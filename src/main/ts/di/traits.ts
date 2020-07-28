import { isPrimitive } from "../safe";
import { Descriptor } from "./interfaces";
import { ServicesDeclaration, ServiceRecordBuilder, ServiceModule, RegistrationBuilder, ExtractDependency } from "./fluent/interfaces";
import { AnnotaionBuilder } from "./Annotations";
import { FactoryBuilder } from "./fluent/FactoryBuilder";
import { ConstructorBuilder } from "./fluent/ConstructorBuiler";

export function isDescriptor(x: any): x is Descriptor {
    return (!isPrimitive(x)) &&
        (x.activate instanceof Function);
}

export function declare<S extends object>(): ServicesDeclaration<S> {
    return {
        annotate<T>() {
            return new AnnotaionBuilder<T, S>();
        },
        build<T>(): ServiceRecordBuilder<T, S> {
            return {
                factory<P extends any[], F extends (...args: ExtractDependency<P, S>) => T>(
                    target: F,
                    ...params: P
                ): FactoryBuilder<F, S> {
                    return new FactoryBuilder(target, params);
                },

                type<P extends any[], C extends new (...args: ExtractDependency<P, S>) => T>(
                    target: C, ...params: P
                ): ConstructorBuilder<C, S> {
                    return new ConstructorBuilder(target, params);
                },

                wired<M extends keyof any>(module: ServiceModule<T, S, M>, m?: M): RegistrationBuilder<T, S> {
                    const service = m ?
                        module[m] :
                        (module as ServiceModule<T, S>).service;
                    if (!service)
                        throw new Error("The specified module doen's provides a service annotation");
                    return service.getRegistrationBuilder();
                }
            };
        },
        configure() {
            throw new Error();
        },
        dependency() {
            throw new Error();
        }
    };
}
