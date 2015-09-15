Ext.define('GraphicDesigner.InspectorDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdinspectordelegate',
	bbEvent : function(eventName, args) {
		this.view.ownerCt.attributesInspectorPanel ?
			this.view.ownerCt.attributesInspectorPanel.updateByView(this.view, eventName, args) : null;
	},
	getEventListeners : function() {
		var me = this;
		var eventO = {
			dragend : function() { me.bbEvent('dragend', arguments);},
			keymoveend : function() { me.bbEvent('keymoveend', arguments);},
			resizeend : function() { me.bbEvent('resizeend', arguments);},
			selected : function() { me.bbEvent('selected', arguments);},
			deselected : function() { me.bbEvent('deselected', arguments);}
		};

		Ext.each(this.otherBBEvents, function(e) {
			eventO[e] = function() {
				me.bbEvent(e, arguments);
			}
		});

		return eventO;
	},
	//dragstart,layout ect.
	otherBBEvents : []
});