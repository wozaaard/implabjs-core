import { ActivationContext } from "./ActivationContext";
import { isNull } from "../safe";

export interface Descriptor {
    activate(context: ActivationContext, name?: string);
}

export function isDescriptor(instance): instance is Descriptor {
    return  (!isNull(instance)) &&
        ('activate' in instance);
}