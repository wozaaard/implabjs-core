import { primitive } from "../../safe";
import { ActivationType } from "../interfaces";

type ExtractService<K, S> = K extends keyof S ? S[K] : K;

type ExtractDependency<D, S> = D extends { $dependency: infer K } ?
    D extends { lazy: true } ? () => ExtractService<K, S> : ExtractService<K, S> :
    D extends { $type: new (...args: any[]) => infer I } ? I :
    D extends { $factory: (...args: any[]) => infer R } ? R :
    WalkDependencies<D, S>;

type WalkDependencies<D, S> = D extends primitive ? D :
    { [K in keyof D]: ExtractDependency<D[K], S> };

export interface TypeBuilder<T, S extends object> {
    type<P extends any[], C extends new (...args: ExtractDependency<P, S>) => T>(
        target: C, ...params: P): ConstructorBuilder<C, S>;
    factory<P extends any[], F extends (...args: ExtractDependency<P, S>) => T>(
        target: F, ...params: P): FactoryBuilder<F, S>;
}

export interface ServiceBuilder<T, S extends object> {
    override<K extends keyof S>(name: K, builder: S[K] | ((t: TypeBuilder<S[K], S>) => any)): this;
    activate(activation: ActivationType): this;
    inject<M extends keyof T, P extends any[]>(member: T[M] extends (...params: ExtractDependency<P, S>) => any ? M : never, ...params: P): this;
}

export interface ConstructorBuilder<C extends new (...args: any[]) => any, S extends object> extends ServiceBuilder<InstanceType<C>, S> {
    $type: C;
}

export interface FactoryBuilder<F extends (...args: any[]) => any, S extends object> extends ServiceBuilder<ReturnType<F>, S> {
    $factory: F;
}

export interface ConfigBuilder<S extends object, Y extends keyof S = keyof S> {
    register<K extends Y>(name: K, builder: S[K] | ((t: TypeBuilder<S[K], S>) => any)): ConfigBuilder<S, Exclude<Y, K>>;
}
