import { IActivatable, ICancellation, IActivationController } from "../interfaces";
import { Cancellation } from "../Cancellation";

export class MockActivationController implements IActivationController {

    _active: IActivatable = null;

    getActive(): IActivatable {
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
        if (component !== this._active)
            await this.deactivate();
    }

    async activated(component: IActivatable, ct: ICancellation = Cancellation.none) {
        this._active = component;
    }

    async deactivating(component: IActivatable, ct: ICancellation = Cancellation.none) {

    }

    async deactivated(component: IActivatable, ct: ICancellation = Cancellation.none) {
        if (this._active === component)
            this._active = null;
    }
}
