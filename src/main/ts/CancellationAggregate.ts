import { ICancellation, IDestroyable } from "./interfaces";

export class CancellationAggregate implements ICancellation {
    private readonly _tokens: ICancellation[];

    constructor(tokens: ICancellation[]) {
        this._tokens = tokens || [];
    }

    throwIfRequested() {
        this._tokens.forEach(ct => ct.throwIfRequested());
    }

    isRequested() {
        return this._tokens.some(ct => ct.isRequested());
    }
    isSupported() {
        return !!this._tokens.length;
    }
    register(cb: (e: any) => void): IDestroyable {
        let fired = false;

        const once = (e: any) => {
            if (!fired) {
                fired = true;
                destroy();
                cb(e);
            }
        };

        const destroy = () => subscriptions
            .splice(0, subscriptions.length) // empty array
            .forEach(subscription => subscription.destroy()); // cleanup

        const subscriptions = this._tokens.map(ct => ct.register(once));

        return {
            destroy
        };
    }
}
