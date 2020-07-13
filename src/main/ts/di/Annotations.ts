import { primitive } from "../safe";
import { TypeRegistration, DependencyRegistration, LazyDependencyRegistration, Registration, StrictTypeRegistration } from "./Configuration";

export interface InjectOptions {
    lazy?: boolean;
}

type Compatible<T1, T2> = T2 extends T1 ? any : never;

type ExtractService<K, S> = K extends keyof S ? S[K] : K;

type ExtractDependency<D, S> = D extends { $dependency: infer K } ?
    D extends { lazy: true } ? () => ExtractService<K, S> : ExtractService<K, S> :
    D extends { $type: new (...args: any[]) => infer I } ? I :
    WalkDependencies<D, S>;

type WalkDependencies<D, S> = D extends primitive ? D :
    { [K in keyof D]: ExtractDependency<D[K], S> };

export class Builder<T, S extends object> {
    declare<P extends any[]>(...args: P) {
        return <C extends new (...args: ExtractDependency<P, S>) => T>(constructor: C) => {

        };
    }

    inject<P extends any[]>(...args: P) {
        return <X extends { [m in M]: (...args: any) => any }, M extends keyof (T | X)>(
            target: X,
            memberName: M,
            descriptor: TypedPropertyDescriptor<Compatible<(...args: ExtractDependency<P, S>) => any, T[M]>>
        ) => {

        };
    }

    getDescriptor(): TypeRegistration<new () => T, S> {
        throw new Error();
    }

}

export interface DependencyOptions<T> {
    optional?: boolean;
    default?: T;
}

export interface LazyDependencyOptions<T> extends DependencyOptions<T> {
    lazy: true;
}

interface Declaration<S extends object> {
    define<T>(): Builder<T, S>;

    dependency<K extends keyof S>(name: K, opts: LazyDependencyOptions<S[K]>): LazyDependencyRegistration<S, K>;
    dependency<K extends keyof S>(name: K, opts?: DependencyOptions<S[K]>): DependencyRegistration<S, K>;

    $type<P extends any[], C extends new (...args: ExtractDependency<P, S>) => any>(target: C, ...params: P): StrictTypeRegistration<C, S>;

    configure(): Config<S>;
}

type ServiceModule<T, S extends object, M extends string = "service"> = {
    [m in M]: Builder<T, S>;
};

type PromiseOrValue<T> = PromiseLike<T> | T;


export interface Config<S extends object, Y extends keyof S = keyof S> {
    register<K extends Y>(name: K, m: { $from: Promise<ServiceModule<S[K], S>> }): Config<S, Exclude<Y, K>>;
    register<K extends Y, M extends string>(name: K, m: { $from: Promise<ServiceModule<S[K], S, M>>, service: M }): Config<S, Exclude<Y, K>>;

    register<K extends Y>(name: K, m: Registration<S[K], S>): Config<S, Exclude<Y, K>>;
    registerType<K extends Y, P extends any[]>(
        name: K, $type: new (...args: ExtractDependency<P, S>) => S[K], ...params: P): Config<S, Exclude<Y, K>>;
}

export declare function declare<S extends object>(): Declaration<S>;
