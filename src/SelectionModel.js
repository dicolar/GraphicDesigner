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
					v.fireEvent('selected');
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
			canvasPanel.container.parent().parent().parent().off('scroll', scrollL);
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
				Ext.each(canvasPanel.views, function(view) {
					var selflag = false;
					if (Raphael.isBBoxIntersect(frame, view.set.getBBox())) {
						if (!view.selected) {
							view.selected = true;
							selflag = true;
							view.fireEvent('selected');//TODO fire multi selection event!
						}
					}
					if (selflag) me.fireEvent('selectionchange');
				});
			}).delay(1);

		};
		var scrollL = function(e) {
			//GraphicDesigner.suspendClick();
			//e.stopPropagation();
			//e.preventDefault();
			//mouseupL.apply(document.body, [e]);
		}
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

			canvasPanel.container.parent().parent().parent().scroll(scrollL);
			$(document.body).mousemove(mousemoveL);
			$(document.body).mouseup(mouseupL);
		};
		$(canvasPanel.container).mousedown(mousedownL);
	},
	select : function(views) {
		this.ownerCt.fireLastCanvasClick();

		var selflag = false;
		views.filter(function(v) {
			if (!v.selected) {
				selflag = true;
				v.selected = true;
				v.fireEvent('selected');
			}
		});
		if (selflag) this.fireEvent('selectionchange');
	},
	deselect : function(views) {
		this.ownerCt.fireLastCanvasClick();
		var deselflag = false;
		views.filter(function(v) {
			if (v.selected) {
				deselflag = true;
				v.selected = false;
				v.fireEvent('deselected');
			}
		});

		if (deselflag) this.fireEvent('selectionchange');
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