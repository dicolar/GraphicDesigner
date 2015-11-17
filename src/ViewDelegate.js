Ext.define('GraphicDesigner.ViewDelegate', {
	extend : 'GraphicDesigner.BaseObject',
	xtype : 'gdviewdelegate',
	//return object in format: {onDrag: function() ...}
	getEventListeners : Ext.emptyFn,
	preBuild : Ext.emptyFn,
	buildDelegate : Ext.emptyFn,
	doDestroy : Ext.emptyFn,
	wireView : function(view) {
		this.view = view;

		this.preBuild();
		this.buildDelegate();

		this._listeners = this.getEventListeners();
		this.enableListeners();
		this.rendered = true;
	},
	enableListeners : function() {
		this.disabled = false;
		if (!Ext.isObject(this._listeners)) return;
		for (var key in this._listeners) {
			this.view.on(key, this._listeners[key]);
		}
	},
	disableListeners : function() {
		this.disabled = true;
		if (!Ext.isObject(this._listeners)) return;
		for (var key in this._listeners) {
			this.view.un(key, this._listeners[key]);
		}
	},
	destroy : function() {
		this.disableListeners();
		this.destroyed = true;
		this.doDestroy();
	}
});