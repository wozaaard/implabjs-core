import { IObservable, ICancellation, IDestroyable } from "@implab/core/interfaces";
import { Cancellation } from "@implab/core/Cancellation";
import { TraceEvent, LogLevel, WarnLevel, DebugLevel, TraceSource } from "@implab/core/log/TraceSource";
import * as tape from "tape";
import { argumentNotNull, destroy } from "@implab/core/safe";

export class TapeWriter implements IDestroyable {
    private readonly _tape: tape.Test;

    private readonly _subscriptions = new Array<IDestroyable>();
    private _destroyed;

    constructor(t: tape.Test) {
        argumentNotNull(t, "tape");
        this._tape = t;
    }

    writeEvents(source: IObservable<TraceEvent>, ct: ICancellation = Cancellation.none) {
        if (!this._destroyed) {
            const subscription = source.on(this.writeEvent.bind(this));
            if (ct.isSupported()) {
                ct.register(subscription.destroy.bind(subscription));
            }
            this._subscriptions.push(subscription);
        }
    }

    writeEvent(next: TraceEvent) {
        if (next.level >= DebugLevel) {
            this._tape.comment(`DEBUG ${next.source.id} ${next}`);
        } else if (next.level >= LogLevel) {
            this._tape.comment(`LOG   ${next.source.id} ${next}`);
        } else if (next.level >= WarnLevel) {
            this._tape.comment(`WARN  ${next.source.id} ${next}`);
        } else {
            this._tape.comment(`ERROR ${next.source.id} ${next}`);
        }
    }

    destroy() {
        this._subscriptions.forEach(destroy);
    }
}

export function test(name: string, cb: (t: tape.Test, trace: TraceSource) => any) {
    tape(name, async t => {
        const writer = new TapeWriter(t);

        // this trace is not announced through the TraceSource global registry
        const trace = new TraceSource(name);
        trace.level = DebugLevel;
        writer.writeEvents(trace.events);

        const h = TraceSource.on(ts => {
            ts.level = DebugLevel;
            writer.writeEvents(ts.events);
        });

        try {
            await cb(t, trace);
        } catch (e) {

            // verbose error information
            // tslint:disable-next-line
            console.error(e);
            t.fail(e);

        } finally {
            t.end();
            destroy(writer);
            destroy(h);
        }
    });
}
