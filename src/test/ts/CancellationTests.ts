import * as tape from "tape";
import { Cancellation } from "@implab/core/Cancellation";
import { delay } from "@implab/core/safe";

tape("standalone cancellation", async t => {

    let doCancel: (e) => void;

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

    t.end();
});

tape("async cancellation", async t => {

    const ct = new Cancellation(cancel => {
        cancel("STOP!");
    });

    try {
        await delay(0, ct);
        t.fail("Should thow the exception");
    } catch (e) {
        t.equals(e, "STOP!", "Should throw the cancellation reason");
    }

    t.end();
});

tape("cancel with external event", async t => {
    const ct = new Cancellation(cancel => {
        setTimeout(x => cancel("STOP!"), 0);
    });

    try {
        await delay(10000, ct);
        t.fail("Should thow the exception");
    } catch (e) {
        t.equals(e, "STOP!", "Should throw the cancellation reason");
    }

    t.end();
});

tape("operation normal flow", async t => {

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

    t.end();
});
