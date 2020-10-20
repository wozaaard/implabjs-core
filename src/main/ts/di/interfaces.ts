import { IDestroyable } from "../interfaces";
import { ActivationContext } from "./ActivationContext";
import { LifetimeManager } from "./LifetimeManager";

export interface Descriptor<S extends object = any, T = any> {
    activate(context: ActivationContext<S>): T;
}

export type ServiceMap<S extends object> = {
    [k in keyof S]: Descriptor<S, S[k]>;
};

export type ContainerKeys<S extends object> = keyof S | keyof ContainerProvided<S>;

export type TypeOfService<S extends object, K> =
    K extends keyof ContainerProvided<S> ? ContainerProvided<S>[K] :
    K extends keyof S ? S[K] : never;

export type ContainerServiceMap<S extends object> = {
    [K in ContainerKeys<S>]: Descriptor<S, TypeOfService<S, K>>;
};

export type PartialServiceMap<S extends object> = {
    [k in keyof S]?: Descriptor<S, S[k]>;
};

export interface ServiceLocator<S extends object> {
    resolve<K extends ContainerKeys<S>>(name: K, def?: TypeOfService<S, K>): TypeOfService<S, K>;
    resolve<K extends ContainerKeys<S>>(name: K, def?: undefined): TypeOfService<S, K> | undefined;
}

export interface ServiceContainer<S extends object> extends ServiceLocator<S>, IDestroyable {
    getLifetimeManager(): LifetimeManager;
    register<K extends keyof S>(name: K, service: Descriptor<S, S[K]>): this;
    register(services: PartialServiceMap<S>): this;

    createChildContainer(): ServiceContainer<S>;
}

export interface ContainerProvided<S extends object> {
    container: ServiceLocator<S>;

    childContainer: ServiceContainer<S>;
}

export type ContainerRegistered<S extends object> = /*{
    [K in Exclude<keyof S, keyof ContainerProvided<S>>]: S[K];
};*/
    Exclude<S, ContainerProvided<S>>;

export type ActivationType = "singleton" | "container" | "hierarchy" | "context" | "call";

/**
 * Интерфейс для управления жизнью экземпляра объекта. Каждая регистрация имеет
 * свой собственный объект `ILifetime`, который создается при первой активации
 */
export interface ILifetime {
    /** Проверяет, что уже создан экземпляр объекта */
    has(): boolean;

    get(): any;

    initialize(context: ActivationContext<any>): void;

    store(item: any, cleanup?: (item: any) => void): void;
}
