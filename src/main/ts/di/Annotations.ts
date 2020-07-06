import { Constructor } from "../interfaces";
import { primitive } from "../safe";

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

type Compatible<T1, T2> = T1 extends T2 ? any : never;

type ExtractService<K, S> = K extends keyof S ? S[K] : K;

type ExtractDependency<D, S> = D extends { $dependency: infer K } ?
    D extends { lazy: true } ? () => ExtractService<K, S> : ExtractService<K, S> :
    WalkDependencies<D, S>;

type WalkDependencies<D, S> = D extends primitive ? D :
    { [K in keyof D]: ExtractDependency<D[K], S> };

interface Services<S> {
    get<K extends keyof S>(name: K): Dependency<K>;

    lazy<K extends keyof S>(name: K): Lazy<K>;

    build<T extends object>(): Builder<T, S>;
}

export declare function services<S extends object>(): Services<S>;

export declare function build<T = never, S = any>(): Builder<T, S>;

export class Builder<T, S> {
    consume<P extends any[]>(...args: P) {
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

    cast<T2 extends T>(): Builder<T2, S> {
        return this as Builder<T2, S>;
    }

    get<K extends keyof S>(name: K): Dependency<K> {
        throw new Error();
    }

    lazy<K extends keyof S>(name: K): Lazy<K> {
        throw new Error();
    }


}
