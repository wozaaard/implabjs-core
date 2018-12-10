import { IObservable, IDestroyable, ICancellation } from "../../interfaces";
import { TraceEvent, LogLevel, WarnLevel, DebugLevel } from "../TraceSource";
import { Cancellation } from "../../Cancellation";
import { destroy } from "../../safe";

export class ConsoleWriter implements IDestroyable {
    readonly _subscriptions = new Array<IDestroyable>();

    writeEvents(source: IObservable<TraceEvent>, ct: ICancellation = Cancellation.none) {
        const subscription = source.on(this.writeEvent.bind(this));
        if (ct.isSupported()) {
            ct.register(subscription.destroy.bind(subscription));
        }
        this._subscriptions.push(subscription);
    }

    writeEvent(next: TraceEvent) {
        if (next.level >= DebugLevel) {
            // tslint:disable-next-line
            console.debug(next.source.id.toString(), next.arg);
        } else if (next.level >= LogLevel) {
            // tslint:disable-next-line
            console.log(next.source.id.toString(), next.arg);
        } else if (next.level >= WarnLevel) {
            // tslint:disable-next-line
            console.warn(next.source.id.toString(), next.arg);
        } else {
            // tslint:disable-next-line
            console.error(next.source.id.toString(), next.arg);
        }
    }

    destroy() {
        this._subscriptions.forEach(destroy);
    }
}
