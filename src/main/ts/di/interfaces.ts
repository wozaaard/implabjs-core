import { isNull, isPrimitive } from "../safe";
import { ActivationContext } from "./ActivationContext";
import { Constructor, Factory } from "../interfaces";

export interface Descriptor {
    activate(context: ActivationContext, name?: string);
}

export function isDescriptor(x): x is Descriptor {
    return (!isPrimitive(x)) &&
        (x.activate instanceof Function);
}

export interface ServiceMap {
    [s: string]: Descriptor;
}

export enum ActivationType {
    Singleton = 1,
    Container,
    Hierarchy,
    Context,
    Call
}

export interface RegistrationWithServices {
    services?: object;
}

export interface ServiceRegistration extends RegistrationWithServices {

    activation?: "singleton" | "container" | "hierarchy" | "context" | "call";

    params?;

    inject?: object | object[];

    cleanup?: (instance) => void | string;
}

export interface TypeRegistration extends ServiceRegistration {
    $type: string | Constructor;
}

export interface FactoryRegistration extends ServiceRegistration {
    $factory: string | Factory;
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

export function isTypeRegistration(x): x is TypeRegistration {
    return (!isPrimitive(x)) && ("$type" in x);
}

export function isFactoryRegistration(x): x is FactoryRegistration {
    return (!isPrimitive(x)) && ("$factory" in x);
}

export function isValueRegistration(x): x is ValueRegistration {
    return (!isPrimitive(x)) && ("$value" in x);
}

export function isDependencyRegistration(x): x is DependencyRegistration {
    return (!isPrimitive(x)) && ("$dependency" in x);
}
