import { ActivationContext } from "./ActivationContext";

export interface Descriptor<S = any, T = any> {
    activate(context: ActivationContext<S>): T;
}

export type ServiceMap<S> = {
    [k in keyof S]: Descriptor<S, S[k]>;
};

export type PartialServiceMap<S> = {
    [k in keyof S]?: Descriptor<S, S[k]>;
};

export interface Resolver<S> {
    resolve<K extends keyof ContainerServices<S>, T extends ContainerServices<S>[K] = ContainerServices<S>[K]>(name: K, def?: T): T;
}
export type ContainerServices<S> = S & {
    container: Resolver<S>;
};
export type ActivationType = "singleton" | "container" | "hierarchy" | "context" | "call";
