Ext.define('GraphicDesigner.FrameInfoInspector', {
	extend : 'GraphicDesigner.Inspector',
	xtype : 'gdframeinfoinspector',
	iconCls : 'gd-inspector-item-icon gdicon-ruler3',
	title : 'Position & Size',
	labels : ['X', 'Y', 'W', 'H'],
	observeTarget : 'view',
	update : function(view, eventName, args) {
		var fields = this.infoPanel.query('numberfield');
		if (['dragend', 'selected', 'resizeend', 'keymoveend'].indexOf(eventName) != -1) {
			this.view = view;
			//update values
			fields.filter(function(f) {
				f.enable();
				f.suspendEvents(false);
				switch (f.scope) {
					case 'x' :
						f.setValue(view.frame.x);
						break;
					case 'y' :
						f.setValue(view.frame.y);
						break;
					case 'w' :
						f.setValue(view.frame.width);
						break;
					case 'h' :
						f.setValue(view.frame.height);
						break;
				}
				f.resumeEvents();
			});
		} else if (eventName == 'deselected') {
			fields.filter(function(f) {f.disable();});
			delete this.view;
		};
	},
	initComponent : function() {
		var me = this;
		this.panelSize = {
			width : 230,
			height : 110
		}
		this.panelConfig = {
			layout : 'vbox',
			defaults : {
				xtype : 'toolbar'
			},
			items : [{
				style : 'background-color:transparent;',
				items : [{
					xtype : 'label',
					html : this.labels[0],
					style : 'width:20px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 5,
					scope : 'x',
					value : 0,
					width : 80,
					listeners : {
						change : function(f, v) {
							me.view.frame.x = this.getValue();
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('keymoveend');
						}
					}
				}, {
					xtype : 'label',
					html : this.labels[2],
					style : 'width:20px;margin-left:10px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 5,
					scope : 'w',
					value : 20,
					width : 80,
					listeners : {
						change : function(f, v) {
							var ct = me.ownerCt.owner;
							me.view.frame.width = this.getValue();
							if (ct.constraint) {
								me.view.frame.width = Math.min(me.view.frame.width, ct.paperWidth - ct.constraintPadding - ct.constraintPadding - me.view.frame.x);
							}
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('resizeend');
						}
					}
				}]
			}, {
				style : 'background-color:transparent;',
				items : [{
					xtype : 'label',
					html : this.labels[1],
					style : 'width:20px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 5,
					scope : 'y',
					value : 0,
					width : 80,
					listeners : {
						change : function(f, v) {
							me.view.frame.y = this.getValue();
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('keymoveend');
						}
					}
				}, {
					xtype : 'label',
					html : this.labels[3],
					style : 'width:20px;margin-left:10px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 5,
					scope : 'h',
					value : 20,
					width : 80,
					listeners : {
						change : function(f, v) {
							var ct = me.ownerCt.owner;
							me.view.frame.height = this.getValue();
							if (ct.constraint) {
								me.view.frame.height = Math.min(me.view.frame.height, ct.paperHeight - ct.constraintPadding - ct.constraintPadding - me.view.frame.y);
							}
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('resizeend');
						}
					}
				}]
			}],
			listeners : {
				afterRender : function() {
					me.update(null, 'deselected');
				}
			}
		};

		this.callParent();
	}
});