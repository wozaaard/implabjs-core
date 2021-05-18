import { Cancellation } from "../Cancellation";
import { CancellationAggregate } from "../CancellationAggregate";
import { delay, notImplemented } from "../safe";
import { test } from "./TestTraits";

test("standalone cancellation", async t => {

    let doCancel: (e: any) => void = notImplemented;

    const ct = new Cancellation(cancel => {
        doCancel = cancel;
    });

    let counter = 0;
    const reason = "BILL";

    t.true(ct.isSupported(), "Cancellation must be supported");
    t.false(ct.isRequested(), "Cancellation shouldn't be requested");
    ct.throwIfRequested();
    t.pass("The exception shouldn't be thrown unless the cancellation is requested");

    ct.register(() => counter++);
    t.equals(counter, 0, "counter should be zero");

    ct.register(() => counter++).destroy();

    doCancel(reason);

    t.true(ct.isRequested(), "Cancellation should be requested");
    t.equals(counter, 1, "The registered callback should be triggered");

    ct.register(() => counter++);
    t.equals(counter, 2, "The callback should be triggered immediately");

    let msg;
    ct.register(e => msg = e);
    t.equals(msg, reason, "The cancellation reason should be passed to callback");

    try {
        msg = null;
        ct.throwIfRequested();
        t.fail("The exception should be thrown");
    } catch (e) {
        msg = e;
    }
    t.equals(msg, reason, "The cancellation reason should be catched");
});

test("async cancellation", async t => {

    const ct = new Cancellation(cancel => {
        cancel("STOP!");
    });

    try {
        await delay(0, ct);
        t.fail("Should thow the exception");
    } catch (e) {
        t.equals(e, "STOP!", "Should throw the cancellation reason");
    }
});

test("cancel with external event", async t => {
    const ct = new Cancellation(cancel => {
        setTimeout(x => cancel("STOP!"), 0);
    });

    try {
        await delay(10000, ct);
        t.fail("Should thow the exception");
    } catch (e) {
        t.equals(e, "STOP!", "Should throw the cancellation reason");
    }
});

test("operation normal flow", async t => {

    let htimeout;
    const ct = new Cancellation(cancel => {
        htimeout = setTimeout(() => cancel("STOP!"), 1000);
    });

    try {
        await delay(0, ct);
        t.pass("Should pass");
    } finally {
        clearTimeout(htimeout);
    }
});

test("combine cancellations", t => {
    const ct1 = new Cancellation(cancel => {
        cancel("cancelled");
    });

    const ct2 = new Cancellation(() => {});

    const cct1 = Cancellation.combine(Cancellation.none, ct1);

    t.equals(cct1, ct1, "Cancellation.combine should filter out Cancellation.none tokens");

    const cct2 = Cancellation.combine(Cancellation.none, ct1, ct2);

    t.assert(cct2 instanceof CancellationAggregate, "Cancellation.combine should return CancellationAggregate");
    t.true(cct2.isRequested(), "CancellationAggregate should return isRequested true if any of cancellations is requested");
});
