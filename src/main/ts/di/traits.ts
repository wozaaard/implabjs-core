import { isPrimitive } from "../safe";
import { Descriptor } from "./interfaces";
import { FluentConfiguration } from "./fluent/FluentConfiguration";
export function isDescriptor(x: any): x is Descriptor {
    return (!isPrimitive(x)) &&
        (x.activate instanceof Function);
}

export function fluent<S extends object>() {
    return new FluentConfiguration<S>();
}
