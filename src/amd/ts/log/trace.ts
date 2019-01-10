import { TraceSource } from "./TraceSource";
import { Predicate } from "../interfaces";

export = {
    on(filter: any , cb: any) {
        if (arguments.length === 1) {
            cb = filter;
            filter = undefined;
        }
        let test: Predicate<string>;
        if (filter instanceof RegExp) {
            test = chId => filter.test(chId);
        } else if (filter instanceof Function) {
            test = filter;
        } else if (filter) {
            test = chId => chId === filter;
        }

        if (test) {
            TraceSource.on(source => {
                if (test(source.id))
                    source.events.on(cb);
            });
        } else {
            TraceSource.on(source => {
                source.events.on(cb);
            });
        }
    },

    load(id: string, require: any, cb: (trace: TraceSource) => void) {
        if (id) {
            cb(TraceSource.get(id));
        } else if (require.module && require.module.mid) {
            cb(TraceSource.get(require.module.mid));
        } else {
            require(["module"], (module: { id: any; }) => {
                cb(TraceSource.get(module && module.id));
            });
        }
    },

    dynamic: true
};
