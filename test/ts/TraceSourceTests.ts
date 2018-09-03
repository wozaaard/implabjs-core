import * as TraceSource from '@implab/core/log/TraceSource'
import * as tape from 'tape';

const sourceId = 'test/TraceSourceTests';

tape('', t => {
    let trace = TraceSource.get(sourceId);

    let h = trace.on((sender,level,msg) => {

    });

    h.destroy();
});