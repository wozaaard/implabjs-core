import { primitive } from "../../safe";
import { TypeOfService, ContainerKeys, ActivationType, ILifetime } from "../interfaces";
import { ICancellation } from "../../interfaces";
import { Container } from "../Container";

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

export type InferReferenceType<S extends object, K extends ContainerKeys<S>, O> = O extends { default: infer X } ? (TypeOfService<S, K> | X) :
    O extends { optional: true } ? (TypeOfService<S, K> | undefined) :
    TypeOfService<S, K>;

export interface Resolver<S extends object> {
    <K extends ContainerKeys<S>, O extends LazyDependencyOptions>(this: void, name: K, opts: O): () => InferReferenceType<S, K, O>;
    <K extends ContainerKeys<S>, O extends DependencyOptions>(this: void, name: K, opts?: O): InferReferenceType<S, K, O>;
}

export interface DescriptorBuilder<S extends object, T> {
    factory(f: (resolve: Resolver<S>) => T): void;

    build<T2>(): DescriptorBuilder<S, T2>;

    override<K extends keyof S>(name: K, builder: RegistrationBuilder<S, S[K]>): this;
    override<K extends keyof S>(services: { [name in K]: RegistrationBuilder<S, S[K]> }): this;

    lifetime(lifetime: "singleton", typeId: any): this;
    lifetime(lifetime: ILifetime | Exclude<ActivationType, "singleton">): this;

    cleanup(cb: (item: T) => void): this;

    value(v: T): void;
}

export interface ContainerConfiguration<S extends object> {
    apply<S2 extends object>(target: Container<S2>, ct: ICancellation): Promise<Container<S2 & S>>;
}

export type RegistrationBuilder<S extends object, T> = (d: DescriptorBuilder<S, T>, ct?: ICancellation) => void | Promise<void>;

export type FluentRegistrations<K extends keyof S, S extends object> = { [k in K]: RegistrationBuilder<S, S[k]> };
