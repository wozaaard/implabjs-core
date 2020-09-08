export interface ActivationItem {
    name: string;
    service: string;
}

export class ActivationError {
    activationStack: ActivationItem[];

    service: string;

    innerException: any;

    message: string;

    constructor(service: string, activationStack: ActivationItem[], innerException: any) {
        this.message = "Failed to activate the service";
        this.activationStack = activationStack;
        this.service = service;
        this.innerException = innerException;
    }

    toString() {
        const parts = [this.message];
        if (this.service)
            parts.push("when activating: " + this.service.toString());

        if (this.innerException)
            parts.push("caused by: " + this.innerException.toString());

        if (this.activationStack) {
            parts.push("at");
            this.activationStack
                .forEach(x => parts.push(`    ${x.name} ${x.service}`));

        }

        return parts.join("\n");
    }
}
