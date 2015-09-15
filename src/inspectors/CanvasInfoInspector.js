Ext.define('GraphicDesigner.CanvasInfoInspector', {
	extend : 'GraphicDesigner.Inspector',
	xtype : 'gdcanvasinfoinspector',
	iconCls : 'gd-inspector-item-icon gdicon-navigation2',
	title : 'preview',
	observeTarget : 'view',
	initComponent : function() {
		this.panelSize = {
			width : 220,
			height : 243
		};
		var me = this;
		this.panelConfig = {
			bodyPadding : 5,
			bodyStyle : 'background-color:transparent;',
			html : '<div style="height:100%;padding:5px;" align="center"><canvas class="gd-canvas-preview-canvas"></canvas><div class="gd-splitter-h" style="margin-top:5px;"></div></div>',
			bbar : {
				cls : 'gd-inspector-panel-toolbar',
				style : 'padding-bottom:8px;',
				items : ['Scale:', {
					xtype : 'numberfield',
					width : 80,
					style : 'margin-left:5px;'
				}, '->', {
					tooltip : 'presentation',
					iconCls : 'gdicon-presentation gd-canvas-preview-btn',
					style : 'margin-right:3px;'
				}, {
					iconCls : 'gdicon-expand gd-canvas-preview-btn'
				}]
			},
			listeners : {
				afterRender : function() {
					me.update();
				}
			}
		};

		this.callParent();
	},
	update : function() {
		var me = this;
		if (!this.task) this.task = new Ext.util.DelayedTask(function() {
			try {
				var svg = $(me.ownerCt.owner.getCanvas());
				var img = $('<image src="' + me.ownerCt.owner.getDataUrl() + '" />');
				img.width(svg.width()).height(svg.height());
				$(me.el.dom).append(img);

				var cvs = $(me.infoPanel.el.dom).find('canvas');
				cvs.attr('width', svg.width()).attr('height', svg.height());

				var ctx = cvs[0].getContext('2d');

				ctx.fillStyle = me.ownerCt.owner.bgColor;
				ctx.fillRect(0, 0, svg.width(), svg.height());

				ctx.drawImage(img[0], 0, 0, svg.width(), svg.height());

				img.remove();
			} catch(e) {}
		});

		this.task.cancel();
		this.task.delay(100);
	}
});