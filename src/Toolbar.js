Ext.define('GraphicDesigner.Toolbar', {
	extend : 'Ext.toolbar.Toolbar',
	xtype : 'gdtoolbar',
	cls : 'gd-toolbar',
	getCanvasPanel : Ext.emptyFn,
	initComponent : function() {
		var me = this;

		var alignHandler = function(btn, pressed) {
			var key = this.key;
			var value = this.value;
			Ext.each(me.selections, function(v) {
				if (v.labelDelegate) {
					v.labelDelegate.style[key] = value;
					v.labelDelegate.updateStyle();
				}
			});
		}
		var alignUpdateSels = function(sels) {
			if (sels.length > 1) return;

			this.suspendEvents(false);
			this.toggle(sels[0].labelDelegate.style[this.key] == this.value);
			this.resumeEvents();
		}

		this.items = [{
			xtype : 'gdselectcombo',
			width : 100,
			updateSels : function(sels) {
				if (sels.length > 1) return;

				var rec = this.menu.query('*[fontFamily="' + sels[0].labelDelegate.style.fontFamily + '"]')[0];
				this.setText(rec.text);
				Ext.each(this.ownerCt.query('*[iconCls="gdicon-checkmark"]'), function(mi) {
					mi.setIconCls('x');
				});
				rec.setIconCls('gdicon-checkmark');
			},
			handleItem : function(item) {
				var ff = item.fontFamily;
				this.setText(item.text);
				Ext.each(me.selections, function(v) {
					if (v.labelDelegate) {
						v.labelDelegate.style.fontFamily = ff;
						v.labelDelegate.updateStyle();
					}
				});
			},
			text : '<span style="font-family:Arial;">Arial</span>',
			items : [{
				fontFamily : 'Arial',
				text : '<span style="font-family:Arial;">Arial</span>'
			}, {
				fontFamily : 'Helvetica',
				text : '<span style="font-family:Helvetica;">Helvetica</span>'
			}, {
				iconCls : 'x',
				fontFamily : 'Courier New',
				text : '<span style="font-family:Courier New;">Courier New</span>'
			}, {
				fontFamily : 'Verdana',
				text : '<span style="font-family:Verdana;">Verdana</span>'
			}, {
				iconCls : 'x',
				fontFamily : 'Georgia',
				text : '<span style="font-family:Georgia;">Georgia</span>'
			}, {
				fontFamily : 'Times New Roman',
				text : '<span style="font-family:Times New Roman;">Times New Roman</span>'
			}, {
				fontFamily : 'Impact',
				text : '<span style="font-family:Impact;">Impact</span>'
			}, {
				fontFamily : 'Comic Sans MS',
				text : '<span style="font-family:Comic Sans MS;">Comic Sans MS</span>'
			}, {
				fontFamily : 'Tahoma',
				text : '<span style="font-family:Tahoma;">Tahoma</span>'
			}, {
				fontFamily : 'Garamond',
				text : '<span style="font-family:Garamond;">Garamond</span>'
			}, {
				fontFamily : 'Lucida Console',
				text : '<span style="font-family:Lucida Console;">Lucida Console</span>'
			}, '-', {
				fontFamily : '宋体',
				text : '<span style="font-family:宋体;">宋体</span>'
			}, {
				fontFamily : '微软雅黑',
				text : '<span style="font-family:微软雅黑;">微软雅黑</span>'
			}, {
				fontFamily : '黑体',
				text : '<span style="font-family:黑体;">黑体</span>'
			}]
		}, '-', {
			xtype : 'gdsymbolnumberfield',
			minValue : 10,
			maxValue : 100,
			value : 13,
			width : 73,
			symbol : 'px',
			updateSels : function(sels) {
				if (sels.length > 1) return;

				this.suspendEvents(false);
				this.setValue(sels[0].labelDelegate.style.fontSize);
				this.resumeEvents();
			},
			listeners : {
				change : function(f, value) {
					Ext.each(me.selections, function(v) {
						if (v.labelDelegate) {
							v.labelDelegate.style.fontSize = value;
							v.labelDelegate.updateStyle();
						}
					});
				}
			}
		}, '-', {
			iconCls : 'gdicon-format_bold gd-style-btn',
			toggleGroup : Ext.id(),
			updateSels : function(sels) {
				if (sels.length > 1) return;

				this.suspendEvents(false);
				this.toggle(sels[0].labelDelegate.style.fontWeight == 'bold');
				this.resumeEvents();
			},
			listeners : {
				toggle : function(btn, pressed) {
					Ext.each(me.selections, function(v) {
						if (v.labelDelegate) {
							v.labelDelegate.style.fontWeight = pressed ? 'bold' : 'normal';
							v.labelDelegate.updateStyle();
						}
					});
				}
			}
		}, {
			iconCls : 'gdicon-format_italic gd-style-btn',
			toggleGroup : Ext.id(),
			updateSels : function(sels) {
				if (sels.length > 1) return;

				this.suspendEvents(false);
				this.toggle(sels[0].labelDelegate.style.fontStyle == 'italic');
				this.resumeEvents();
			},
			listeners : {
				toggle : function(btn, pressed) {
					Ext.each(me.selections, function(v) {
						if (v.labelDelegate) {
							v.labelDelegate.style.fontStyle = pressed ? 'italic' : 'normal';
							v.labelDelegate.updateStyle();
						}
					});
				}
			}
		}, {
			iconCls : 'gdicon-format_underlined gd-style-btn',
			toggleGroup : Ext.id(),
			updateSels : function(sels) {
				if (sels.length > 1) return;

				this.suspendEvents(false);
				this.toggle(sels[0].labelDelegate.style.textDecoration == 'underline');
				this.resumeEvents();
			},
			listeners : {
				toggle : function(btn, pressed) {
					Ext.each(me.selections, function(v) {
						if (v.labelDelegate) {
							v.labelDelegate.style.textDecoration = pressed ? 'underline' : '';
							v.labelDelegate.updateStyle();
						}
					});
				}
			}
		}, {
			xtype : 'gdcolorpickerbutton',
			getText : function() {
				return '<span class="gdicon-format_color_text gd-style-btn"></span>';
			},
			updateSels : function(sels) {
				if (sels.length > 1) return;
				this.updateColor(sels[0].labelDelegate.style.color.substring(1));
			},
			doSetColor : function(color) {
				Ext.each(me.selections, function(v) {
					if (v.labelDelegate) {
						v.labelDelegate.style.color = '#' + color;
						v.labelDelegate.updateStyle();
					}
				});
			}
		}, {
			iconCls : 'gdicon-format_align_left gd-style-btn',
			toggleGroup : me.id + '-align',
			allowDepress : false,
			key : 'align',
			value : 'left',
			handler : alignHandler,
			updateSels : alignUpdateSels
		}, {
			iconCls : 'gdicon-format_align_center gd-style-btn',
			toggleGroup : me.id + '-align',
			allowDepress : false,
			key : 'align',
			value : 'center',
			handler : alignHandler,
			updateSels : alignUpdateSels
		}, {
			iconCls : 'gdicon-format_align_right gd-style-btn',
			toggleGroup : me.id + '-align',
			allowDepress : false,
			key : 'align',
			value : 'right',
			handler : alignHandler,
			updateSels : alignUpdateSels
		}, {
			iconCls : 'gdicon-vertical_align_top gd-style-btn',
			toggleGroup : me.id + '-valign',
			allowDepress : false,
			key : 'valign',
			value : 'top',
			handler : alignHandler,
			updateSels : alignUpdateSels
		}, {
			iconCls : 'gdicon-vertical_align_center gd-style-btn',
			toggleGroup : me.id + '-valign',
			allowDepress : false,
			key : 'valign',
			value : 'middle',
			handler : alignHandler,
			updateSels : alignUpdateSels
		}, {
			iconCls : 'gdicon-vertical_align_bottom gd-style-btn',
			toggleGroup : me.id + '-valign',
			allowDepress : false,
			key : 'valign',
			value : 'bottom',
			handler : alignHandler,
			updateSels : alignUpdateSels
		}, '-', {
			xtype : 'gdcolorpickerbutton',
			getText : function() {
				return '<span class="gdicon-format_color_fill gd-style-btn"></span>';
			},
			updateSels : function(sels) {
				if (sels.length > 1) return;
				this.updateColor(sels[0].style.fill.substring(1));
			},
			doSetColor : function(color) {
				Ext.each(me.selections, function(v) {
					v.style.fill = '#' + color;
					v.updateStyle();
				});
			}
		}, {
			xtype : 'gdcolorpickerbutton',
			getText : function() {
				return '<span class="gdicon-border_color gd-style-btn"></span>';
			},
			updateSels : function(sels) {
				if (sels.length > 1) return;
				this.updateColor(sels[0].style.lineColor.substring(1));
			},
			doSetColor : function(color) {
				Ext.each(me.selections, function(v) {
					v.style.lineColor = '#' + color;
					v.updateStyle();
				});
			}
		}, {
			xtype : 'gdselectcombo',
			text : '<div style="position:relative;width:20px;height:16px;">' +
			'<div style="position:absolute;width:100%;top:0px;background-color:black;height:4px;"></div>' +
			'<div style="position:absolute;width:100%;top:8px;background-color:black;height:3px;"></div>' +
			'<div style="position:absolute;width:100%;top:14px;background-color:black;height:2px;"></div>' +
			'</div>',
			updateSels : function(sels) {
				if (sels.length > 1) return;

				Ext.each(this.menu.query('*[iconCls="gdicon-checkmark"]'), function(mi) {
					mi.setIconCls('x');
				});
				this.menu.query('*[lineWidth=' + sels[0].style.lineWidth + ']')[0].setIconCls('gdicon-checkmark');
			},
			handleItem : function(item) {
				var width = item.lineWidth;
				Ext.each(me.selections, function(v) {
					v.style.lineWidth = width;
					v.updateStyle();
				});
			},
			items : [{
				lineWidth : 0,
				text : '0px'
			}, {
				lineWidth : 1,
				text : '1px'
			}, {
				lineWidth : 2,
				text : '2px'
			}, {
				lineWidth : 3,
				text : '3px'
			}, {
				lineWidth : 4,
				text : '4px'
			}, {
				lineWidth : 5,
				text : '5px'
			}, {
				lineWidth : 6,
				text : '6px'
			}, {
				lineWidth : 8,
				text : '8px'
			}, {
				lineWidth : 10,
				text : '10px'
			}]
		}, {
			xtype : 'gdselectcombo',
			text : '<div style="position:relative;width:20px;height:16px;">' +
			'<div style="position:absolute;width:100%;top:2px;background-color:black;height:2px;"></div>' +

			'<div style="position:absolute;width:40%;top:8px;background-color:black;height:2px;"></div>' +
			'<div style="position:absolute;width:40%;top:8px;left:12px;background-color:black;height:2px;"></div>' +

			'<div style="position:absolute;width:20%;top:14px;background-color:black;height:2px;"></div>' +
			'<div style="position:absolute;width:20%;top:14px;left:8px;background-color:black;height:2px;"></div>' +
			'<div style="position:absolute;width:20%;top:14px;left:16px;background-color:black;height:2px;"></div>' +
			'</div>',
			updateSels : function(sels) {
				if (sels.length > 1) return;

				Ext.each(this.menu.query('*[iconCls="gdicon-checkmark"]'), function(mi) {
					mi.setIconCls('x');
				});
				if (!sels[0].style.lineStyle) {
					this.menu.items.items[0].setIconCls('gdicon-checkmark');
				} else {
					this.menu.query('*[lineStyle="' + sels[0].style.lineStyle + '"]')[0].setIconCls('gdicon-checkmark');
				}
			},
			handleItem : function(item) {
				var style = item.lineStyle;
				Ext.each(me.selections, function(v) {
					v.style.lineStyle = style;
					v.updateStyle();
				});
			},
			items : [{
				lineStyle : '',
				text : '<div class="gd-style-linestyle gd-style-line-normal"></div>'
			}, {
				lineStyle : '-',
				text : '<div class="gd-style-linestyle gd-style-line-dashed"></div>'
			}, {
				lineStyle : '.',
				text : '<div class="gd-style-linestyle gd-style-line-dotted"></div>'
			}, {
				lineStyle : '-.',
				text : '<div class="gd-style-linestyle gd-style-line-dash-dotted"></div>'
			}]
		}, '-', {
			iconCls : 'gdicon-flip_to_front gd-style-btn',
			handler : function() {
				Ext.each(me.selections, function(v) {
					v.flipToFront();
				});
			}
		}, {
			iconCls : 'gdicon-flip_to_back gd-style-btn',
			handler : function() {
				Ext.each(me.selections, function(v) {
					v.flipToBack();
				});
			}
		}];

		this.callParent();
	},
	afterRender : function() {
		var me = this;
		var cp = this.getCanvasPanel();
		if (cp && cp.selModel) {
			if (cp.rendered) {
				cp.selModel.on('selectionchange', function() {
					me.selections = this.getSelections();
					me.handleSelectionChange();
				});
			} else {
				cp.on('afterRender', function() {
					this.selModel.on('selectionchange', function() {
						me.selections = this.getSelections();
						me.handleSelectionChange();
					});
				});
			}

			$(this.el.dom).click(function(e) {
				e.stopPropagation();
				cp.fireLastCanvasClick();
			});
		}

		this.items.each(function(c) {
			c.setDisabled ? c.setDisabled(true) : null;
		});

		this.callParent();
		setTimeout(function() {
			me.doLayout();
		}, 100);
	},
	handleSelectionChange : function() {
		if (this.selections.length == 0) {
			//disable all!
			this.items.each(function(c) {
				c.setDisabled ? c.setDisabled(true) : null;
			});
		} else {
			var sels = this.selections;
			this.items.each(function(c) {
				c.setDisabled ? c.setDisabled(false) : null;
				c.updateSels ? c.updateSels(sels) : null;
			});
		}
	}
});