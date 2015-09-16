Ext.define('GraphicDesigner.SelectionModel', {
	extend : 'Ext.Component',
	xtype : 'gdselmodel',
	requires : ['GraphicDesigner.CanvasPanel'],
	//private
	linkerSels : [],
	selectLinker : function(linker) {
		linker.highlight();
		this.linkerSels.push(linker);
		this.fireEvent('selectionchange');
	},
	clearLinkerSels : function() {
		if (this.linkerSels.length == 0) return;
		this.linkerSels = this.linkerSels.filter(function(l) {l.dehighlight(); return false;});
		this.fireEvent('selectionchange');
	},
	removeLinkerSels : function() {
		this.linkerSels.filter(function(a) {a.remove();});
		this.clearLinkerSels();
	},
	destroy : function() {
		$(document).off('click', this.documentClickListener);
	},
	build : function(canvasPanel) {
		this.ownerCt = canvasPanel;
		var me = this;
		//add events...

		this.documentClickListener = function(e) {
			if ($(e.target).parents('.x-boundlist ').length || $(e.target).parents('.x-menu').length) return;
			if (!GraphicDesigner.suspendClickEvent) {
				canvasPanel.fireEvent('canvasclicked');
			}
			delete GraphicDesigner.suspendClickEvent;
		}
		$(document).click(this.documentClickListener);

		canvasPanel.on('canvasclicked', function() {
			me.clearSelection();
		});
		canvasPanel.on('viewclicked', function(view) {
			canvasPanel.fireLastCanvasClick();
			me.clearLinkerSels();

			var toDesels = [];
			var toSels = [view];
			me.getSelections().filter(function(v) {
				if (view == v) return;
				toDesels.push(v);
			});

			//deselect others...
			toDesels.filter(function(v) {
				v.selected = false;
				v.fireEvent('deselected');
			});

			var selflag = false;
			toSels.filter(function(v) {
				if (!v.selected) {
					selflag = true;
					v.selected = true;
					v.fireEvent('selected', toSels);
				}
			});

			if (toDesels.length || selflag) me.fireEvent('selectionchange');
		});

		this.bindRegionSelection(canvasPanel);

	},
	bindRegionSelection : function(canvasPanel) {
		var me = this;

		var startPoint = null;
		var selectregion = null;
		var finalSelFrame = null;
		var canvasoff = null;
		var pleft = 0;
		var ptop = 0;
		var startOffset = null;
		var mousemoveL = function(e) {
			var x = e.pageX;
			var y = e.pageY;

			if (e.buttons == 0) {
				//cancelled
				mouseupL.apply(this, [e]);
				return;
			}

			var off = canvasoff;
			var frame = finalSelFrame = {
				x : Math.min(x, startPoint.x) - off.left,
				y : Math.min(y, startPoint.y) - off.top,
				width : Math.abs(startPoint.x - x),
				height : Math.abs(startPoint.y - y)
			};

			if (!selectregion) {
				selectregion = $('<div class="gd-selmodel-selector"></div>');
				canvasPanel.container.append(selectregion);
			}

			selectregion.width(frame.width).height(frame.height).css({
				left : frame.x + 'px',
				top : frame.y + 'px'
			});

		};
		var mouseupL = function(e) {
			startPoint = null;
			delete GraphicDesigner.selecting;
			$(document.body).off('mouseup', mouseupL);
			$(document.body).off('mousemove', mousemoveL);
			selectregion ? selectregion.remove() : null;
			selectregion = null;
			if (!finalSelFrame) return;

			GraphicDesigner.suspendClick();
			//select views.
			//if no views, return
			if (canvasPanel.views.length == 0) return;

			//try 2 select views
			var frame = finalSelFrame;
			finalSelFrame = null;
			frame.x = frame.x + pleft;
			frame.y = frame.y + ptop;

			frame.x2 = frame.x + frame.width;
			frame.y2 = frame.y + frame.height;

			new Ext.util.DelayedTask(function(){
				me.selectByRect(frame);
			}).delay(1);

		};
		var mousedownL = function(e) {
			if (e.button != 0 || GraphicDesigner.viewEditing || canvasPanel.viewonly) return;
			if (['PATH', 'TEXT', 'RECT', 'CIRCLE', 'IMAGE'].indexOf(e.target.tagName.toUpperCase()) != -1) return;
			//clear selections
			me.clearSelection();

			GraphicDesigner.selecting = true;
			startPoint = {
				x : e.pageX,
				y : e.pageY
			};

			canvasoff = canvasPanel.container.offset();

			var p1 = canvasPanel.canvasContainer.position();
			//Object {top: 50, left: 160}
			var p2 = canvasPanel.bgLayer.position();
			//Object {top: 50, left: 50}
			var p3 = canvasPanel.container.position();
			//Object {top: -250, left: -140}
			pleft = p3.left - p2.left - p1.left;
			ptop = p3.top - p2.top - p1.top;

			$(document.body).mousemove(mousemoveL);
			$(document.body).mouseup(mouseupL);
		};
		$(canvasPanel.container).mousedown(mousedownL);
	},
	selectByRect : function(frame) {
		var views = [];
		Ext.each(this.ownerCt.views, function(view) {
			if (Raphael.isBBoxIntersect(frame, view.set.getBBox())) {
				views.push(view);
			}
		});
		this.select(views);
	},
	select : function(views) {
		this.ownerCt.fireLastCanvasClick();

		if (this.multiselOutline) {
			this.multiselOutline.remove();
			delete this.multiselOutline;
		}

		var xs = [];
		var ys = [];
		var x2s = [];
		var y2s = [];

		var selflag = false;
		views.filter(function(view) {
			if (!view.selected) {
				selflag = true;
				view.selected = true;
				view.fireEvent('selected', views);
			}
			xs.push(view.frame.x);
			ys.push(view.frame.y);
			x2s.push(view.frame.x + view.frame.width);
			y2s.push(view.frame.y + view.frame.height);
		});

		selflag ? this.fireEvent('selectionchange') : null;

		//if (views.length <= 1) return;
		//
		//var frame = {
		//	x : Math.min.apply(Math, xs),
		//	y : Math.min.apply(Math, ys),
		//	x2 : Math.max.apply(Math, x2s),
		//	y2 : Math.max.apply(Math, y2s)
		//};
		//
		//this.multiselOutline = paper.rect(frame.x, frame.y, frame.x2 - frame.x, frame.y2 - frame.y).attr('stroke', '#D3B2B2').toBack();
	},
	clearSelection : function() {
		this.clearLinkerSels();

		var deselflag = false;
		this.ownerCt.views.filter(function(view) {
			//hide em
			if (view.selected) {
				deselflag = true;
				view.selected = false;
				view.fireEvent('deselected');
			}
		});
		if (deselflag) this.fireEvent('selectionchange');
	},
	getSelections : function() {
		var arr = [];
		this.ownerCt.views.filter(function(view) {
			if (view.selected) arr.push(view);
		});

		return arr.concat(this.linkerSels);
	}
});