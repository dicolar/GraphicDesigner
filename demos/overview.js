Ext.onReady(function() {

	Ext.create('Ext.Viewport', {
		layout : 'fit',
		items : [{
			layout : 'border',
			dockedItems : [{
				cls : 'toolbar-shadow',
				xtype : 'toolbar',
				dock : 'top',
				items : [{
					xtype : 'checkbox',
					boxLabel : 'Constraint',
					listeners : {
						change : function(c, v) {
							this.ownerCt.ownerCt.getComponent('canvas').constraint = v;
							this.nextSibling().setDisabled(!v);
						}
					}
				}, {
					xtype : 'gdsymbolnumberfield',
					editable : false,
					minValue : 0,
					maxValue : 20,
					value : 5,
					width : 70,
					symbol : 'px',
					disabled : true,
					listeners : {
						change : function(f, v) {
							this.ownerCt.ownerCt.getComponent('canvas').constraintPadding = v;
						}
					}
				}, '-', {
					text : 'Hide Grid lines',
					btnPosition : 'first',
					toggleGroup : 'toggle-grid',
					listeners : {
						toggle : function(btn, pressed) {
							if (pressed) {
								this.ownerCt.ownerCt.getComponent('canvas').hideGrid();
							} else {
								this.ownerCt.ownerCt.getComponent('canvas').showGrid();
							}
						}
					}
				}, {
					text : 'Toggle Read Only',
					btnPosition : 'last',
					toggleGroup : 'toggle-readonly',
					listeners : {
						toggle : function(btn, pressed) {
							this.ownerCt.ownerCt.getComponent('canvas').asViewMode(pressed);
						}
					}
				}, {
					text : 'Page Size...',
					btnType : 'info',
					actionBtn : true,
					handler : function() {
						var canvasPanel = this.ownerCt.ownerCt.getComponent('canvas');
						Ext.create('Ext.window.YesNoWindow', {
							title : this.text,
							modal : true,
							width : 250,
							height : 150,
							noText : 'Close',
							layout : 'fit',
							showYesButton : false,
							items : {
								xtype : 'form',
								bodyPadding : 10,
								defaults : {
									anchor : '100%',
									xtype : 'gdsymbolnumberfield',
									symbol : 'px',
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
				}, {
					xtype : 'gdcolorpickerbutton',
					getText : function() {
						return '<span class="gdicon-color_lens gd-style-btn"></span>';
					},
					doSetColor : function(color) {
						this.ownerCt.ownerCt.getComponent('canvas').setBgColor('#' + color);
					}
				}, {
					text : 'Download Graphic',
					handler : function() {
						this.ownerCt.ownerCt.getComponent('canvas').downloadImage('graphic');
					}
				}, {
					text : 'Get Graphic Data',
					handler : function() {
						Ext.widget({
							xtype : 'yesnowindow',
							modal : true,
							title : this.text,
							width : 400,
							height : 300,
							showYesButton : false,
							noText : 'Close',
							layout : 'fit',
							items : [{
								xtype : 'textarea',
								value : Ext.encode(this.ownerCt.ownerCt.getComponent('canvas').getCanvasDescription())
							}]
						}).show();
					}
				}, {
					text : 'Restore Graphic',
					handler : function() {
						var me = this;
						Ext.widget({
							xtype : 'yesnowindow',
							modal : true,
							title : this.text,
							width : 400,
							height : 300,
							noText : 'Close',
							yesText : 'Restore',
							onOk : function() {
								try {
									var json = Ext.decode(this.getComponent(0).getValue());
									me.ownerCt.ownerCt.getComponent('canvas').restoreCanvasByDescription(json);
									this.close();
								} catch(e) {throw e;
									alert('please provide a correct json data!');
								}
							},
							layout : 'fit',
							items : [{
								xtype : 'textarea',
								focused : true
							}]
						}).show();
					}
				}, '->', {
					xtype : 'label',
					hidden : typeof NOTHEME != 'undefined',
					html : '<a href="overview-notheme.html" class="hyperlink clickable-ex">Looking for a neptune version?click me!</a>'
				}, {
					text : 'Tips',
					handler : function() {
						Ext.widget({
							xtype : 'yesnowindow',
							modal : true,
							title : this.text,
							width : 400,
							height : 300,
							showYesButton : false,
							noText : 'Close',
							bodyPadding : 5,
							html : '<div>' +
								'<div class="gdicon-coffee" style="margin:3px;">Select a view and press SPACE or DOUBLE-CLICK to start edit.</div>' +
								'<div class="gdicon-coffee" style="margin:3px;">When editing,press ENTER to end edit,press ESC to cancel edit.</div>' +
								'<div class="gdicon-coffee" style="margin:3px;">When editing,press TAB to start another view\'s editing.</div>' +
								'<div class="gdicon-coffee" style="margin:3px;">Select a view and press ↑	↓	←	→（Shift supported!） to move it.️</div>' +
								'<div class="gdicon-coffee" style="margin:3px;">Select a view and press BACKSPACE or DELETE to remove it.</div>' +
								'<div class="gdicon-coffee" style="margin:3px;">Select some views and press Ctrl+C&Ctrl+V(on mac both Ctrl&Command key supported) to copy them.</div>' +
								'<div class="gdicon-coffee" style="margin:3px;">Ctrl+X(Command+X) also available for cut action.</div>' +
							'</div>'
						}).show();
					}
				}]
			}, {
				xtype : 'gdtoolbar',
				dock : 'top',
				getCanvasPanel : function() {
					return this.ownerCt.getComponent('canvas');
				}
			}],
			items : [{
				xtype : 'gdviewtemplatelist',
				getCanvasPanel : function() {
					return this.ownerCt.getComponent('canvas');
				},
				region : 'west',
				width : 185,
				autoScroll : true,
				style : 'border-right:1px #CBCCCC solid;',
				tbar : {
					style : 'border-bottom:1px #CBCCCC solid!important;',
					items : [{
						flex : 1,
						enableKeyEvents : true,
						xtype : 'textfield',
						emptyText : 'Search',
						listeners : {
							afterRender : function() {
								$(this.inputEl.dom).css({
									'padding-right' : '22px'
								}).after('<span class="icon-search2" style="color:#d0d0d0;font-size:16px;top:4px;right:5px;position:absolute;"></span>');
							},
							keyup : function() {
								var key = Ext.String.trim(this.getValue());

								if (Ext.isEmpty(key)) {
									this.ownerCt.ownerCt.clearFilter();
								} else {
									this.ownerCt.ownerCt.filter(key);
								}

							}
						}
					}]
				},
				viewsets : [{
					title : 'Workflow',
					xtype : 'gdviewsetpanel',
					viewTpls : [{
						type : 'gdpool',
						title : 'Pool'
					}, {
						type : 'gdhpool',
						title : 'Horizontal Pool'
					}]
				}, {
					title : 'Shape',
					xtype : 'gdviewsetpanel',
					viewTpls : [{
						type : 'gdcircle',
						title : 'Circle'
					}, {
						type : 'gdrect',
						title : 'Rect'
					}]
				}]
			}, {
				xtype : 'gdcanvaspanel',
				itemId : 'canvas',
				//selModel : null,
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
				region : 'center'
			}]
		}]
	});

});

Ext.define('Ext.window.YesNoWindow', {
	extend : 'Ext.window.Window',
	alias : 'widget.yesnowindow',
	xtype : 'yesnowindow',
	preButtons : [],
	buttons : [],
	noText : null,
	showNoButton : true,
	yesText : null,
	showYesButton : true,
	onOk : function() {},
	onClose : function() {},
	initComponent : function() {
		var me = this;

		var buttons = [{
			text : this.noText,
			hidden : !this.showNoButton,
			listeners : {
				afterRender : function() {
					me.noButton = this;
				}
			},
			handler : function() {
				var flag = me.onClose();
				
				if (flag == false) {
					return;
				}
				me.close();
			}
		}, {
			text : this.yesText,
			hidden : !this.showYesButton,
			handler : function() {
				me.onOk();
			},
			listeners : {
				afterRender : function() {
					me.yesButton = this;
				}
			}
		}];
		
		if (this.preButtons) {
			for (var i = this.preButtons.length - 1; i >= 0; i--) {
				buttons.unshift(this.preButtons[i]);
			}
		}
		Ext.each(this.buttons, function(btn) {
			buttons.push(btn);
		});
		this.buttons = buttons;
		
		this.callParent();
	}
});