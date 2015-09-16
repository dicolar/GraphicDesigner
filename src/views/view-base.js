Ext.define('GraphicDesigner.Circle', {
	extend : 'GraphicDesigner.View',
	xtype : 'gdcircle',
	getDefaultFrame : function() {
		return {
			x : 50,
			y : 50,
			width : 80,
			height : 80
		};
	},
	getPreview : function(frame) {
		var center = GraphicDesigner.getCenter(frame);
		return [{
			type : 'circle',
			fill : 'white',
			cx : center.x - 2,
			cy : center.y - 2,
			r : Math.min(frame.width, frame.height) / 2
		}];
	},
	redraw : function() {
		var rect = this.frame;
		this.set[0].attr({
			cx : rect.x + rect.width / 2,
			cy : rect.y + rect.height / 2,
			rx : rect.width / 2,
			ry : rect.height / 2
		});

	},
	buildUI : function(paper) {
		this.shapes = [{
			type : 'ellipse',
			'stroke-width' : 2
		}];

		this.callParent(arguments);
	},
	afterViewBuilt : function() {
		this.labelDelegate = Ext.applyIf(Ext.clone(this.labelDelegate), {
			xtype : 'gdlabeldelegate',
			text : this.text,
			getTextRect : function() {
				return this.view.frame;
			}
		});
		this.resizeDelegate = Ext.applyIf(Ext.clone(this.resizeDelegate), {
			xtype : 'gdresizedelegate',
			showOutline : true,
			resizers : ['tl', 'tr', 'bl', 'br']
		});
	}
});

Ext.define('GraphicDesigner.Rect', {
	extend : 'GraphicDesigner.View',
	xtype : 'gdrect',
	getDefaultFrame : function() {
		return {
			x : 50,
			y : 50,
			width : 100,
			height : 100
		};
	},
	getPreview : function(frame) {
		return [{
			type : 'rect',
			fill : 'white',
			x : frame.x,
			y : frame.y,
			width : frame.width - 4,
			height : frame.height - 4
		}];

	},
	redraw : function() {
		this.set[0].attr(this.frame);
	},
	buildUI : function(paper) {
		this.shapes = [{
			type : 'rect',
			'stroke-width' : 2
		}];

		this.callParent(arguments);
	},
	afterViewBuilt : function() {
		this.labelDelegate = Ext.applyIf(Ext.clone(this.labelDelegate), {
			xtype : 'gdlabeldelegate',
			text : this.text,
			getTextRect : function() {
				return this.view.frame;
			}
		});
		this.resizeDelegate = Ext.applyIf(Ext.clone(this.resizeDelegate), {
			xtype : 'gdresizedelegate',
			resizers : ['tl', 'tr', 'bl', 'br'],
			showOutline : false
		});

	}
});

Ext.define('GraphicDesigner.Pool', {
	extend : 'GraphicDesigner.View',
	xtype : 'gdpool',
	minH : 90,
	getPreview : function(frame) {
		var w = Math.min(frame.height, frame.width);
		var h = frame.height - 4;

		if (w >= h) {
			w = h * .6;
		}
		var fromx = frame.x + (frame.width - w) / 2;
		var lh = h / 4;

		return [{
			type : 'rect',
			x : fromx,
			y : frame.y,
			width : w,
			height : h
		}, {
			type : 'path',
			path : 'M' + fromx + ',' + (frame.y + lh) + 'H' + (fromx + w)
		}];
	},
	getDefaultFrame : function() {
		return {
			x : 50,
			y : 50,
			width : 200,
			height : 400
		};
	},
	redraw : function() {
		var rect = this.frame;
		this.set[0].attr({
			x : rect.x,
			y : rect.y,
			width : rect.width,
			height : 40
		});
		this.set[1].attr(rect);
		this.set[2].attr({
			path : ['M', rect.x, rect.y + 40, 'L', rect.x + rect.width, rect.y + 40].join(',')
		});

	},
	updateStyle : function() {
		this.set.attr({
			opacity : this.style.opacity
		});
		this.set[0].attr({
			fill : this.style.fill,
			'fill-opacity' : this.style.fillOpacity
		});

		this.set[1].attr({
			'stroke-width' : this.style.lineWidth,
			stroke : this.style.lineColor,
			'stroke-dasharray' : this.style.lineStyle
		});
		this.set[2].attr({
			'stroke-width' : this.style.lineWidth,
			stroke : this.style.lineColor,
			'stroke-dasharray' : this.style.lineStyle
		});

	},
	buildUI : function(paper) {
		this.shapes = [{
			type : 'rect',
			'stroke-width' : 0
		}, {
			type : 'rect',
			'stroke-width' : 2
		}, {
			type : 'path',
			'stroke-width' : 2
		}];

		this.callParent(arguments);
	},
	afterViewBuilt : function() {

		this.labelDelegate = Ext.applyIf(Ext.clone(this.labelDelegate), {
			xtype : 'gdlabeldelegate',
			text : this.text,
			getTextRect : function() {
				var rect = this.view.frame;
				return {
					x : rect.x,
					y : rect.y,
					width : rect.width,
					height : 40
				};
			}
		});
		this.linkDelegate = null;
		this.rotateDelegate = null;
		this.resizeDelegate = Ext.applyIf(Ext.clone(this.resizeDelegate), {
			xtype : 'gdresizedelegate',
			showOutline : false
		});
		var me = this;
		this.dockDelegate = Ext.applyIf(Ext.clone(this.dockDelegate), {
			xtype : 'gddockdelegate',
			getOtherDockers : function() {
				return [{
					spec : 'y',
					dir : 't',
					getValue : function() {
						return me.frame.y + 40;
					},
					docked : function(toDocker, frame) {
						frame.y = toDocker.getValue() - 40;
					},
					dock : function(docker, frame) {
						if (docker.dir == 't') {
							frame.y = me.frame.y + 40;
						} else if (docker.dir == 'b') {
							frame.y = me.frame.y - frame.height + 40;
						}
					}
				}];
			}
		});
	}
});

Ext.define('GraphicDesigner.HPool', {
	extend : 'GraphicDesigner.Pool',
	xtype : 'gdhpool',
	minW : 90,
	getPreview : function(frame) {
		var w = Math.min(frame.height, frame.width) - 4;
		var h = frame.height;

		if (h >= w) {
			h = w * .6;
		}
		var lw = w / 4;
		var fromx = frame.x + (frame.width - w) / 2;
		var fromy = frame.y + (frame.height - h) / 2;

		return [{
			type : 'rect',
			x : fromx,
			y : fromy,
			width : w,
			height : h
		}, {
			type : 'path',
			path : 'M' + (fromx + lw) + ',' + fromy + 'V' + (fromy + h)
		}];
	},
	getDefaultFrame : function() {
		return {
			x : 50,
			y : 50,
			width : 400,
			height : 200
		};
	},
	redraw : function() {
		var rect = this.frame;
		this.set[0].attr({
			x : rect.x,
			y : rect.y,
			width : 40,
			height : rect.height
		});
		this.set[1].attr(rect);
		this.set[2].attr({
			path : ['M', rect.x + 40, rect.y, 'L', rect.x + 40, rect.y + rect.height].join(',')
		});

	},
	buildUI : function(paper) {
		this.shapes = [{
			type : 'rect',
			'stroke-width' : 0
		}, {
			type : 'rect',
			'stroke-width' : 2
		}, {
			type : 'path',
			'stroke-width' : 2
		}];

		this.callParent(arguments);
	},
	afterViewBuilt : function() {

		this.labelDelegate = Ext.applyIf(Ext.clone(this.labelDelegate), {
			xtype : 'gdlabeldelegate',
			text : this.text,
			getTransform : function() {
				var frame = this.view.frame;
				return {
					angle : -90,
					cx : frame.x + frame.width / 2,
					cy : frame.y + frame.height / 2
				}
			},
			getTextRect : function() {
				var rect = this.view.frame;
				var center = GraphicDesigner.getCenter(rect);
				return {
					x : center.x - rect.height / 2,
					y : center.y - rect.width / 2,
					width : rect.height,
					height : 40
				};
			}
		});
		this.rotateDelegate = null;
		this.linkDelegate = null;
		this.resizeDelegate = Ext.applyIf(Ext.clone(this.resizeDelegate), {
			xtype : 'gdresizedelegate',
			showOutline : false
		});
		var me = this;
		this.dockDelegate = Ext.applyIf(Ext.clone(this.dockDelegate), {
			xtype : 'gddockdelegate',
			getOtherDockers : function() {
				return [{
					spec : 'x',
					dir : 'l',
					getValue : function() {
						return me.frame.x + 40;
					},
					docked : function(toDocker, frame) {
						frame.x = toDocker.getValue() - 40;
					},
					dock : function(docker, frame) {
						if (docker.dir == 'l') {
							frame.x = me.frame.x + 40;
						} else if (docker.dir == 'r') {
							frame.x = me.frame.x - frame.width + 40;
						}
					}
				}];
			}
		});
	}
});

