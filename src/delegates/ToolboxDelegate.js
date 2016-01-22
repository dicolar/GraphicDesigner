Ext.define('GraphicDesigner.ToolboxDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdtoolboxdelegate',
	//item must b in format like this
	//{title : 'xxxx', icon : 'gdicon-xxx', handler : function(view) {....}, [precondition: function(view) {...}
	//precondition: indicate if this toolbtn is valid
	items : [],
	buildDelegate : function() {
		var me = this;
		var paper = this.view.set.paper;
		if (Ext.isEmpty(this.items)) return;

		this.toolbox = $('<div class="gd-toolbox"></div>').click(function(e) { e.stopPropagation();}).hide();
		this.tooltip = $('<div class="gd-toolbox-tooltip"></div>').hide();
		this.items.filter(function(item) {
			var it = $('<div class="gd-toolbox-item ' + item.icon + '"></div>').hover(function() {
				//hide all other visible toolboxes first!
				me.tooltip.removeClass().addClass('gd-toolbox-tooltip ' + item.icon).text(' ' + item.title).show();
			}, function() {
				me.tooltip.hide();
			}).data('item', item);
			me.toolbox.append(it);
			it.click(function(e) {
				item.handler ? item.handler(me.view, $(this), e) : null;
				me.layoutElements();
			});
		});

		$(paper.canvas).after(this.toolbox);
		$(paper.canvas).after(this.tooltip);

		var disappearTask = new Ext.util.DelayedTask(function(){
			me.toolbox.hide();
		});

		this.view.on('hover', function() {
			if (GraphicDesigner.selecting) return;
			$('.gd-toolbox:visible').hide();
			disappearTask.cancel();
			me.layoutElements();
			me.toolbox.show();
		});
		this.view.on('unhover', function() {
			disappearTask.delay(200);
		});
		this.toolbox.hover(function() {
			disappearTask.cancel();
			me.layoutElements();
			me.toolbox.show();
		}, function() {
			disappearTask.delay(200);
		});

	},
	getEventListeners : function() {
		var me = this;
		return {
			keymovestart : function() { me.toolbox.hide();},
			dragmoving : function() { me.toolbox.hide();},
			dragend : function() {
				me.layoutElements();
				me.toolbox.show();
			}
		};
	},
	doDestroy : function() {
		this.tooltip.remove();
		this.toolbox.remove();
	},
	layoutElements : function() {
		var frame = this.view.frame;
		this.tooltip.css({
			left : frame.x + frame.width + 3,
			top : frame.y - 20
		});
		this.toolbox.css({
			left : frame.x + frame.width + 3,
			top : frame.y
		}).show();
		//indicate btns...
		var me = this;
		this.toolbox.children().each(function(i, btn) {
			btn = $(btn);
			var item = btn.data('item');
			if (item && item.precondition) {
				btn[item.precondition(me.view) ? 'show' : 'hide']();
			}
		});
		var items = this.toolbox.children('*:visible');
		this.toolbox.removeClass().addClass('gd-toolbox');
		if (items.length == 1) {
			this.toolbox.addClass('gd-toolbox-1item');
		} else if (items.length == 2) {
			this.toolbox.addClass('gd-toolbox-2item');
		} else {
			this.toolbox.addClass('gd-toolbox-common');
		}
	}
});