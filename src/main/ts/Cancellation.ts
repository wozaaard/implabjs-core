import { ICancellation, IDestroyable } from "./interfaces";
import { argumentNotNull } from "./safe";

const destroyed = {
    destroy() {
    }
};

export class Cancellation implements ICancellation {
    private _reason: any;
    private _cbs: Array<(e) => void>;

    constructor(action: (cancel: (e) => void) => void) {
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

    private _unregister(cb) {
        if (this._cbs) {
            const i = this._cbs.indexOf(cb);
            if (i >= 0)
                this._cbs.splice(i, 1);
        }
    }

    private _cancel(reason) {
        if (this._reason)
            return;

        this._reason = (reason = reason || new Error("Operation cancelled"));

        if (this._cbs) {
            this._cbs.forEach(cb => cb(reason));
            this._cbs = null;
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
}
