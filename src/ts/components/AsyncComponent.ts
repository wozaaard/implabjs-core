import { Cancellation } from "../Cancellation";
import { IAsyncComponent, ICancellation, ICancellable, IDestroyable } from "../interfaces";
import { destroy } from "../safe";

export class AsyncComponent implements IAsyncComponent, ICancellable {
    _cancel: (e) => void;

    _completion: Promise<void> = Promise.resolve();

    getCompletion() { return this._completion };

    runOperation(op: (ct: ICancellation) => any, ct: ICancellation = Cancellation.none) {
        // create inner cancellation bound to the passed cancellation token
        let h: IDestroyable;
        let inner = new Cancellation(cancel => {

            this._cancel = cancel;
            h = ct.register(cancel);
        });

        // TODO create cancellation source here
        let guard = async () => {
            try {
                await op(inner);
            } finally {
                // after the operation is complete we need to cleanup the
                // resources
                destroy(h);
                this._cancel = null;
            }
        }

        return this._completion = guard();
    }

    cancel(reason) {
        if (this._cancel)
            this._cancel(reason);
    }
}