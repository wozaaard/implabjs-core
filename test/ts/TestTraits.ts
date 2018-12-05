import { IObservable, ICancellation, IDestroyable } from "@implab/core/interfaces";
import { Cancellation } from "@implab/core/Cancellation";
import { TraceEvent, LogLevel, WarnLevel } from "@implab/core/log/TraceSource";
import * as tape from "tape";
import { argumentNotNull } from "@implab/core/safe";

export class TapeWriter implements IDestroyable {
    readonly _tape: tape.Test;

    _subscriptions = new Array<IDestroyable>();

    constructor(t: tape.Test) {
        argumentNotNull(t, "tape");
        this._tape = t;
    }

    writeEvents(source: IObservable<TraceEvent>, ct: ICancellation = Cancellation.none) {
        const subscription = source.on(this.writeEvent.bind(this));
        if (ct.isSupported()) {
            ct.register(subscription.destroy.bind(subscription));
        }
        this._subscriptions.push(subscription);
    }

    writeEvent(next: TraceEvent) {
        if (next.level >= LogLevel) {
            this._tape.comment("LOG " + next.arg);
        } else if (next.level >= WarnLevel) {
            this._tape.comment("WARN " + next.arg);
        } else {
            this._tape.comment("ERROR " + next.arg);
        }
    }

    destroy() {
        this._subscriptions.forEach(x => x.destroy());
    }
}

export async function delay(timeout: number, ct: ICancellation = Cancellation.none) {
    let un: IDestroyable;

    try {
        await new Promise((resolve, reject) => {
            if (ct.isRequested()) {
                un = ct.register(reject);
            } else {
                const ht = setTimeout(() => {
                    resolve();
                }, timeout);

                un = ct.register(e => {
                    clearTimeout(ht);
                    reject(e);
                });
            }
        });
    } finally {
        if (un)
            un.destroy();
    }
}

export function test(name: string, cb: (t: tape.Test) => any) {
    tape(name, async t => {
        try {
            await cb(t);
        } catch (e) {

            // verbose error information
            // tslint:disable-next-line
            console.error(e);
            t.fail(e);

        } finally {
            t.end();
        }
    });
}
