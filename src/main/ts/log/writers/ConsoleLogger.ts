import { IObservable, IDestroyable, ICancellation } from "../../interfaces";
import { TraceEvent, LogLevel, WarnLevel, DebugLevel } from "../TraceSource";
import { Cancellation } from "../../Cancellation";
import { destroy, argumentNotNull } from "../../safe";
import { ConsoleWriter } from "../ConsoleWriter";

export class ConsoleLogger implements IDestroyable {
    private readonly _subscriptions = new Array<IDestroyable>();
    private readonly _writer: ConsoleWriter;

    constructor(writer = ConsoleWriter.default) {
        argumentNotNull(writer, "writer");
        this._writer = writer;
    }

    writeEvents(source: IObservable<TraceEvent>, ct: ICancellation = Cancellation.none) {
        const subscription = source.on(this.writeEvent.bind(this));
        if (ct.isSupported()) {
            ct.register(subscription.destroy.bind(subscription));
        }
        this._subscriptions.push(subscription);
    }

    writeEvent(next: TraceEvent) {
        if (next.level >= DebugLevel) {
            this._writer.setLogLevel("debug");
        } else if (next.level >= LogLevel) {
            this._writer.setLogLevel("log");
        } else if (next.level >= WarnLevel) {
            this._writer.setLogLevel("warn");
        } else {
            this._writer.setLogLevel("error");
        }
        this._writer.write("{0}: ", next.source.id);
        this._writer.writeLine(next.message, ...next.args);
    }

    destroy() {
        this._subscriptions.forEach(destroy);
    }
}
