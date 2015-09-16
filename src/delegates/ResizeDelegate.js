Ext.define('GraphicDesigner.ResizeDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdresizedelegate',
	resizers : ['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'],
	showOutline : true,
	outline : null,
	buildDelegate : function() {
		var paper = this.view.set.paper;

		this.set = paper.set();

		if (this.showOutline) {
			this.outline = paper.rect(0, 0, 0, 0).attr('stroke', '#CFACAC').data('type', 'outline');
			this.set.push(this.outline);
		}

		this.resizers.indexOf('tl') != -1 ?
			this.set.push(this.produceResizer('tl').attr('cursor', 'nwse-resize')) : null;
		this.resizers.indexOf('t')!= -1 ?
			this.set.push(this.produceResizer('t').attr('cursor', 'ns-resize')) : null;
		this.resizers.indexOf('tr')!= -1 ?
			this.set.push(this.produceResizer('tr').attr('cursor', 'nesw-resize')) : null;
		this.resizers.indexOf('r')!= -1 ?
			this.set.push(this.produceResizer('r').attr('cursor', 'ew-resize')) : null;
		this.resizers.indexOf('br')!= -1 ?
			this.set.push(this.produceResizer('br').attr('cursor', 'nwse-resize')) : null;
		this.resizers.indexOf('b')!= -1 ?
			this.set.push(this.produceResizer('b').attr('cursor', 'ns-resize')) : null;
		this.resizers.indexOf('bl')!= -1 ?
			this.set.push(this.produceResizer('bl').attr('cursor', 'nesw-resize')) : null;
		this.resizers.indexOf('l')!= -1 ?
			this.set.push(this.produceResizer('l').attr('cursor', 'ew-resize')) : null;

		this.set.hide();
		this.layoutElements();

	},
	getEventListeners : function() {
		var me = this;
		return {
			zindexed : function() {
				if (me.view.selected) {
					new Ext.util.DelayedTask(function() {
						me.set.toFront();
					}).delay(100);
				}
			},
			selected : function(views) {
				me.set.toFront().show();
			},
			deselected : function() {
				me.set.hide();
			},
			layout : function() { me.layoutElements();},
			dragstart : function() { me.set.show().toFront();}
		};
	},
	doDestroy : function() {
		this.set.remove();
	},
	layoutElements : function() {
		var box = this.view.frame;

		if (this.outline) {
			var box = this.view.frame;
			this.outline.attr({
				x : box.x,
				y : box.y,
				width : box.width,
				height : box.height
			});
		}

		this.set.forEach(function(ele) {
			if (ele.data('type') != 'resizer') return;

			switch (ele.data('spec')) {
				case 'tl':
					ele.attr({x: box.x - 3, y: box.y - 3});
					break;
				case 't':
					ele.attr({x: box.x - 3 + box.width / 2, y: box.y - 3});
					break;
				case 'tr':
					ele.attr({x: box.x - 3 + box.width, y: box.y - 3});
					break;
				case 'r':
					ele.attr({x: box.x - 3 + box.width, y: box.y - 3 + box.height / 2});
					break;
				case 'br':
					ele.attr({x: box.x - 3 + box.width, y: box.y - 3 + box.height});
					break;
				case 'b':
					ele.attr({x: box.x - 3 + box.width / 2, y: box.y - 3 + box.height});
					break;
				case 'bl':
					ele.attr({x: box.x - 3, y: box. y- 3 + box.height});
					break;
				case 'l':
					ele.attr({x: box.x - 3, y: box.y - 3 + box.height / 2});
					break;
			}
		});

	},
	//private
	produceResizer : function(spec) {
		var paper = this.view.set.paper;
		var me = this;

		var resizer = paper.rect(0, 0, 6, 6).attr({fill: 'white', stroke: '#883333'}).
			data('type', 'resizer').data('spec', spec).click(function(e) { e.stopPropagation();});

		var ct = this.view.ownerCt;
		resizer.mousedown(function(e) {
			e.stopPropagation();
		});
		resizer.drag(function(dx, dy) {
			var box = this.obox;
			var minX = ct.constraint ? ct.constraintPadding : -9999999;
			var minY = minX;
			var maxW = ct.constraint ? ct.paperWidth - box.x - ct.constraintPadding : 9999999;
			var maxH = ct.constraint ? ct.paperHeight - box.y - ct.constraintPadding : 9999999;
			//this.attr({
			//	x : this.ox + dx,
			//	y : this.oy + dy
			//});

			var rect = {};
			var minW = me.view.minW;
			var minH = me.view.minH;
			switch (this.data('spec')) {
				case 'tl'://yes
					var maxx = box.x + box.width - minW;
					var maxy = box.y + box.height - minH;

					var targetx = Math.max(Math.min(box.x + dx, maxx), minX);
					var targety = Math.max(Math.min(box.y + dy, maxy), minY);

					rect = {
						x : Math.max(targetx, minX),
						y : Math.max(targety, minY),
						width : box.width - targetx + box.x,
						height : box.height - targety + box.y
					};
					break;
				case 't'://yes
					//static x
					var maxy = box.y + box.height - minH;

					var targety = Math.max(minY, Math.min(box.y + dy, maxy));

					rect = {
						x : box.x,
						y : targety,
						width : box.width,
						height : box.height - targety + box.y
					}
					break;
				case 'tr'://yes
					var maxy = box.y + box.height - minH;

					var targety = Math.max(Math.min(box.y + dy, maxy), minY);
					var targetw = Math.min(Math.max(box.width + dx, minW), maxW);

					rect = {
						x : box.x,
						y : targety,
						width : targetw,
						height : box.height - targety + box.y
					}

					break;
				case 'r'://yes
					var targetw = Math.min(Math.max(box.width + dx, minW), maxW);

					rect = {
						x : box.x,
						y : box.y,
						width : targetw,
						height : box.height
					}

					break;
				case 'br':
					var targetw = Math.min(Math.max(box.width + dx, minW), maxW);
					var targeth = Math.min(Math.max(box.height + dy, minH), maxH);

					rect = {
						x : box.x,
						y : box.y,
						width : targetw,
						height : targeth
					}

					break;
				case 'b':
					var targeth = Math.min(Math.max(box.height + dy, minH), maxH);

					rect = {
						x : box.x,
						y : box.y,
						width : box.width,
						height : targeth
					}

					break;
				case 'bl':
					var maxx = box.x + box.width - minW;

					var targetx = Math.max(Math.min(box.x + dx, maxx), minX);
					var targeth = Math.min(Math.max(box.height + dy, minH), maxH);

					rect = {
						x : targetx,
						y : box.y,
						width : box.width - targetx + box.x,
						height : targeth
					}

					break;
				case 'l'://yes
					var maxx = box.x + box.width - minW;

					var targetx = Math.max(Math.min(box.x + dx, maxx), minX);

					rect = {
						x : targetx,
						y : box.y,
						width : box.width - targetx + box.x,
						height : box.height
					}
					break;
			}

			me.view.layoutInRect(rect);
			me.view.fireEvent('resize', rect, this.data('spec'), minX, minY, maxW, maxH);
		}, function() {
			this.obox = me.view.frame;
			me.view.fireEvent('resizestart');
		}, function(e) {
			delete this.obox;
			me.view.fireEvent('resizeend');

			GraphicDesigner.suspendClick();
		});

		return resizer;
	}
});