Ext.define('GraphicDesigner.SymbolNumberField', {
	extend : 'Ext.form.field.Number',
	xtype : 'gdsymbolnumberfield',
	symbol : '%',
	afterRender : function() {
		$(this.inputEl.dom).parent().css({
			position : 'relative'
		});
		var symb = $('<span>' + this.symbol + '</span>');
		symb.css({
			position : 'absolute',
			color : '#50504F',
			top : '3px',
			right : '3px'
		});
		$(this.inputEl.dom).after(symb);

		this.callParent();
	}
});

Ext.define('GraphicDesigner.ColorPickerButton', {
	extend : 'Ext.Button',
	xtype : 'gdcolorpickerbutton',
	getText : function() {
		return '<span class="gdicon-color_lens"></span>';
	},
	doSetColor : function(color) {},
	initComponent : function() {
		var me = this;

		this.text = '<div style="height:16px;position:relative;overflow:hidden;">' + this.getText() + '<br /><div class="gd-style-font-color-indicator"></div></div>';
		this.menu = {
			plain : true,
			closeAction : 'hide',
			items : [{
				xtype : 'colorpicker',
				listeners : {
					select : function(c, color) {
						this.ownerCt.close();
						me.updateColor(color);
						me.doSetColor(color);
					},
					afterRender : function() {
						var c = this;
						$(this.el.dom).find('a.x-color-picker-item').hover(function() {
							var color = GraphicDesigner.translateHexColorFromRgb($(this).find('span').css('background-color'));
							$(c.nextSibling().el.dom).find('.gd-style-color-input').val(color.substring(1));
						}, function() {
							$(c.nextSibling().el.dom).find('.gd-style-color-input').val(me.currentColor);
						});
					}
				}
			}, {
				xtype : 'panel',
				bodyPadding : 2,
				html : '&nbsp;#<input class="gd-style-color-input" value="' + (me.currentColor ? me.currentColor : '000000') + '" />',
				listeners : {
					afterRender : function() {
						$(this.el.dom).find('.gd-style-color-input').keydown(function(e) {
							e.stopPropagation();
							if ([8, 37, 38, 39, 40].indexOf(e.keyCode) != -1) return;

							if ((e.keyCode >= 'a'.charCodeAt() && e.keyCode <= 'f'.charCodeAt()) ||
								(e.keyCode >= 'A'.charCodeAt() && e.keyCode <= 'F'.charCodeAt()) ||
								(e.keyCode >= '0'.charCodeAt() && e.keyCode <= '9'.charCodeAt())) {
								if ($(this).val().length == 6) e.preventDefault();
							} else {
								if (!e.metaKey && !e.ctrlKey) e.preventDefault();
							}
						}).keyup(function(e) {
							if (e.keyCode == 13) {
								var color = $(this).val();
								if (color.length != 6) return;
								var valid = true;

								for (var i = 0; i < color.length; i++) {
									var c = color[i].toLowerCase();
									if ((c >= 'a' && c <= 'f') || (c >= '0' && c <= '9')) continue;
									valid = false;
									break;
								};

								if (valid) {
									me.updateColor(color);
									me.doSetColor(color);
								}
							}
						});
					}
				}
			}]
		};

		this.callParent();
	},
	updateColor : function(color) {
		$(this.el.dom).find('.gd-style-font-color-indicator').css({
			'background-color' : '#' + color
		});

		this.currentColor = color;
		if (this.menu.el) {
			$(this.menu.el.dom).find('.gd-style-color-input').val(color);
		}
	}
});

Ext.define('GraphicDesigner.SelectCombo', {
	extend : 'Ext.Button',
	xtype : 'gdselectcombo',
	//item in items should b in format as a menuitem(but no iconCls)
	items : [],
	checkIconCls : 'gdicon-checkmark',
	//args menuitem
	handleItem : Ext.emptyFn,
	initComponent : function() {
		var me = this;
		var handler = function() {
			Ext.each(this.ownerCt.query('*[iconCls="gdicon-checkmark"]'), function(mi) {
				mi.setIconCls('x');
			});
			this.setIconCls(me.checkIconCls);
			me.handleItem(this);
		}

		Ext.each(this.items, function(item) {
			if (!item.iconCls) item.iconCls = 'x';
			if (!item.handler) item.handler = handler;
		});

		this.menu = this.items;
		delete this.items;

		this.callParent();
	}
});

