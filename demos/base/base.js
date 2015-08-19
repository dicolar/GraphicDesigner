Ext.onReady(function() {

	Ext.create('Ext.Viewport', {
		layout : 'border',
		items : [{
			xtype : 'gdcanvaspanel',
			views : [{
				xtype : 'gdrect',
				frame : {
					x : 100,
					y : 100,
					width : 200,
					height : 100
				},
				text : 'hi,there!'
			}],
			tbar : {
				cls : 'toolbar-shadow',
				items : [{
					xtype : 'checkbox',
					boxLabel : 'Constraint',
					listeners : {
						change : function(c, v) {
							this.ownerCt.ownerCt.constraint = v;
							this.nextSibling().setDisabled(!v);
						}
					}
				}, {
					xtype : 'numberfield',
					editable : false,
					minValue : 0,
					maxValue : 20,
					value : 5,
					width : 180,
					fieldLabel : 'ConstraintPadding',
					disabled : true,
					listeners : {
						change : function(f, v) {
							this.ownerCt.ownerCt.constraintPadding = v;
						}
					}
				}, '-', {
					text : 'HideGridlines',
					btnPosition : 'first',
					toggleGroup : 'toggle-grid',
					listeners : {
						toggle : function(btn, pressed) {
							if (pressed) {
								this.ownerCt.ownerCt.hideGrid();
							} else {
								this.ownerCt.ownerCt.showGrid();
							}
						}
					}
				}, {
					text : 'ToggleReadOnly',
					btnPosition : 'last',
					toggleGroup : 'toggle-readonly',
					listeners : {
						toggle : function(btn, pressed) {
							this.ownerCt.ownerCt.asViewMode(pressed);
						}
					}
				}, {
					text : 'PageSize',
					btnType : 'info',
					actionBtn : true,
					handler : function() {
						var canvasPanel = this.ownerCt.ownerCt;
						Ext.create('Ext.window.YesNoWindow', {
							title : this.text,
							modal : true,
							width : 300,
							height : 150,
							noText : 'Close',
							layout : 'fit',
							showYesButton : false,
							items : {
								xtype : 'form',
								bodyPadding : 10,
								defaults : {
									anchor : '100%',
									xtype : 'numberfield',
									minValue : 500,
									step : 50,
									editable : false,
									listeners : {
										change : function(f, v) {
											var w = this.ownerCt.getComponent(0).getValue();
											var h = this.ownerCt.getComponent(1).getValue();

											canvasPanel.setPaperSize(w, h);
										}
									}
								},
								items : [{
									fieldLabel : 'W',
									value : canvasPanel.paperWidth
								}, {
									fieldLabel : 'H',
									value : canvasPanel.paperHeight
								}]
							}
						}).show();
					}
				}]
			},
			region : 'center'
		}]
	});

});