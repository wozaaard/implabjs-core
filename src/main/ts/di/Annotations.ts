import { primitive } from "../safe";
import { TypeRegistration } from "./Configuration";

export interface InjectOptions {
    lazy?: boolean;
}

export interface Dependency<K extends keyof any> {
    $dependency: K;

    lazy?: boolean;
}

export interface Lazy<K extends keyof any> extends Dependency<K> {
    lazy: true;
}

type Compatible<T1, T2> = T2 extends T1 ? any : never;

type ExtractService<K, S> = K extends keyof S ? S[K] : K;

type ExtractDependency<D, S> = D extends { $dependency: infer K } ?
    D extends { lazy: true } ? () => ExtractService<K, S> : ExtractService<K, S> :
    WalkDependencies<D, S>;

type WalkDependencies<D, S> = D extends primitive ? D :
    { [K in keyof D]: ExtractDependency<D[K], S> };

export class Builder<T, S extends object> {
    declare<P extends any[]>(...args: P) {
        return <C extends new (...args: ExtractDependency<P, S>) => T>(constructor: C) => {

        };
    }

    inject<P extends any[]>(...args: P) {
        // K = "bar"
        // M = "setValue"
        // S[K] = Bar
        // T[M] = (value: string) => void
        // P[m] = (value: V) => void
        return <X extends { [m in M]: (...args: any) => any }, M extends keyof (T | X)>(
            target: X,
            memberName: M,
            descriptor: TypedPropertyDescriptor<Compatible<(...args: ExtractDependency<P, S>) => any, T[M]>>
        ) => {

        };
    }

    getDescriptor(): TypeRegistration<T, any, S> {
        throw new Error();
    }

}

interface Declaration<S extends object> {
    define<T>(): Builder<T, S>;

    dependency<K extends keyof S>(name: K, opts: { lazy: true }): Lazy<K>;
    dependency<K extends keyof S>(name: K, opts?: any): Dependency<K>;

    config(): Config<S>;
}

type ServiceModule<T, S extends object, M extends string = "service"> = {
    [m in M]: Builder<T, S>;
};

export interface Config<S extends object, Y extends keyof S = keyof S> {
    register<K extends Y>(name: K, builder: Builder<S[K], S>): Config<S, Exclude<Y, K>>;
    register<K extends Y>(name: K, m: Promise<ServiceModule<S[K], S>>): Config<S, Exclude<Y, K>>;
    register<K extends Y, M extends string>(name: K, m: Promise<ServiceModule<S[K], S, M>>, x: M): Config<S, Exclude<Y, K>>;

}

export declare function declare<S extends object>(): Declaration<S>;
