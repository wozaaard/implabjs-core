import { IObservable, IDestroyable, ICancellation } from "../../interfaces";
import * as TraceEvent from '../TraceEvent';
import { Cancellation } from "../../Cancellation";
import * as TraceSource from "../TraceSource";

class ConsoleWriter implements IDestroyable {
    readonly _subscriptions = new Array<IDestroyable>();

    writeEvents(source: IObservable<TraceEvent>, ct: ICancellation = Cancellation.none) {
        var subscription = source.on(this.writeEvent.bind(this));
        if (ct.isSupported()) {
            ct.register(subscription.destroy.bind(subscription));
        }
        this._subscriptions.push(subscription);
    }

    writeEvent(next: TraceEvent) {
        if (next.level >= TraceSource.LogLevel) {
            console.log(next.source.id.toString(), next.arg);
        } else if(next.level >= TraceSource.WarnLevel) {
            console.warn(next.source.id.toString(), next.arg);
        } else {
            console.error(next.source.id.toString(), next.arg);
        }
    }

    destroy() {
        this._subscriptions.forEach(x => x.destroy());
    }
}

namespace ConsoleWriter {
}

export = ConsoleWriter;