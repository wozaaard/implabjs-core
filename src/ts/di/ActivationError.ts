import { ActivationContextInfo } from "./ActivationContext";

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