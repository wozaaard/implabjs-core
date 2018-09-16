import * as tape from 'tape';
import { ActivatableMixin} from '@implab/core/components/ActivatableMixin';
import { AsyncComponent } from '@implab/core/components/AsyncComponent';
import { IActivationController, IActivatable, ICancellation } from '@implab/core/interfaces';
import { Cancellation } from '@implab/core/Cancellation';

class SimpleActivatable extends ActivatableMixin(AsyncComponent) {

}

class MockActivationController implements IActivationController {

    _active: IActivatable = null;

    
    getActive() : IActivatable {
        return this._active;
    }

    async deactivate() {
        if (this._active)
            await this._active.deactivate();
        this._active = null;
    }
    
    async activate(component: IActivatable) {
        if (!component || component.isActive())
            return;
        component.setActivationController(this);

        await component.activate();
    }

    async activating(component: IActivatable, ct: ICancellation = Cancellation.none) {
        if (component != this._active)
            await this.deactivate();
    }

    async activated(component: IActivatable, ct: ICancellation = Cancellation.none) {
        this._active = component;
    }

    async deactivating(component: IActivatable, ct: ICancellation = Cancellation.none) {

    }

    async deactivated(component: IActivatable, ct: ICancellation = Cancellation.none) {
        if (this._active == component)
            this._active = null;
    }
}

tape('simple activation',async function(t){
  
    let a = new SimpleActivatable();
    t.false(a.isActive());
    
    await a.activate();
    t.true(a.isActive());
    
    await a.deactivate();
    t.false(a.isActive());

    t.end();
});

tape('controller activation', async function(t) {

    let a = new SimpleActivatable();
    let c = new MockActivationController();

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

tape('handle error in onActivating', async function(t) {
    let a = new SimpleActivatable();

    a.onActivating = async function() {
        throw "Should fail";
    };

    try {
        await a.activate();
        t.fail("activation should fail");
    } catch {
    }

    t.false(a.isActive(), "the component should remain inactive");

    t.end();
});