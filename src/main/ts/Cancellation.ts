import { CancellationAggregate } from "./CancellationAggregate";
import { CancelledError } from "./CancelledError";
import { ICancellation, IDestroyable } from "./interfaces";
import { argumentNotNull, destroyed } from "./safe";

export class Cancellation implements ICancellation {
    private _reason: any;
    private _cbs: Array<(e: any) => void> | undefined;

    constructor(action: (cancel: (e?: any) => void) => void) {
        argumentNotNull(action, "action");

        action(this._cancel.bind(this));
    }

    isSupported(): boolean {
        return true;
    }
    throwIfRequested(): void {
        if (this._reason)
            throw this._reason;
    }

    isRequested(): boolean {
        return !!this._reason;
    }

    register(cb: (e: any) => void): IDestroyable {
        argumentNotNull(cb, "cb");

        if (this._reason) {
            cb(this._reason);
            return destroyed;
        } else {
            if (!this._cbs)
                this._cbs = [cb];
            else
                this._cbs.push(cb);

            const me = this;
            return {
                destroy() {
                    me._unregister(cb);
                }
            };
        }
    }

    private _unregister(cb: any) {
        if (this._cbs) {
            const i = this._cbs.indexOf(cb);
            if (i >= 0)
                this._cbs.splice(i, 1);
        }
    }

    private _cancel(reason: any) {
        if (this._reason)
            return;

        this._reason = (reason = reason || new CancelledError(undefined, this));

        if (this._cbs) {
            this._cbs.forEach(cb => cb(reason));
            this._cbs = undefined;
        }
    }

    static readonly none: ICancellation = {
        isSupported(): boolean {
            return false;
        },

        throwIfRequested(): void {
        },

        isRequested(): boolean {
            return false;
        },

        register(_cb: (e: any) => void): IDestroyable {
            return destroyed;
        }
    };

    /**
     * Combines multiple cancellation tokens to the single aggregated token.
     *
     * Aggregated token will be considered as signalled when some tokens are
     * signalled. The cancellation callback can be registered with the `register`
     * method, it will be fired once with the first signalled token, all other
     * tokens will be ignored.
     *
     * The tokens which don't support cancellation are filtered out, if there are
     * no tokens left in the list the method returns `Cancellation.none`.
     *
     * @param args The list of cancellation tokens to combine
     * @returns Aggregated cancellation token
     */
    static combine(...args: ICancellation[]) {
        const tokens = args.filter(ct => ct.isSupported());
        return tokens.length > 1 ?
            new CancellationAggregate(tokens) :
            tokens.length === 1 ? tokens[0] :
                this.none;
    }
}
