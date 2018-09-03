import { IActivationController } from './IActivationController';
import { IActivatable } from './IActivatable';
import { AsyncComponent } from './AsyncComponent';
import { ICancellation } from '../ICancellation';
import { EmptyCancellation } from '../EmptyCancellation';
import * as TraceSource from '../log/TraceSource';

type Constructor<T = {}> = new (...args: any[]) => T;

const log = TraceSource.get('@implab/core/components/ActivatableMixin');

function ActivatableMixin<TBase extends Constructor<AsyncComponent>>(Base: TBase) {
    return class extends Base implements IActivatable {
        _controller: IActivationController;

        _active: boolean;

        isActive() {
            return this._active;
        }

        getActivationController() {
            return this._controller;
        }

        setActivationController(controller: IActivationController) {
            this._controller = controller;
        }

        async onActivating(ct: ICancellation) {
            if (this._controller)
                await this._controller.activating(this, ct);
        }

        async onActivated(ct: ICancellation) {
            if (this._controller)
                await this._controller.activated(this, ct);
        }

        async activate(ct: ICancellation = EmptyCancellation.default) {
            if (this.isActive())
                return;
            ct = this.startOperation(ct);
            try {
                await this.onActivating(ct);
                this._active = true;
                try {
                    await this.onActivated(ct);
                } catch(e) {
                    log.error("Suppressed onActivated error: {0}", e);
                }
                this.completeSuccess();
            } catch (e) {
                this.completeFail(e);
            }
            return this.getCompletion();
        }

        async onDeactivating(ct: ICancellation) {
            if (this._controller)
                await this._controller.deactivating(this, ct);
        }

        async onDeactivated(ct: ICancellation) {
            if (this._controller)
                await this._controller.deactivated(this, ct);
        }

        async deactivate(ct: ICancellation = EmptyCancellation.default) {
            if (!this.isActive())
                return;
            ct = this.startOperation(ct);
            try {
                await this.onDeactivating(ct);
                this._active = false;
                try {
                    await this.onDeactivated(ct);
                } catch(e) {
                    log.error("Suppressed onDeactivated error: {0}", e);
                }
                this.completeSuccess();
            } catch (e) {
                this.completeFail(e);
            }
            return this.getCompletion();
        }

    }
}

namespace ActivatableMixin {
    export const traceSource = log;
}

export = ActivatableMixin;