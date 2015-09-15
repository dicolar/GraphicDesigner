Ext.define('GraphicDesigner.FrameTipDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdframetipdelegate',
	buildDelegate : function() {
		this.tooltip = $('<div class="gd-delegate-tooltip">' +
			'<div scope="xy"><span scope="x">X:&nbsp;<span scope="value"></span></span>' +
			'&nbsp;&nbsp;<span scope="y">Y:&nbsp;<span scope="value"></span></span></div>' +

			'<div scope="wh"><span scope="w">W:&nbsp;<span scope="value"></span></span>' +
			'&nbsp;&nbsp;<span scope="h">H:&nbsp;<span scope="value"></span></span></div></div>').hide();
		$(this.view.set.paper.canvas).after(this.tooltip);
	},
	layoutTooltip : function(showpoint, showsize) {
		var rect = this.view.frame;

		if (showpoint) {
			this.tooltip.find('div[scope=xy]').show();
			this.tooltip.find('span[scope=x]').find('span[scope=value]').text(rect.x);
			this.tooltip.find('span[scope=y]').find('span[scope=value]').text(rect.y);
		} else {
			this.tooltip.find('div[scope=xy]').hide();
		}

		if (showsize) {
			this.tooltip.find('div[scope=wh]').show();
			this.tooltip.find('span[scope=w]').find('span[scope=value]').text(rect.width);
			this.tooltip.find('span[scope=h]').find('span[scope=value]').text(rect.height);
		} else {
			this.tooltip.find('div[scope=wh]').hide();
		}

		var position = $(this.view.ownerCt.paper.canvas).position();
		this.tooltip.css({
			left : rect.x + position.left,
			top : rect.y + position.top + rect.height + 10
		});
	},
	getEventListeners : function() {
		var me = this;
		return {
			keymovestart : function() {
				me.layoutTooltip(true, false);
				me.tooltip.show();
			},
			keymoveend : function() {
				me.tooltip.fadeOut(100);
			},
			resize : function(rect, spec) {
				if (['tl', 'l', 't', 'bl'].indexOf(spec) != -1) {
					me.layoutTooltip(true, true);
				} else {
					me.layoutTooltip(false, true);
				}

				me.tooltip.stop().show();
			},
			resizedocked : function(spec) {
				if (['tl', 'l', 't', 'bl'].indexOf(spec) != -1) {
					me.layoutTooltip(true, true);
				} else {
					me.layoutTooltip(false, true);
				}

				me.tooltip.show();
			},
			resizeend : function() {
				me.tooltip.fadeOut(100);
			},
			dragdocked : function() {
				me.layoutTooltip(true, false);
			},
			dragmoving : function(dx, dy, x, y, e) {
				me.layoutTooltip(true, false);
				me.tooltip.show();
			},
			dragend : function(e) {
				me.tooltip.fadeOut(100);
			}
		};
	},
	doDestroy : function() {
		this.tooltip.remove();
	}
});
