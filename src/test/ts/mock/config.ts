import { Foo } from "./Foo";
import { Bar } from "./Bar";
import { ActivationType } from "../di/interfaces";
import { Builder } from "../di/Annotations";
import { Box } from "./Box";

interface RegistrationOptions {
    activation?: ActivationType;
}

interface Dependency<K extends keyof any> {
    $dependency: K;

    lazy?: boolean;
}

interface Lazy<K extends keyof any> extends Dependency<K> {
    lazy: true;
}

type PromiseOrValue<T> = T | PromiseLike<T>;

interface ConfigBuilder<S> {
    build<K extends keyof S, T = S[K]>(name: K): Builder<T, S>;

    dependency<K extends keyof S>(name: K): Dependency<K>;

    lazy<K extends keyof S>(name: K): Lazy<K>;

    mapTo<K extends keyof S>(name: K, ctor: () => PromiseOrValue<new (...args: any[]) => S[K]>): ConfigBuilder<S>;

}

interface ContainerServices {
    barBox: Box<Bar>;

    foo: Foo;

    bar: Bar;

    password: string;

    user: string;

    timeout: number;
}

declare function load<M, C extends keyof M>(m: PromiseLike<M>, name: C): () => PromiseLike<M[C]>;

const t = {
    barBox: load(import("./Box"), "Box"),

    foo: async () => (await import("./Bar")).Bar,

    bar: Bar,

    password: String,

    user: String,

    timeout: Number
};

export declare const config: ConfigBuilder<ContainerServices>;
