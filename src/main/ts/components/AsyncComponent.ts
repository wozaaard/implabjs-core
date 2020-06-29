import { Cancellation } from "../Cancellation";
import { IAsyncComponent, ICancellation, ICancellable, IDestroyable } from "../interfaces";
import { destroy } from "../safe";

export class AsyncComponent implements IAsyncComponent, ICancellable {
    _cancel: ((e: any) => void) | undefined;

    _completion: Promise<void> = Promise.resolve();

    getCompletion() { return this._completion; }

    runOperation(op: (ct: ICancellation) => any, ct: ICancellation = Cancellation.none) {
        // create inner cancellation bound to the passed cancellation token
        let h: IDestroyable;
        const inner = new Cancellation(cancel => {

            this._cancel = cancel;
            h = ct.register(cancel);
        });

        // TODO create cancellation source here
        const guard = async () => {
            try {
                await op(inner);
            } finally {
                // after the operation is complete we need to cleanup the
                // resources
                destroy(h);
                this._cancel = undefined;
            }
        };

        return this._completion = guard();
    }

    cancel(reason: any) {
        if (this._cancel)
            this._cancel(reason);
    }
}
