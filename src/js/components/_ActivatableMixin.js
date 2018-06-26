define(["dojo/_base/declare", "../guard", "./StateMachine", "../log/_LogMixin", ], function (declare, guard, StateMachine, _LogMixin) {

	var states = {
		inactive: {
			activate: "activating"
		},
		activating: {
			success: "active",
			failed: "inactive"
		},
		active: {
			deactivate: "deactivating"
		},
		deactivating: {
			success: "inactive",
			failed: "active"
		}
	};

	return declare([_LogMixin], {
		_controller: null,

		_active: null,

		constructor: function () {
			this._active = new StateMachine({
				states: states,
				initial: "inactive"
			});
		},

		/**
		 * @returns {Object} контроллер для активации текущей компоненты
		 */
		getController: function () {
			return this._controller;
		},

		/**
		 * @param {Object}
		 *            v Контроллер для активации текущей компоненты
		 */
		setController: function (v) {
			this._controller = v;
		},

		/**
		 * @returns {Boolean} текущая компонента активна
		 */
		isActive: function () {
			return this._active.current == "active";
		},

		assertActive: function () {
			if (!this.isActive())
				throw new Error("The object must be active to perform the operation");
		},

		/**
		 * Активирует текущую компоненту, если у текущей компоненты задан
		 * контроллер, то активация будет осуществляться через него
		 * 
		 * @async
		 * @param{Boolean}
		 *            direct вызов должен осуществится напрямую, без участия
		 *            контроллера.
		 * @return{Boolean} успешно/неуспешно
		 */
		activate: function (direct) {
			var me = this;
			if (!direct && this._controller)
				return me._controller.activate(me).then(function () {
					me.onActivated();
				});

			me._active.move("activate");
			return guard(me, "onActivating").then(function () {
				me.log("Activated");
				me._active.move("success");
				if (!me._controller)
					me.onActivated();
			}, function (err) {
				console.error(err);
				me.error("Activation failed: {0}", err);
				me._active.move("failed");
				throw err;
			});
		},

		/**
		 * Деактивирует текущую компоненту, если у компоненты задан контроллер,
		 * то деактивация будет осуществляться через него.
		 * 
		 * @async
		 * @param{Boolean} direct вызов должен осуществится напрямую, без
		 *                 участия контроллера.
		 * 
		 */
		deactivate: function (direct) {
			var me = this;
			if (!direct && me._controller)
				return me._controller.deactivate(me).then(function () {
					me.onDeactivated();
				});

			me._active.move("deactivate");
			return guard(me, "onDeactivating").then(function () {
				me.log("Deactivated");
				me._active.move("success");
				if (!me._controller)
					me.onDeactivated();
			}, function (err) {
				console.error(err);
				me.error("Deactivation failed: {0}", err);
				me.move("failed");
				throw err;
			});

		},

		toogleActive: function () {
			var me = this;
			return (me.isActive() ? me.deactivate() : me.activate()).then(function () {
				return me.isActive();
			});
		},

		/**
		 * Событие вызывается перед активацией текущей компоненты
		 * 
		 * @returns{Boolean|undefined} если false - активация будет отменена
		 */
		onActivating: function () {},

		/**
		 * Событие вызывается перед деактивацией текущей компоненты
		 * 
		 * @returns {Boolean|undefined} если false - деактивация будет отменена
		 */
		onDeactivating: function () {},

		/**
		 * Событие вызывается после активации текущей компоненты
		 */
		onActivated: function () {},

		/**
		 * Событие вызывается после деактивации текущей компоненты
		 */
		onDeactivated: function () {}

	});
});