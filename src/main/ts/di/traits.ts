import { isPrimitive } from "../safe";
import { Descriptor } from "./interfaces";

export function isDescriptor(x: any): x is Descriptor {
    return (!isPrimitive(x)) &&
        (x.activate instanceof Function);
}