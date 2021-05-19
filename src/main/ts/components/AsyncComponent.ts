import { Cancellation } from "../Cancellation";
import { IAsyncComponent, ICancellation, ICancellable } from "../interfaces";

const noop = () => void (0);

export class AsyncComponent implements IAsyncComponent, ICancellable {
    _cancel: ((e: any) => void) = noop;

    _completion: Promise<void> = Promise.resolve();

    getCompletion() { return this._completion; }

    runOperation(op: (ct: ICancellation) => any, ct: ICancellation = Cancellation.none) {
        // create inner cancellation bound to the passed cancellation token
        const inner = new Cancellation(cancel => {
            this._cancel = cancel;
        });

        const guard = async () => {
            try {
                const combined = Cancellation.combine(ct, inner);
                const result = await op(combined);
                combined.throwIfRequested();
                return result;
            } finally {
                // after the operation is complete we need to cleanup the
                // resources
                this._cancel = noop;
            }
        };

        return this._completion = guard();
    }

    cancel(reason: any) {
        this._cancel(reason);
    }
}
