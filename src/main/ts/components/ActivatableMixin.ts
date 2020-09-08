import { IActivationController, IActivatable, ICancellation } from "../interfaces";
import { AsyncComponent } from "./AsyncComponent";
import { Cancellation } from "../Cancellation";
import { TraceSource } from "../log/TraceSource";

type Constructor<T = {}> = new (...args: any[]) => T;

const log = TraceSource.get("@implab/core/components/ActivatableMixin");

export function ActivatableMixin<TBase extends Constructor<AsyncComponent>>(Base: TBase) {
    return class extends Base implements IActivatable {
        _controller: IActivationController | undefined;

        _active = false;

        isActive() {
            return this._active;
        }

        hasActivationController() {
            return !!this._controller;
        }

        getActivationController() {
            if (!this._controller)
                throw Error("Activation controller isn't set");
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

        activate(ct: ICancellation = Cancellation.none) {
            return this.runOperation(this._activateAsync.bind(this), ct);
        }

        async _activateAsync(ct: ICancellation) {
            if (this.isActive())
                return;

            await this.onActivating(ct);
            this._active = true;
            try {
                await this.onActivated(ct);
            } catch (e) {
                log.error("Suppressed onActivated error: {0}", e);
            }
        }

        async onDeactivating(ct: ICancellation) {
            if (this._controller)
                await this._controller.deactivating(this, ct);
        }

        async onDeactivated(ct: ICancellation) {
            if (this._controller)
                await this._controller.deactivated(this, ct);
        }

        deactivate(ct: ICancellation = Cancellation.none) {
            return this.runOperation(this._deactivateAsync.bind(this), ct);
        }

        async _deactivateAsync(ct: ICancellation) {
            if (!this.isActive())
                return;
            await this.onDeactivating(ct);
            this._active = false;
            try {
                await this.onDeactivated(ct);
            } catch (e) {
                log.error("Suppressed onDeactivated error: {0}", e);
            }
        }
    };
}

export const traceSource = log;
