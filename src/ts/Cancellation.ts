import { ICancellation } from "./interfaces";
import { argumentNotNull } from "./safe";

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

    register(cb: (e: any) => void): void {
        argumentNotNull(cb, "cb");

        if (this._reason) {
            cb(this._reason);
        } else {
            if (!this._cbs)
                this._cbs = [cb];
            else
                this._cbs.push(cb);
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

        register(_cb: (e: any) => void): void {
        }
    };
}