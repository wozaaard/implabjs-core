import { Constructor } from "../interfaces";
import { ActivationType } from "../di/interfaces";

namespace MyLib {
    interface Resolver<S> {
        <K extends keyof S>(name: K): S[K];
        <K extends keyof S>(lazy: K): (overrides?: {}) => S[K];
    }

    interface RegistrationOptions<S> {
        activation?: ActivationType;
        services?: BuilderContext<S>;
    }

    interface BuilderContext<S> {
        registerType<T extends Constructor, K extends string>(
            name: K,
            constructor: T,
            options?: RegistrationOptions<S>
        ): BuilderContext<S & { K: T }>;

        registerFactory<T, K extends string>(
            name: K,
            factory: (resolver: Resolver<S>) => T,
            options?: RegistrationOptions<S>
        ): BuilderContext<S & { K: T }>;

        registerInstance<T, K extends string>(
            name: K,
            instance: T,
            ownership?: boolean
        ): BuilderContext<S & { K: T }>;
    }
}

export = MyLib;
