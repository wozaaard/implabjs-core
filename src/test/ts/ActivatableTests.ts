import * as tape from "tape";
import { MockActivationController } from "./mock/MockActivationController";
import { SimpleActivatable } from "./mock/SimpleActivatable";

tape("simple activation", async t => {

    const a = new SimpleActivatable();
    t.false(a.isActive());

    await a.activate();
    t.true(a.isActive());

    await a.deactivate();
    t.false(a.isActive());

    t.end();
});

tape("controller activation", async t => {

    const a = new SimpleActivatable();
    const c = new MockActivationController();

    t.false(a.isActive(), "the component is not active by default");
    t.assert(c.getActive() == null, "the activation controller doesn't have an active component by default");
    t.assert(a.getActivationController() == null, "the component doesn't have an activation controller by default");

    t.comment("Active the component through the controller");
    await c.activate(a);
    t.true(a.isActive(), "The component should successfully activate");
    t.equal(c.getActive(), a, "The controller should point to the activated component");
    t.equal(a.getActivationController(), c, "The component should point to the controller");

    t.comment("Deactive the component throug the controller");
    await c.deactivate();

    t.false(a.isActive(), "The component should successfully deactivate");
    t.equal(c.getActive(), null, "The controller shouldn't point to any component");
    t.equal(a.getActivationController(), c, "The componet should point to it's controller");

    t.end();
});

tape("handle error in onActivating", async t => {
    const a = new SimpleActivatable();

    a.onActivating = async () => {
        throw new Error("Should fail");
    };

    try {
        await a.activate();
        t.fail("activation should fail");
    } catch {
    }

    t.false(a.isActive(), "the component should remain inactive");

    t.end();
});
