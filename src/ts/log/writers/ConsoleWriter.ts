import { IObservable } from "../../interfaces";
import * as TraceEvent from '../TraceEvent';
import { ICancellation } from "../../interfaces";
import { Cancellation } from "../../Cancellation";
import * as TraceSource from "../TraceSource";

class ConsoleWriter {
    async write(source: IObservable<TraceEvent>, ct: ICancellation = Cancellation.none) {
        let next;
        while(next = await source.next(ct)) {
            this._writeEvent(next);
        }
    }

    private _writeEvent(next: TraceEvent) {
        if (next.level >= TraceSource.LogLevel) {
            console.log(next.source.toString(), next.arg);
        } else if(next.level >= TraceSource.WarnLevel) {
            console.warn(next.source.toString(), next.arg);
        } else {
            console.error(next.source.toString(), next.arg);
        }
    }
}

namespace ConsoleWriter {
}

export = ConsoleWriter;