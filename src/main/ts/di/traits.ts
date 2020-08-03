import { isPrimitive } from "../safe";
import { Descriptor } from "./interfaces";
import { AnnotationBuilder } from "./Annotations";
import { Configuration } from "./fluent/Configuration";

export function isDescriptor(x: any): x is Descriptor {
    return (!isPrimitive(x)) &&
        (x.activate instanceof Function);
}

export function declare<S extends object>() {
    return {
        annotate<T>() {
            return new AnnotationBuilder<T, S>();
        },
        configure(): Configuration<S> {
            throw new Error();
        },
        dependency() {
            throw new Error();
        }
    };
}
