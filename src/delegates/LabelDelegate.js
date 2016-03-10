Ext.define('GraphicDesigner.LabelDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdlabeldelegate',
	editable : true,
	textElement : null,
	text : '',
	//override it!
	updateStyle : function() {
		this.textElement.attr({
			'font-size' : this.style.fontSize,
			'font-weight' : this.style.fontWeight,
			'font-family' : this.style.fontFamily,
			'font-style' : this.style.fontStyle,
			fill : this.style.color
		});

		$(this.textElement.node).attr('text-decoration', this.style.textDecoration);

		this.textHolder.css({
			'font-size' : this.style.fontSize,
			'font-weight' : this.style.fontWeight,
			'font-family' : this.style.fontFamily,
			'font-style' : this.style.fontStyle,
			color : this.style.color,
			'text-decoration' : this.style.textDecoration,
			'text-align' : this.style.align,
			'vertical-align' : this.style.valign
		});
		this.layoutElements();
	},
	layoutElements : function() {
		var rect = this.getTextRect();

		this.textElement.attr('transform', '');
		var x = null;
		switch (this.style.align) {
			case 'left' :
				this.textElement.attr('text-anchor', 'start');
				x = rect.x + 1;
				break;
			case 'right' :
				this.textElement.attr('text-anchor', 'end');
				x = rect.x + rect.width - 1;
				break;
			default :
				this.textElement.attr('text-anchor', 'middle');
				x = rect.x + rect.width / 2
		}
		var y = null;
		switch (this.style.valign) {
			case 'top' :
				y = rect.y + this.textElement.getBBox().height / 2 + 1;
				break;
			case 'bottom' :
				y = rect.y + rect.height - this.textElement.getBBox().height / 2 - 1;
				break;
			default :
				y = rect.y + rect.height / 2
		}

		this.textElement.attr({
			x : x,
			y : y,
			transform : this.getTransformStr()
		});

	},
	getTransform : Ext.emptyFn,
	getTextRect : function() {
		return {
			x : 10,
			y : 10,
			width : 20,
			height : 20
		};
	},
	buildTextHolder : function() {
		this.textHolder = $('<input type="text" />').hide();
	},
	buildDelegate : function() {
		var me = this;
		if (this.view.labelStyle) {
			this.style = this.view.labelStyle;
			delete this.view.labelStyle;
		}

		this.textElement = this.view.set.paper.text(0, 0, '_').drag(function(dx, dy, x, y, e) {
			me.view.fireEvent('dragmoving', dx, dy, x, y, e);
		}, function(x, y ,e) {
			if (e.button == 2) {
				me.view.fireEvent('contextmenu', x, y, e);
				return;
			}
			e.stopPropagation();
			me.view.fireEvent('dragstart', x, y, e);
		}, function(e) {
			me.view.fireEvent('dragend', e);
		}).hover(function() {
			me.view.fireEvent('hover');
		}, function() {
			me.view.fireEvent('unhover');
		}).click(function(e) {
			e.stopPropagation();
		});

		this.setText(this.text);

		this.buildTextHolder();
		$(this.view.set.paper.canvas).after(this.textHolder);
		this.textHolder.css({
			position : 'absolute',
			'background-color' : 'transparent',
			'border' : '2px solid #F7DDAA',
			'border-radius' : 2
		}).blur(function() {
			me.endEdit();
		}).keydown(function(e) {
			e.stopPropagation();
			if (e.keyCode == 27) {
				me.cancelEdit();
				return;
			}
			if (e.keyCode == 13 || e.keyCode == 9) me.endEdit();
			if (e.keyCode == 9) me.tabNext();
		}).mouseup(function(e) {
			GraphicDesigner.suspendClick();
		});

		this.style = Ext.apply({
			fontSize : '13px',
			fontFamily : 'Arial',
			fontWeight : 'normal',
			fontStyle : 'normal',
			textDecoration : 'normal',
			color : '#000000',
			align : 'center',
			valign : 'middle'
		}, this.style);
		this.updateStyle();

	},
	tabNext : function() {
		//try 2 find next view label delegate & start edit!
		var views = this.view.ownerCt.views;
		if (views.length <= 1) return;

		var i = views.indexOf(this.view);
		while (true) {
			i++;
			var v = views[i % views.length];
			if (v == null || v == this.view) return;

			if (v.labelDelegate && v.labelDelegate.editable) {
				//select it and start edit!
				v.ownerCt.fireEvent('viewclicked', v);
				new Ext.util.DelayedTask(function() {
					v.labelDelegate.startEdit();
				}).delay(50);
				return;
			}
		}
	},
	getEventListeners : function() {
		var me = this;
		return {
			click : function() {
				me.endEdit();
			},
			deselected : function() {
				me.endEdit();
			},
			keydown : function(e) {
				if (this.editing) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				if (me.editable && e.keyCode == 32) {
					e.preventDefault();
					me.startEdit();
				}
			},
			dblclick : function() {
				me.startEdit();
			},
			layout : function() {
				if (me.textHolder.is(':visible')) {
					me.textHolder.hide();
					me.textElement.show();
				}

				me.layoutElements();
			}
		};
	},
	doDestroy : function() {
		this.textElement.remove();
		this.textHolder.remove();
	},
	//private
	getTransformStr : function() {
		var o = this.getTransform();//angle cx cy
		if (!o) return null;

		return 'r' + o.angle + ',' + o.cx + ',' + o.cy;
	},
	cancelEdit : function() {
		this.textHolder.val(this.text).blur();
	},
	startEdit : function() {
		if (!this.editable) return;
		this.textElement.hide();
		//layout text holder 1st!
		var rect = this.getTextRect();
		var position = $(this.view.ownerCt.paper.canvas).position();
		this.textHolder.css({
			left : rect.x,
			top : rect.y,
			width : rect.width,
			height : rect.height
		});

		var transform = this.getTransform();
		if (transform) {
			//simulate a bbox!
			var testRect = this.view.set.paper.rect(rect.x, rect.y, rect.width, rect.height).hide();
			var bx = testRect.transform(this.getTransformStr()).getBBox();
			this.textHolder.css({
				left : position.left + bx.cx - rect.width / 2,
				top : position.top + bx.cy - rect.height / 2
			}).rotate({
				angle : transform.angle,
				center: [bx.cx, bx.cy]
			});
			testRect.remove();
		}
		this.textHolder.show().val(this.text).select();

		GraphicDesigner.viewEditing = true;
		this.view.editing = true;
	},
	endEdit : function() {
		if (!this.view.editing) return;
		this.setText(this.textHolder.hide().val());

		var me = this;
		setTimeout(function() {
			delete GraphicDesigner.viewEditing;
			me.view.editing = false;
		}, 200);
	},
	setText : function(text) {
		this.text = text;
		if (this.view.dragDelegate) {
			this.textElement.attr('cursor', 'move');
		}
		this.textElement.attr('text', text).attr('title', text);
		if (!this.text) {
			this.textElement.attr('text', '_').hide();
		} else {
			this.textElement.show();
		}
	}
});