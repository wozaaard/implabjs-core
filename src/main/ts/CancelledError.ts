import { Cancellation } from "./Cancellation";
import { ICancellation } from "./interfaces";

export class CancelledError extends Error {
    readonly cancellationToken: ICancellation;

    constructor(message = "The operation is cancelled", ct = Cancellation.none) {
        super(message);
        this.cancellationToken = ct;
        this.name = "CancelledError";
    }
}
