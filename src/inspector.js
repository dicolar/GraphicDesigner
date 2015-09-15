Ext.define('GraphicDesigner.AttributesInspectorPanel', {
	extend : 'Ext.toolbar.Toolbar',
	xtype : 'gdattributesinspectorpanel',
	cls : 'gd-attr-inspector',
	shadow : false,
	defaults : {
		width : 30,
		height : 30
	},
	infoPanelVisible : true,
	inspectors : [{
		//	xtype : 'gdinspector'
		//}, {
		xtype : 'gdcanvasinfoinspector'
	}, {
		xtype : 'gdframeinfoinspector'
	}],
	updateByView : function(view, eventName, args) {
		if (!this.__VIEW_INSPECTORS) this.__VIEW_INSPECTORS = this.query('*[observeTarget=view]');

		this.__VIEW_INSPECTORS.filter(function(insp) {
			insp.update ? insp.update(view, eventName, args) : null;
		});

	},
	updateByCanvas : function() {},
	onShow : function() {
		this.query('button[pressed=true]').filter(function(b) {
			b.infoPanel ? b.fireEvent('toggle', b, true) : null;
		});

		this.callParent(arguments);
	},
	onHide : function() {
		this.query('button[pressed=true]').filter(function(b) {
			b.infoPanel ? b.infoPanel.hide() : null;
		});

		this.callParent(arguments);
	},
	initComponent : function() {
		this.vertical = true;
		this.floating = true;
		this.fixed = true;

		var toggleGroup = Ext.id() + '-inspector-toggle-group';
		Ext.each(this.inspectors, function(c) {c.toggleGroup = toggleGroup;c.allowDepress = true;});
		this.items =  this.inspectors;

		this.callParent();
	},
	layoutInspector : function() {
		this.query('button[pressed=true]').filter(function(b) {
			b.infoPanel ? b.fireEvent('toggle', b, true) : null;
		});
	},
	afterRender : function() {
		var me = this;
		$(this.el.dom).click(function(e) {
			e.stopPropagation();
			me.owner.fireLastCanvasClick();
		}).prepend('<div class="gd-attr-inspector-header"></div>');
		//toggle first!

		this.callParent();

		if (this.infoPanelVisible && this.getComponent(0)) {
			this.getComponent(0).toggle(true);
		}
	}
});
//------------inspectors---------------
Ext.define('GraphicDesigner.Inspector', {
	xtype : 'gdinspector',
	extend : 'Ext.button.Button',
	iconCls : 'gd-inspector-item-icon',
	title : '',
	panelSize : {
		width : 250,
		height : 300
	},
	panelConfig : {},
	observeTarget : 'view',
	//private
	layoutInfoPanel : function(callback) {
		var me = this;
		new Ext.util.DelayedTask(function() {
			me.infoPanel.show();
			me.infoPanel.alignTo(me.ownerCt.el, 'tr-tl', [1, 11]);
			me.infoPanel.hide();
			callback ? callback(me.infoPanel) : null;
		}).delay(30);
	},
	initComponent : function() {
		var me = this;
		this.infoPanel = Ext.widget({
			xtype : 'toolbar',
			vertical : true,
			shadow : false,
			cls : 'gd-attr-inspector-floating-panel',
			style : 'padding:0px!important;',
			layout : 'column',
			listeners : {
				afterRender : function() {
					$(this.el.dom).click(function(e) {
						e.stopPropagation();
						me.ownerCt.owner.fireLastCanvasClick();
					});
				}
			},
			items : [{
				xtype : 'header',
				cls : 'gd-inspector-panel-header',
				title : this.title,
				style : 'margin-bottom:0px;',
				height : 20,
				columnWidth : 1,
				listeners : {
					afterRender : function() {
						Ext.fly(this.el.query('.x-header-text')[0]).addCls('gd-inspector-panel-header-text');

						$(this.el.dom).append('<div class="gdicon-fast_forward gd-inspector-panel-header-btn"></div>')
							.find('.gd-inspector-panel-header-btn').click(function() {
								me.toggle(false);
							});
					}
				}

			}, Ext.apply({
				xtype : 'panel',
				height : this.panelSize.height - 20,
				columnWidth : 1,
			}, this.panelConfig)],
			width : this.panelSize.width,
			height : this.panelSize.height,
			floating : true
		});
		this.infoPanel.hide();
		this.infoPanel.getComponent(1).on('afterRender', function() {
			$(this.el.dom).css('margin-bottom', '0px');
		});

		this.on('toggle', function(b, p) {
			this.layoutInfoPanel(function(ip) {
				ip[p ? 'show' : 'hide']();
			});
		});

		this.callParent();
	},
	afterRender : function() {
		this.callParent();

		var me = this;
		me.layoutInfoPanel();
	},
	destroy : function() {
		this.infoPanel.destroy();
		this.callParent();
	}
});