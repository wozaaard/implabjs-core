import { IObservable, ICancellation, IDestroyable } from "@implab/core/interfaces";
import * as TraceEvent from '@implab/core/log/TraceEvent';
import { Cancellation } from "@implab/core/Cancellation";
import * as TraceSource from "@implab/core/log/TraceSource";
import * as tape from 'tape';
import { argumentNotNull } from "@implab/core/safe";

export class TapeWriter implements IDestroyable {
    readonly _tape: tape.Test

    _subscriptions = new Array<IDestroyable>();

    constructor(tape: tape.Test) {
        argumentNotNull(tape, "tape");
        this._tape = tape;
    }

    writeEvents(source: IObservable<TraceEvent>, ct: ICancellation = Cancellation.none) {
        let subscription = source.on(this.writeEvent.bind(this));
        if (ct.isSupported()) {
            ct.register(subscription.destroy.bind(subscription));
        }
        this._subscriptions.push(subscription);
    }

    writeEvent(next: TraceEvent) {
        if (next.level >= TraceSource.LogLevel) {
            this._tape.comment("LOG " + next.arg);
        } else if(next.level >= TraceSource.WarnLevel) {
            this._tape.comment("WARN " + next.arg);
        } else {
            this._tape.comment("ERROR " + next.arg);
        }
    }

    destroy() {
        this._subscriptions.forEach(x => x.destroy());
    }
}