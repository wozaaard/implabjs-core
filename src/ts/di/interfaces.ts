import { isNull } from "../safe";
import { ActivationContext } from "./ActivationContext";

export interface Descriptor {
    activate(context: ActivationContext, name?: string);
}

export type Constructor<T = {}> = new (...args: any[]) => T;


export type Factory<T = {}> = (...args: any[]) => T;

export function isDescriptor(instance): instance is Descriptor {
    return  (!isNull(instance)) &&
        ('activate' in instance);
}

export interface ServiceMap {
    [s: string] : Descriptor
}

export enum ActivationType {
    SINGLETON,
    CONTAINER,
    HIERARCHY,
    CONTEXT,
    CALL
}