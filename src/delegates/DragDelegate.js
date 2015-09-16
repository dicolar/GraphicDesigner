Ext.define('GraphicDesigner.DragDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gddragdelegate',
	buildDelegate : function() {
		this.view.set.attr('cursor', 'move');
	},
	getEventListeners : function() {
		var startFrame;
		return {
			dragstart : function(x, y, e) {
				if (e.button == 2) return;
				startFrame = this.frame;
			},
			dragmoving : function(dx, dy, x, y, e) {
				if (!startFrame) return;
				this.layoutInRect({
					x : startFrame.x + dx,
					y : startFrame.y + dy,
					width : startFrame.width,
					height : startFrame.height
				});
			},
			dragend : function(e) {
				startFrame = null;
				GraphicDesigner.suspendClick();
			}
		};
	}
});