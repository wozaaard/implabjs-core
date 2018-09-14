import { Cancellation } from "../Cancellation";
import { IAsyncComponent, ICancellation } from "../interfaces";

export class AsyncComponent implements IAsyncComponent {
    _completion: Promise<void> = Promise.resolve();

    getCompletion() { return this._completion };

    runOperation(op: (ct: ICancellation) => any, ct: ICancellation = Cancellation.none) {
        // TODO create cancellation source here
        async function guard() {
            await op(ct);
        }

        return this._completion = guard();
    }
}