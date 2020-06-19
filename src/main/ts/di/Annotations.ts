import { Constructor } from "../interfaces";

export interface InjectOptions {
    lazy?: boolean;
}

type Setter<T = any> = (v: T) => void;

type Injector<T> = {
    [k in keyof T]: Setter;
};

export class Builder<T, S> {
    provides(name: string) {
        return <C extends Constructor<T>>(constructor: C) => {
            return constructor;
        };
    }

    inject<K extends keyof S>(dependency: K) {
        return <M extends keyof T>(target: any, memberName: M, descriptor: TypedPropertyDescriptor<Setter<S[K]>> ) => {

        };
    }

    prop<K extends keyof S>(dependency: K) {
        return <M extends keyof T>(target: any, memberName: M, descriptor: TypedPropertyDescriptor<S[K]> ) => {

        };
    }
}

export function inject<I extends Injector<I> >(dependency: string) {
    return <M extends keyof I>(target: any, memberName: M, descriptor: TypedPropertyDescriptor<I[M]> ) => {

    };
}
