import { Constructor } from "../interfaces";

export interface InjectOptions {
    lazy?: boolean;
}

type Setter<T = any> = (v: T) => void;

type Injector<T> = {
    [k in keyof T]: Setter;
};

type Compatible<T1, T2> = T1 extends T2 ? any : never;

type SetterType<T> = T extends (v: infer V) => void ? V : never;

type Tuple<T = any> = Parameters<(...args: T[]) => void>;

interface Newable<A extends Tuple, T> {
    new (...params: A): T;
    prototype: T;
}

type MapTuple<T, A extends (keyof T)[]> = { [K in keyof A] : K extends number ? T[ A[K] ] : A[K] };

export class Builder<T, S> {
    provides() {
        return <C extends Constructor<T>>(constructor: C) => {
            return constructor;
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

    dependencies<D extends (keyof S)[]>(...deps: D) {
        return <C extends Constructor<T>>(constructor: MapTuple<S, D> extends ConstructorParameters<C> ? C : never) => {
            return constructor;
        } ;
    }

}
