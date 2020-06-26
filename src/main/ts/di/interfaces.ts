import { isPrimitive } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { Constructor, Factory } from "../interfaces";

export interface Descriptor<T = any> {
    activate<S>(context: ActivationContext<S>): T;
}

export function isDescriptor(x: any): x is Descriptor {
    return (!isPrimitive(x)) &&
        (x.activate instanceof Function);
}

export type ServiceMap<S = any> = {
    [k in keyof S]: Descriptor<S[k]>;
}

export enum ActivationType {
    Singleton = 1,
    Container,
    Hierarchy,
    Context,
    Call
}

export interface RegistrationWithServices<S> {
    services?: ServiceMap<S>;
}

export interface ServiceRegistration<T, P, S> extends RegistrationWithServices<S> {

    activation?: "singleton" | "container" | "hierarchy" | "context" | "call";

    params?: P;

    inject?: object | object[];

    cleanup?: ((instance: T) => void) | string;
}

export interface TypeRegistration<T, P, S> extends ServiceRegistration<T, P, S> {
    $type: string | Constructor<T>;
}

export interface FactoryRegistration<T, P, S> extends ServiceRegistration<T, P, S> {
    $factory: string | Factory<T>;
}

export interface ValueRegistration<T> {
    $value: T;
    parse?: boolean;
}

export interface DependencyRegistration<S, K extends keyof S> extends RegistrationWithServices<S> {
    $dependency: K;
    lazy?: boolean;
    optional?: boolean;
    default?: S[K];
}

export function isTypeRegistration(x: any): x is TypeRegistration<any, any, any> {
    return (!isPrimitive(x)) && ("$type" in x);
}

export function isFactoryRegistration(x: any): x is FactoryRegistration<any, any, any> {
    return (!isPrimitive(x)) && ("$factory" in x);
}

export function isValueRegistration(x: any): x is ValueRegistration<any> {
    return (!isPrimitive(x)) && ("$value" in x);
}

export function isDependencyRegistration<S>(x: any): x is DependencyRegistration<S, keyof S> {
    return (!isPrimitive(x)) && ("$dependency" in x);
}
