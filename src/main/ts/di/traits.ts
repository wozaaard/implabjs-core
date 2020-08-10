import { isPrimitive } from "../safe";
import { Descriptor } from "./interfaces";
import { Configuration } from "./fluent/Configuration";

export function isDescriptor(x: any): x is Descriptor {
    return (!isPrimitive(x)) &&
        (x.activate instanceof Function);
}

export function configure<S extends object>() {
    return new Configuration<S>();
}
