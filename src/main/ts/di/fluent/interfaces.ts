import { primitive } from "../../safe";
import { AnnotationBuilder } from "../Annotations";
import { ILifetime, TypeOfService, ContainerKeys } from "../interfaces";

export interface DependencyOptions {
    optional?: boolean;
    default?: any;
}

export interface LazyDependencyOptions extends DependencyOptions {
    lazy: true;
}

export type ExtractService<K, S> = K extends keyof S ? S[K] : never;

export type ExtractDependency<D, S> = D extends { $dependency: infer K } ?
    D extends { lazy: true } ? () => ExtractService<K, S> : ExtractService<K, S> :
    D extends { $type: new (...args: any[]) => infer I } ? I :
    D extends { $factory: (...args: any[]) => infer R } ? R :
    WalkDependencies<D, S>;

export type WalkDependencies<D, S> = D extends primitive ? D :
    { [K in keyof D]: ExtractDependency<D[K], S> };

export type ServiceModule<T, S extends object, M extends keyof any = "service"> = {
    [m in M]: AnnotationBuilder<T, S>;
};

export type InferReferenceType<S extends object, K extends keyof ContainerKeys<S>, O> = O extends { default: infer X } ? (TypeOfService<S, K> | X) :
    O extends { optional: true } ? (TypeOfService<S, K> | undefined) :
    TypeOfService<S, K>;

export interface Resolver<S extends object> {
    <K extends keyof ContainerKeys<S>, O extends LazyDependencyOptions>(this: void, name: K, opts: O): () => InferReferenceType<S, K, O>;
    <K extends keyof ContainerKeys<S>, O extends DependencyOptions>(this: void, name: K, opts?: O): InferReferenceType<S, K, O>;
}

export interface DescriptorBuilder<T, S extends object> {
    service(service: AnnotationBuilder<T, S> | ServiceModule<T, S>): void;

    factory(f: (resolve: Resolver<S>, activate: <T2>(lifetime: ILifetime, factory: () => T2, cleanup?: (item: T2) => void) => T2) => T): void;

    value(v: T): void;
}

export interface Configuration<S extends object, Y extends keyof S = keyof S> {
    register<K extends Y>(name: K, builder: (d: DescriptorBuilder<S[K], S>) => void): Configuration<S, Exclude<Y, K>>;
}
