Ext.define('GraphicDesigner.ContextMenuDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdcontextmenudelegate'//,TODO
	//getEventListeners : function() {
	//	var me = this;
	//	return {
	//		contextmenu : function(x, y, e) {
	//			e.preventDefault();
	//			Ext.menu.Manager.get(me.buildMenu(this)).showAt([x, y]);
	//			return false;
	//		}
	//	};
	//},
	//buildMenu : function(view) {
	//	return [{
	//		text : 'hahaha',
	//		handler : function() {
	//			alert(view.viewId);
	//		}
	//	}];
	//}
});