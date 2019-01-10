import { IObservable, IDestroyable, ICancellation } from "../../interfaces";
import { TraceEvent, LogLevel, WarnLevel, DebugLevel } from "../TraceSource";
import { Cancellation } from "../../Cancellation";
import { destroy } from "../../safe";

function hasConsole() {
    try {
        // tslint:disable-next-line:no-console
        return (typeof console !== "undefined" && typeof console.log === "function");
    } catch {
        return false;
    }
}

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
        // IE will create console only when devepoler tools are activated
        if (!hasConsole())
            return;

        if (next.level >= DebugLevel) {
            // tslint:disable-next-line:no-console
            console.debug(next.source.id.toString(), next.arg);
        } else if (next.level >= LogLevel) {
            // tslint:disable-next-line:no-console
            console.log(next.source.id.toString(), next.arg);
        } else if (next.level >= WarnLevel) {
            // tslint:disable-next-line:no-console
            console.warn(next.source.id.toString(), next.arg);
        } else {
            // tslint:disable-next-line:no-console
            console.error(next.source.id.toString(), next.arg);
        }
    }

    destroy() {
        this._subscriptions.forEach(destroy);
    }
}
