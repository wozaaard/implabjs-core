import { ICancellation } from "../ICancellation";
import { EmptyCancellation } from "../EmptyCancellation";

export class AsyncComponent {
    _completion: Promise<void>;

    _deferred: {
        resolve(): void
        reject(reason: any): void
    };

    getCompletion() { return this._completion };

    startOperation(ct: ICancellation = EmptyCancellation.default) {
        if (this._deferred)
            throw new Error("The async operation is already pending");

        this._completion = new Promise<void>((resolve, reject) => {
            this._deferred = {
                resolve: resolve,
                reject: reject
            }
        });
        return ct;
    }

    completeSuccess() {
        this._deferred.resolve();
        this._deferred = null;
    }

    completeFail(reason: any) {
        this._deferred.reject(reason);
        this._deferred = null;
    }

    async runOperation(cb: (ct: ICancellation) => Promise<void>, ct: ICancellation = EmptyCancellation.default) {
        //safe.argumentNotNull(cb, "cb")
        ct = this.startOperation(ct);
        try {
            await cb(ct);
            this.completeSuccess();
        } catch(e) {
            this.completeFail(e);
        }
    }
}