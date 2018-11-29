import { TraceSource } from "./log/TraceSource";
import { argumentNotNull, argumentNotEmptyString, isPrimitive, each, isNull } from "./safe";
import { Uuid } from './Uuid';
import {ActivationContext} from "./di/ActivationContext";

let trace = TraceSource.get("di");

export interface Descriptor {
    activate(context: ActivationContext, name: string): any
}

export function isDescriptor(value: any): value is Descriptor {
    return ("activate" in value);
}

export interface ServiceMap {
    [s: string] : Descriptor
}

export class ActivationContextInfo {
    name: string

    service: string

    scope: ServiceMap
}

export class ActivationError {
    activationStack: ActivationContextInfo[]

    service: string

    innerException: any

    message: string

    constructor(service: string, activationStack: ActivationContextInfo[], innerException) {
        this.message = "Failed to activate the service";
        this.activationStack = activationStack;
        this.service = service;
        this.innerException = innerException;
    }

    toString() {
        var parts = [this.message];
        if (this.service)
            parts.push("when activating: " + this.service.toString());

        if (this.innerException)
            parts.push("caused by: " + this.innerException.toString());

        if (this.activationStack) {
            parts.push("at");
            this.activationStack.forEach(function (x) {
                parts.push("    " + x.name + " " +
                    (x.service ? x.service.toString() : ""));
            });
        }

        return parts.join("\n");
    }
}


export enum ActivationType {
    SINGLETON,
    CONTAINER,
    HIERARCHY,
    CONTEXT,
    CALL
}



interface ServiceDescriptorParams {

}

class ServiceDescriptor extends Descriptor {
    constructor(opts: ServiceDescriptorParams) {
        super();
    }

    activate(context: ActivationContext, name: string) {
        throw new Error("Method not implemented.");
    }
    isInstanceCreated(): boolean {
        throw new Error("Method not implemented.");
    }
    getInstance() {
        throw new Error("Method not implemented.");
    }
}



class AggregateDescriptor<T> extends Descriptor {
    constructor(value: T) {
        super();
    }

    activate(context: ActivationContext, name: string) {
        throw new Error("Method not implemented.");
    }
    isInstanceCreated(): boolean {
        throw new Error("Method not implemented.");
    }
    getInstance(): T {
        throw new Error("Method not implemented.");
    }
}

class ValueDescriptor<T> implements Descriptor {
    activate(context: ActivationContext, name: string) {
        throw new Error("Method not implemented.");
    }
    isInstanceCreated(): boolean {
        throw new Error("Method not implemented.");
    }
    getInstance(): T {
        throw new Error("Method not implemented.");
    }
    constructor(value: T) {

    }
}