import { Constructor } from "../interfaces";

export interface InjectOptions {
    lazy?: boolean;
}

interface Dependency<K extends keyof any> {
    $dependency: K;

    lazy?: boolean;
}

interface Lazy<K extends keyof any> extends Dependency<K> {
    lazy: true;
}

type Setter<T = any> = (v: T) => void;

type Compatible<T1, T2> = T1 extends T2 ? any : never;

type ExtractService<K, S> = K extends keyof S ? S[K] : K;

type ExtractDependency<D, S> = D extends { $dependency: infer K } ? D extends { lazy: true } ? () => ExtractService<K, S> : ExtractService<K, S> : VisitDependency<D, S>;

type VisitDependency<D, S> = D extends {} ? { [K in keyof D]: ExtractDependency<D[K], S> } : D;

interface Config<S> {
    dependency<K extends keyof S>(name: K): Dependency<K>;

    lazy<K extends keyof S>(name: K): Lazy<K>;

    build<T>(): Builder<T, S>;
}

export declare function services<S extends object>(): Config<S>;

export class Builder<T, S> {
    consume<P extends any[]>(...args: P) {
        return <C extends new (...args: ExtractDependency<P, S>) => T>(constructor: C) => {
        };
    }

    inject<K extends keyof S>(dependency: K) {
        // K = "bar"
        // M = "setValue"
        // S[K] = Bar
        // T[M] = (value: string) => void
        // P[m] = (value: V) => void
        return <P, M extends keyof (T | P)>(target: P, memberName: M, descriptor: TypedPropertyDescriptor<Compatible<T[M], Setter<S[K]>>>) => {

        };
    }

    cast<T2 extends T>(): Builder<T2, S> {
        return this as Builder<T2, S>;
    }

}
