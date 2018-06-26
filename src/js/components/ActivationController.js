define(["dojo/_base/declare", "../guard", "../safe", "../log/_LogMixin"], function (declare, guard, safe, _LogMixin) {
	"use strict";
	return declare([_LogMixin], {

		_current: null,

		_pending: false,

		getCurrent: function () {
			return this._current;
		},

		_start: function () {
			if (this._pending)
				throw new Error("The activation/decativation is already pending");
			this._pending = true;
		},

		_await: function (d) {
			var me = this;
			return d.then(function (x) {
				me._pending = false;
				return x;
			}, function (e) {
				me._pending = false;
				throw e;
			});
		},

		activate: function (component) {
			safe.argumentNotNull(component, "component");
			var me = this;
			if (component.getController() !== this)
				throw new Error("The specified component doesn't belong to this controller");

			return me._await(guard(me, "_start").then(function () {
				me._activate(component);
			}));
		},

		_activate: function (component) {
			var me = this;
			if (me._current === component)
				return guard(false);

			// before activation hook
			return guard(me, "onActivating", [component]).then(function () {
				// deactivate curent
				if (me._current)
					return me._current.deactivate(true).then(function () {
						try {
							me._current.onDeactivated();
						} catch (err) {
							me.error(err);
						}
						// HACK raise deactivated event
						try {
							me.onDeactivated(me._current, component);
						} catch (err) {
							// deactivated shouldn't affect the process
							me.error(err);
						}
						me._current = null;

					});
			}).then(function () {
				return component.activate(true);
			}).then(function () {
				me._current = component;
				try {
					me.onActivated(component);
				} catch (err) {
					me.error(err);
				}

			});

		},

		/**
		 * Деактивирует текущую компоненту.
		 * 
		 * @async
		 * @returns true - компонента была деактивирована, либо нет активной
		 *          компоненты. false - запрос на деактивацию - отклонен.
		 */
		deactivate: function () {
			var me = this;
			return me._await(guard(me, "_start").then(function () {
				return me._deactivate();
			}));
		},

		_deactivate: function () {
			var me = this;
			if (!me._current)
				return guard(false);

			return guard(me, "onDeactivating").then(function () {
				return me._current.deactivate(true);
			}).then(function () {
				// HACK raise deactivated event
				try {
					me.onDeactivated(me._current);
				} catch (err) {
					me.error(err);
				}
				me._current = null;
			});
		},

		onActivating: function (component) {},

		onDeactivating: function (component) {},

		onDeactivated: function (component, next) {},

		onActivated: function (component) {}
	});
});