Ext.define('GraphicDesigner.MultilineLabelDelegate', {
	extend : 'GraphicDesigner.LabelDelegate',
	xtype : 'gdmultilinelabeldelegate',
	buildTextHolder : function() {
		this.textHolder = $('<textarea style="resize:none;outline:none;" />').hide();
	}
});