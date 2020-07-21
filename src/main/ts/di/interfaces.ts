import { ActivationContext } from "./ActivationContext";
import { IDestroyable } from "../interfaces";

export interface Descriptor<S extends object = any, T = any> {
    activate(context: ActivationContext<S>): T;

    clone(): this;
}

export type ServiceMap<S extends object> = {
    [k in keyof S]: Descriptor<S, S[k]>;
};

export type ContainerKeys<S extends object> = keyof S | keyof ContainerProvided<S>;

export type ContainerResolve<S extends object, K> =
    K extends keyof ContainerProvided<S> ? ContainerProvided<S>[K] :
    K extends keyof S ? S[K] : never;

export type ContainerServiceMap<S extends object> = {
    [K in ContainerKeys<S>]: Descriptor<S, ContainerResolve<S, K>>;
};

export type PartialServiceMap<S extends object> = {
    [k in keyof S]?: Descriptor<S, S[k]>;
};

export interface Resolver<S extends object> {
    resolve<K extends ContainerKeys<S>>(name: K, def?: ContainerResolve<S, K>): ContainerResolve<S, K>;
}

export interface ContainerProvided<S extends object> {
    container: Resolver<S>;
}

export type ContainerRegistered<S extends object> = /*{
    [K in Exclude<keyof S, keyof ContainerProvided<S>>]: S[K];
};*/
    Exclude<S, ContainerProvided<S>>;

export type ActivationType = "singleton" | "container" | "hierarchy" | "context" | "call";

export interface ILifetimeManager extends IDestroyable {
    initialize(id: string, context: ActivationContext<any>): ILifetime;
}

export interface ILifetime {
    has(): boolean;
    get(): any;
    store(item: any, cleanup?: (item: any) => void): void;
}