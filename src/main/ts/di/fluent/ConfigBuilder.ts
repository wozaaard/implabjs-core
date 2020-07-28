import { Container } from "../Container";
import { ExtractDependency, ServiceRecordBuilder } from "./interfaces";

export class ConfigBuilder<S extends object, Y extends keyof S = keyof S> {
    register<K extends Y>(name: K, builder: (t: ServiceRecordBuilder<S[K], S>) => void | Promise<void>): ConfigBuilder<S, Exclude<Y, K>>;
    register<K extends Y, V>(name: S[K] extends ExtractDependency<V, S> ? K : never, value: V): ConfigBuilder<S, Exclude<Y, K>>;
    register<K extends Y>(name: K, value: S[K], raw: true): ConfigBuilder<S, Exclude<Y, K>>;
    register<K extends Y>(name: K, value: any, raw = false): ConfigBuilder<S, Exclude<Y, K>> {

        return this;
    }

    apply(container: Container<S>): PromiseLike<void> {
        
        return Promise.resolve();
    }
}
