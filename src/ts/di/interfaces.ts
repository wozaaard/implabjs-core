import { isNull } from "../safe";
import { ActivationContext } from "./ActivationContext";

export interface Descriptor {
    activate(context: ActivationContext, name?: string);
    isInstanceCreated(): boolean;
    getInstance();
}

export type Constructor<T = {}> = new (...args: any[]) => T;

export type Factory<T = {}> = (...args: any[]) => T;

export function isDescriptor(instance): instance is Descriptor {
    return (!isNull(instance)) &&
        ("activate" in instance);
}

export interface ServiceMap {
    [s: string]: Descriptor;
}

export enum ActivationType {
    Singleton,
    Container,
    Hierarchy,
    Context,
    Call
}

export interface RegistrationWithServices {
    services?: object;
}

export interface ServiceRegistration extends RegistrationWithServices {
    $type?: string | Constructor;

    $factory?: string | Factory;

    activation?: "singleton" | "container" | "hierarchy" | "context" | "call";

    params?;

    inject?: object | object[];

    cleanup: (instance) => void | string;
}

export interface ValueRegistration {
    $value;
    parse?: boolean;
}

export interface DependencyRegistration extends RegistrationWithServices {
    $dependency: string;
    lazy?: boolean;
    optional?: boolean;
    default?;
}

export function isServiceRegistration(x): x is ServiceRegistration {
    return x && ("$type" in x || "$factory" in x);
}

export function isValueRegistration(x): x is ValueRegistration {
    return x && "$value" in x;
}

export function isDependencyRegistration(x): x is DependencyRegistration {
    return x && "$depdendency" in x;
}
