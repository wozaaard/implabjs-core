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

    $type<T, P extends any[], C extends new (...args: ExtractDependency<P, S>) => T>(target: C, ...params: P): StrictTypeRegistration<C, S>;
}


export declare function declare<S extends object>(): Declaration<S>;
