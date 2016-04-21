Ext.define('GraphicDesigner.BaseObject', {
	constructor : function(cfg) {
		Ext.apply(this, cfg);

		if (this.init) {
			this.init();
		}
	},
	init : function() {
	}
});
Ext.define('GraphicDesigner.CanvasPanel', {
	extend : 'Ext.panel.Panel',
	xtype : 'gdcanvaspanel',
	gridHidden : false,
	views : [],
	autoScroll : true,
	paperWidth : 800,
	paperHeight : 1280,
	constraint : false,
	constraintPadding : 5,
	bgColor : '#ffffff',
	selModel : {
		xtype : 'gdselmodel'
	},
	attributesInspectorPanel : {
		xtype : 'gdattributesinspectorpanel'
	},
	clipboard : {
		xtype : 'gdclipboard'
	},
	shortcutController : {
		xtype : 'gdshortcutcontroller'
	},
	//when restore view,and u need 2 inject some extra configs on it,implement this!
	//args:config	--just add more configs into it
	preProcessRestoreData : Ext.emptyFn,
	bodyCls : 'gd-canvas-bg',
	html : '<div scope="container" style="display:inline-block;"></div>',
	viewonly : false,
	setBgColor : function(color) {
		this.bgColor = color;
		this.bgLayer.css({
			'background-color' : color
		});
	},
	hideGrid : function() {
		this.gridHidden = true;
		this.gridLayer.hide();
	},
	showGrid : function() {
		this.gridHidden = false;
		this.gridLayer.show();
	},
	toggleGrid : function() {
		if (this.gridHidden) this.showGrid();
		else this.hideGrid();
	},
	getSize : function() {
		return [$(this.paper.canvas).width(), $(this.paper.canvas).height()];
	},
	getCanvas : function() {
		return this.paper.canvas;
	},
	getDataUrl : function(pure) {
		if (pure) this.selModel ? this.selModel.clearSelection() : null;

		var svgAsXML = (new XMLSerializer).serializeToString(this.getCanvas());
		return "data:image/svg+xml," + encodeURIComponent(svgAsXML);
	},
	getPngUrl : function() {
		var svg = $(this.getCanvas());
		var img = $('<img src="' + this.getDataUrl(true) + '" />');
		img.width(svg.width()).height(svg.height());
		$(document.body).append(img);
		img.on('load', function() { $(this).hide();});

		var cvs = $('<canvas></canvas>');
		cvs.attr('width', svg.width()).attr('height', svg.height());

		var ctx = cvs[0].getContext('2d');

		ctx.fillStyle = this.bgColor;
		ctx.fillRect(0, 0, svg.width(), svg.height());

		ctx.drawImage(img[0], 0, 0, svg.width(), svg.height());

		var url = cvs[0].toDataURL();
		img.remove();
		cvs.remove();
		return url;
	},
	downloadImage : function(fileName) {
		var dt = this.getPngUrl();
		dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');
		dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20');

		var link = $('<a href="#" download="' + fileName + '.png"></a>');
		link.attr('href', dt);
		link[0].click();
		link.remove();
	},
	fullscreen : function(element) {
		if(!element) {
			element = document.documentElement;
		}
		if(!document.fullscreenElement && // alternative standard method
			!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {// current working methods
			if(element.requestFullscreen) {
				element.requestFullscreen();
			} else if(document.documentElement.msRequestFullscreen) {
				element.msRequestFullscreen();
			} else if(document.documentElement.mozRequestFullScreen) {
				element.mozRequestFullScreen();
			} else if(document.documentElement.webkitRequestFullscreen) {
				element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if(document.exitFullscreen) {
				document.exitFullscreen();
			} else if(document.msExitFullscreen) {
				document.msExitFullscreen();
			} else if(document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if(document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
	},
	setPaperSize : function(width, height) {
		this.paperWidth = width;
		this.paperHeight = height;

		this.container.parent().parent().parent().stop();
		if (this.viewonly) {
			$(this.body.dom).addClass('gd-canvas-bg-readonly');
			$(this.layout.innerCt.dom).addClass('gd-canvas-readonly');

			this.container.width(width).height(height);
			this.canvasContainer.css({left : 0, top : 0}).width(width).height(height);

			this.bgLayer.css({left : 0, top : 0}).width(width).height(height);
			this.container.parent().parent().parent().animate({scrollTop:0,scrollLeft:0}, 300);
			this.readOnlyMask.show();
			this.selModel ? this.selModel.clearSelection() : null;
			this.hideGrid();
		} else {
			$(this.body.dom).removeClass('gd-canvas-bg-readonly');
			$(this.layout.innerCt.dom).removeClass('gd-canvas-readonly');

			this.container.width(width + 700).height(height + 700);
			this.canvasContainer.css({left : 300, top : 300}).width(width + 100).height(height + 100);

			this.bgLayer.css({left : 50, top : 50}).width(width).height(height);
			this.container.parent().parent().parent().animate({scrollTop:250,scrollLeft:140}, 300);
			this.readOnlyMask.hide();
			this.showGrid();
		}

	},
	//protected
	//params
	//docker: {spec : 'x'/'y', value : 120}
	drawDocker : function(docker, color) {
		if (!docker || !docker.spec || isNaN(docker.value)) return;

		if (!this.__dockLines) this.__dockLines = [];
		var line;
		if (docker.spec == 'x') {//vertical
			line = $('<div class="gd-docker-v"></div>').height(this.container.height()).css('top', 0);
			line.css('left', this.canvasContainer.position().left - this.container.position().left + this.bgLayer.position().left + docker.value);
		} else {//horizontal
			line = $('<div class="gd-docker-h"></div>').width(this.container.width()).css('left', 0);
			line.css('top', this.canvasContainer.position().top - this.container.position().top + this.bgLayer.position().top + docker.value);
		}
		if (color) {
			line.css('background-color', color);
		}

		this.container.append(line);
		this.__dockLines.push(line);
	},
	clearDockers : function() {
		Ext.each(this.__dockLines, function(l) { l.remove();});
		delete this.__dockLines;
	},
	asViewMode : function(viewonly) {
		if (this.attributesInspectorPanel) {
			this.attributesInspectorPanel[viewonly ? 'hide' : 'show']();
		}
		if (this.viewonly != viewonly) this.fireEvent('viewmodechange', viewonly);

		this.viewonly = viewonly;
		this.setPaperSize(this.paperWidth, this.paperHeight);

	},
	afterLayout : function(layout) {
		if (this.attributesInspectorPanel) {
			this.attributesInspectorPanel.show();
			this.attributesInspectorPanel.alignTo(this.body, 'tr-tr?');
			this.attributesInspectorPanel.layoutInspector();
			this.attributesInspectorPanel[this.viewonly ? 'hide' : 'show']();
		}

		this.callParent(arguments);
	},
	initComponent : function() {
		if (this.selModel) {
			this.selModel = Ext.widget(this.selModel);
		}

		this.callParent();
	},
	afterRender : function() {
		this.attributesInspectorPanel ? this.attributesInspectorPanel = Ext.widget(this.attributesInspectorPanel) : null;
		this.attributesInspectorPanel ? this.attributesInspectorPanel.owner = this : null;

		this.shortcutController ? this.shortcutController = Ext.widget(this.shortcutController) : null;
		this.shortcutController ? this.shortcutController.owner = this : null;
		this.shortcutController ? this.shortcutController.build() : null;

		this.clipboard ? this.clipboard = Ext.widget(this.clipboard) : null;
		this.clipboard ? this.clipboard.owner = this : null;
		this.clipboard ? this.clipboard.build() : null;

		window.cp = this;
		if (this.constraintPadding < 0) this.constraintPadding = 0;
		var me = this;
		this.callParent();

		this.container = $(this.el.dom).find('div[scope=container]');

		this.canvasContainer = $('<div class="gd-canvas-container"></div>');
		this.container.append(this.canvasContainer);
		this.bgLayer = $('<div class="gd-bg-layer"></div>').css('background-color', this.bgColor);
		this.canvasContainer.append(this.bgLayer);

		this.gridLayer = $('<svg class="gd-grid-layer" xmlns="http://www.w3.org/2000/svg">' +
			'<defs>' +
			'<pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">' +
			'<path d="M 8 0 L 0 0 0 8" fill="none" stroke="#9CDEF1" stroke-width="0.5"/>' +
			'</pattern>' +
			'<pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">' +
			'<rect width="80" height="80" fill="url(#smallGrid)"/>' +
			'<path d="M 80 0 L 0 0 0 80" fill="none" stroke="#9CDEF1" stroke-width="1"/>' +
			'</pattern>' +
			'</defs>' +
			'<rect width="100%" height="100%" fill="url(#grid)" />' +
			'</svg>');

		this.bgLayer.append(this.gridLayer);
		this.canvasLayer = $('<div style="width:100%;height:100%;"></div>');
		var paper = Raphael(this.canvasLayer[0], '100%', '100%');
		this.bgLayer.append(this.canvasLayer);

		this.readOnlyMask = $('<div class="gd-readonly-mask"></div>').css({
			top : '0px',
			left : '0px'
		});
		this.bgLayer.after(this.readOnlyMask);

		this.paper = paper;
		if (this.gridHidden) this.hideGrid();

		this.setPaperSize(this.paperWidth, this.paperHeight);

		//add key listeners
		this.fireLastCanvasClick = function() {
			lastDownTarget = me.layout.innerCt.dom;
		}
		var lastDownTarget;
		var mousedownLis = function(event) {
			if (!me.layout || !me.layout.innerCt || !me.layout.innerCt.dom) {
				//off listener
				$(this).off('mousedown', mousedownLis);
				return;
			};
			lastDownTarget = event.target;

			if (event.target == me.layout.innerCt.dom || $(event.target).parents('#' + me.layout.innerCt.dom.id).length != 0) {
				lastDownTarget = me.layout.innerCt.dom;
			} else {
				lastDownTarget = null;
			}
		}
		$(document).on('mousedown', mousedownLis);

		var keydownLis = function(event) {
			if (!me.layout || !me.layout.innerCt || !me.layout.innerCt.dom) {
				$(this).off('keydown', keydownLis);
				return;
			};
			if(lastDownTarget == me.layout.innerCt.dom) {
				event.stopPropagation();

				if ([8, 37, 38, 39, 40].indexOf(event.keyCode) != -1) {
					if (['INPUT', 'TEXTAREA'].indexOf(event.srcElement.tagName) == -1) {
						event.preventDefault();
					} else {
						return;
					}
				}

				if (!GraphicDesigner.viewEditing) me.fireEvent('keydown', event);

				//keyup only fires where the view is selected but not editing!
				if (me.selModel) {
					me.selModel.getSelections().filter(function(view) {
						if (view.editing || !view.fireEvent) return;
						view.fireEvent('keydown', event);
					});
				}

			}
		};
		$(document).on('keydown', keydownLis);

		var keyupLis = function(event) {
			if (!me.layout || !me.layout.innerCt || !me.layout.innerCt.dom) {
				$(this).off('keyup', keyupLis);
				return;
			};
			if(lastDownTarget == me.layout.innerCt.dom) {
				event.stopPropagation();

				if (event.keyCode == 8) {
					if (['INPUT', 'TEXTAREA'].indexOf(event.srcElement.tagName) == -1) {
						event.preventDefault();
						me.selModel ? me.selModel.removeLinkerSels() : null;
					} else {
						return;
					}
				}

				if (!GraphicDesigner.viewEditing) me.fireEvent('keyup', event);

				//keyup only fires where the view is selected but not editing!
				if (me.selModel) {
					me.selModel.getSelections().filter(function(view) {
						if (view.editing || !view.fireEvent) return;
						view.fireEvent('keyup', event);
					});
				}

			}
		};
		$(document).keyup(keyupLis);
		//end key listeners

		window.paper = paper;
		//test

		this.selModel ? this.selModel.build(this) : null;

		var views = [];
		Ext.each(this.views, function(view) {
			views.push(Ext.widget(view));
		});
		this.views = views;
		Ext.each(this.views, function(view) {
			me.addSubView(view);
		});

	},
	getSubViews : function() {
		return this.views.slice();
	},
	//each desc must have key of:typeName
	getCanvasDescription : function() {
		return {
			canvas : {
				paperWidth : this.paperWidth,
				paperHeight : this.paperHeight,
				bgColor : GraphicDesigner.translateHexColorFromRgb(this.bgLayer.css('background-color'))
			},
			views : this.views.map(function(view) {
				return view.getGraphicDescription();
			})
		};
	},
	restoreCanvasByDescription : function(desc) {
		if (!desc) return;
		this.removeAllViews();
		if (Ext.isObject(desc.canvas)) {
			if (this.rendered) {
				this.bgLayer.css('background-color', desc.canvas.bgColor);
				this.setPaperSize(desc.canvas.paperWidth, desc.canvas.paperHeight);
			} else {
				this.bgColor = desc.canvas.bgColor;
				this.paperWidth = desc.canvas.paperWidth;
				this.paperHeight = desc.canvas.paperHeight;
			}
		}
		if (Ext.isArray(desc.views)) {
			this.restoreViewsByDescriptions(desc.views);
		}

	},
	restoreViewsByDescriptions : function(views) {
		if (!Ext.isArray(views)) return;
		//order by zindex if has zIndex?
		views.sort(function(o1, o2) {
			if (isNaN(o1.zIndex == null) || isNaN(o2.zIndex)) return 1;
			return o1.zIndex - o2.zIndex;
		});
		var me = this;
		var restoredViews = [];
		views.filter(function(desc) {
			if (!desc.hasOwnProperty('typeName')) return;

			me.preProcessRestoreData(desc);
			var v = me.addSubView(Ext.create(desc.typeName, desc));
			v ? restoredViews.push(v) : null;
		});

		function allViewsByDescRendered() {
			restoredViews.filter(function(view) {
				view.afterRestoreByDescription(me);
			});
		}

		if (this.rendered) {
			allViewsByDescRendered();
		} else {
			this.on('afterRender', function() {
				allViewsByDescRendered();
			});
		}

		return restoredViews;
	},
	addSubView : function(view) {
		view = Ext.widget(view);
		if (!view) return null;

		if (view.zIndex == null) {
			//add zIndex 2 it!
			view.zIndex = this.views.length;
		}
		if (this.views.indexOf(view) == -1) this.views.push(view);
		if (this.rendered) {
			view.ownerCt = this;
			if (!view.viewId) view.viewId = Raphael.createUUID();
			if (view.buildUI) view.buildUI(this.paper);

			this.fireEvent('viewadd', view);
		}

		return view;
	},
	getView : function(viewId) {
		var res = this.views.filter(function(view) {return view.viewId == viewId;});

		if (res.length > 0) return res[0];
		return null;
	},
	getViewAt : function(idx) {
		return this.views[idx];
	},
	findViewsBy : function(fn) {
		return this.views.slice().filter(fn);
	},
	detectViewsByRect : function(rect, max, filter) {
		if (!rect.x2) rect.x2 = rect.x + rect.width;
		if (!rect.y2) rect.y2 = rect.y + rect.height;
		var arr = [];
		if (!max || isNaN(max)) {max = 9999999;}
		Ext.each(this.views, function(view) {
			if(arr.length >= max) return false;
			if (filter && !filter(view)) {
				return;
			}
			if (Raphael.isBBoxIntersect(rect, view.set.getBBox())) arr.push(view);
		});

		return arr;
	},
	removeView : function(view) {
		this.views = this.views.filter(function(v) {
			return v != view;
		}).filter(function(v) {v.destroy();});
	},
	removeAllViews : function() {
		this.views.filter(function(view) {view.destroy();});
		this.views = [];
	},
	//private
	orderViewsZIndex : function() {
		Ext.each(this.views, function(v, i) {
			v.zIndex = i;
			v.set.toFront();
			v.labelDelegate ? v.labelDelegate.textElement.toFront() : null;

			v.fireEvent('zindexed');
		});
	},
	destroy : function() {
		this.attributesInspectorPanel ? this.attributesInspectorPanel.destroy() : null;
		this.shortcutController ? this.shortcutController.destroy() : null;
		this.removeAllViews();
		this.selModel ? this.selModel.destroy() : null;

		this.callParent(arguments);
	}
});

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
Ext.define('GraphicDesigner.Toolbar', {
	extend : 'Ext.toolbar.Toolbar',
	xtype : 'gdtoolbar',
	cls : 'gd-toolbar',
	//{display:'xxx', fontFamily:'xxxx'}
	extraFontFamilies : [],
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

		var fontFamilies = [{
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
		}];
		Ext.each(this.extraFontFamilies, function(f) {
			fontFamilies.push({
				fontFamily : f.fontFamily,
				text : '<span style="font-family:' + f.fontFamily + ';">' + f.display + '</span>'
			});
		});

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
			items : fontFamilies
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
		if (cp) {
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
		var sels = this.selections.filter(function(sel) {
			return sel.getXType != null;
		});

		if (sels.length == 0) {
			//disable all!
			this.items.each(function(c) {
				c.setDisabled ? c.setDisabled(true) : null;
			});
		} else {
			this.items.each(function(c) {
				c.setDisabled ? c.setDisabled(false) : null;
				c.updateSels ? c.updateSels(sels) : null;
			});
		}
	}
});
Ext.define('GraphicDesigner.View', {
	extend : 'Ext.Component',
	xtype : 'gdabstractview',
	requires : ['GraphicDesigner.CanvasPanel'],
	resizable : true,
	draggable : true,
	shapes : [],
	//after instanced, readonly!
	minW : 20,
	minH : 20,
	frame : null,
	text : '',
	resizeDelegate : {xtype : 'gdresizedelegate'},
	dragDelegate : {xtype : 'gddragdelegate'},
	linkDelegate : {xtype : 'gdlinkdelegate'},
	rotateDelegate : {xtype : 'gdrotatedelegate'},
	labelDelegate : {xtype : 'gdlabeldelegate'},
	keyDelegate : {xtype : 'gdkeydelegate'},
	dockDelegate : {xtype : 'gddockdelegate'},
	frameTipDelegate : {xtype : 'gdframetipdelegate'},
	contextmenuDelegate : {xtype : 'gdcontextmenudelegate'},
	inspectorDelegate : {xtype : 'gdinspectordelegate'},
	//other named like xxxDelegate will also b treated as a delegate,if succeeded newed.
	getCustomDescription : Ext.emptyFn,
	restoreCustomDescription : Ext.emptyFn,
	//private
	updateStyle : function() {
		this.set.attr({
			fill : this.style.fill,
			'fill-opacity' : this.style.fillOpacity,
			opacity : this.style.opacity,
			'stroke-width' : this.style.lineWidth,
			stroke : this.style.lineColor,
			'stroke-dasharray' : this.style.lineStyle
		});
	},
	//end private
	getFrame : function() {
		if (this.frame) return this.frame;

		return this.getDefaultFrame();
	},
	getDefaultFrame : function() {
		return {
			x : 50,
			y : 50,
			width : 50,
			height : 50
		};
	},
	getPreview : function(frame) {
		return [{
			type : 'text',
			stroke : 'black',
			'stroke-width' : 1,
			y : frame.y + frame.height / 2,
			text : 'RAW VIEW'
		}];
	},
	//implement this,but never use it!
	//protected
	redraw : Ext.emptyFn,
	layoutInRect : function(rect) {
		//round all!
		rect.x = Math.round(rect.x);
		rect.y = Math.round(rect.y);
		rect.width = Math.round(rect.width);
		rect.height = Math.round(rect.height);

		var ct = this.ownerCt;
		if (ct.constraint) {
			if (rect.x < ct.constraintPadding) {
				rect.x = ct.constraintPadding;
			}
			if (rect.y < ct.constraintPadding) {
				rect.y = ct.constraintPadding;
			}
			if (rect.x > ct.paperWidth - ct.constraintPadding - rect.width) {
				rect.x = ct.paperWidth - ct.constraintPadding - rect.width;
			}
			if (rect.y > ct.paperHeight - ct.constraintPadding - rect.height) {
				rect.y = ct.paperHeight - ct.constraintPadding - rect.height;
			}
		}

		rect.width = Math.max(rect.width, this.minW);
		rect.height = Math.max(rect.height, this.minH);

		this.frame = rect;
		this.redraw();
		this.fireEvent('layout', rect);
	},
	buildUI : function(paper) {
		this.set = paper.add(this.shapes);

		this.style = Ext.apply({
			opacity : 1,
			fill : '#ffffff',
			fillOpacity : 1,
			lineColor : '#000000',
			lineWidth : 2,
			lineStyle : ''
		}, this.style);

		this.updateStyle();
		this.afterViewBuilt();

		this.afterRender();
	},
	pre : function() {
		var ct = this.ownerCt;
		return ct.views[ct.views.indexOf(this) - 1];
	},
	next : function() {
		var ct = this.ownerCt;
		return ct.views[ct.views.indexOf(this) + 1];
	},
	flipToFront : function() {
		var ct = this.ownerCt;
		var idx = ct.views.indexOf(this);
		if (idx == -1 || idx == ct.views.length - 1) return;

		ct.views.gdmove(idx, idx + 1);
		ct.orderViewsZIndex();
	},
	flipToBack : function() {
		var ct = this.ownerCt;
		var idx = ct.views.indexOf(this);
		if (idx == -1 || idx == 0) return;

		ct.views.gdmove(idx, idx - 1);
		ct.orderViewsZIndex();

		this.fireEvent('zindexed');
	},
	flipToTop : function() {
		var ct = this.ownerCt;
		var idx = ct.views.indexOf(this);
		if (idx == -1 || idx == ct.views.length - 1) return;

		ct.views.gdmove(idx, ct.views.length - 1);
		ct.orderViewsZIndex();

		this.fireEvent('zindexed');
	},
	flipToBottom : function() {
		var ct = this.ownerCt;
		var idx = ct.views.indexOf(this);
		if (idx == -1 || idx == 0) return;

		ct.views.gdmove(idx, 0);
		ct.orderViewsZIndex();

		this.fireEvent('zindexed');
	},
	//add custom delegates to this view in the function
	afterViewBuilt : Ext.emptyFn,
	//do not override this!
	getGraphicDescription : function() {
		return Ext.apply({
			typeName : Ext.getClassName(this),
			viewId : this.viewId,
			frame : Ext.clone(this.frame),
			minW : this.minW,
			minH : this.minH,
			text : this.labelDelegate ? this.labelDelegate.text : '',
			linkers : this.linkDelegate ? this.linkDelegate.getLinkersData() : null,
			zIndex : this.zIndex,
			style : this.style,
			labelStyle : this.labelDelegate ? this.labelDelegate.style : null
		}, this.getCustomDescription());
	},
	afterRender : function() {
		this._innerDlgts = [];
		var me = this;

		this.layoutInRect(this.getFrame());

		//translate click&dblclick event!
		var clicked = false;
		var dblclicked = false;
		this.on('dragstart', function(x, y, e) {
			e.stopPropagation();
			if (clicked) {
				clicked = false;
				dblclicked = true;
				me.fireEvent('dblclick');
			} else {
				clicked = true;//record 1 click,if no more click,it will dicard it!
				setTimeout(function() {
					if (!dblclicked) me.fireEvent('click');
					clicked = false;
					dblclicked = false;
				}, 400);
			}
		});

		this.set.drag(function(dx, dy, x, y, e) {
			me.frame = me.set.getBBox();
			me.fireEvent('dragmoving', dx, dy, x, y, e);
		}, function(x, y ,e) {
			if (e.button == 2) {
				me.ownerCt.fireEvent('viewclicked', me);
				me.fireEvent('contextmenu', x, y, e);
				return;
			}
			me.fireEvent('dragstart', x, y, e);
			me.ownerCt.fireEvent('viewclicked', me);
		}, function(e) {
			me.fireEvent('dragend', e);
		});
		this.set.click(function(e) {
			e.stopPropagation();
		});

		this.set.hover(function() {
			me.fireEvent('hover');
		}, function() {
			me.fireEvent('unhover');
		});
		//===========end translating===============

		if (this.dragDelegate) {
			if (!this.dragDelegate.xtype) this.dragDelegate.xtype = 'gddragdelegate';
			this.dragDelegate = Ext.widget(this.dragDelegate);
			this.dragDelegate.wireView(this);
		}
		if (!this.labelDelegate) {
			this.labelDelegate = {
				xtype : 'gdlabeldelegate',
				editable : false
			};
		}
		if (!this.labelDelegate.xtype) this.labelDelegate.xtype = 'gdlabeldelegate';
		this.labelDelegate = Ext.widget(this.labelDelegate);
		this.labelDelegate.wireView(this);

		if (this.rotateDelegate) {
			if (!this.rotateDelegate.xtype) this.rotateDelegate.xtype = 'gdrotatedelegate';
			this.rotateDelegate = Ext.widget(this.rotateDelegate);
			this.rotateDelegate.wireView(this);
		}
		if (this.resizeDelegate) {
			if (!this.resizeDelegate.xtype) this.resizeDelegate.xtype = 'gdresizedelegate';
			this.resizeDelegate = Ext.widget(this.resizeDelegate);
			this.resizeDelegate.wireView(this);
		}
		if (this.linkDelegate) {
			if (!this.linkDelegate.xtype) this.linkDelegate.xtype = 'gdlinkdelegate';
			this.linkDelegate = Ext.widget(this.linkDelegate);
			this.linkDelegate.wireView(this);
		}
		if (this.keyDelegate) {
			if (!this.keyDelegate.xtype) this.keyDelegate.xtype = 'gdkeydelegate';
			this.keyDelegate = Ext.widget(this.keyDelegate);
			this.keyDelegate.wireView(this);
		}
		if (this.dockDelegate) {
			if (!this.dockDelegate.xtype) this.dockDelegate.xtype = 'gddockdelegate';
			this.dockDelegate = Ext.widget(this.dockDelegate);
			this.dockDelegate.wireView(this);
		}
		if (this.frameTipDelegate) {
			if (!this.frameTipDelegate.xtype) this.frameTipDelegate.xtype = 'gdframetipdelegate';
			this.frameTipDelegate = Ext.widget(this.frameTipDelegate);
			this.frameTipDelegate.wireView(this);
		}
		if (this.contextmenuDelegate) {
			if (!this.contextmenuDelegate.xtype) this.contextmenuDelegate.xtype = 'gdcontextmenudelegate';
			this.contextmenuDelegate = Ext.widget(this.contextmenuDelegate);
			this.contextmenuDelegate.wireView(this);
		}
		if (this.inspectorDelegate) {
			if (!this.inspectorDelegate.xtype) this.inspectorDelegate.xtype = 'gdinspectordelegate';
			this.inspectorDelegate = Ext.widget(this.inspectorDelegate);
			this.inspectorDelegate.wireView(this);
		}

		//auto-detect xxxxDelegate
		for (var key in this) {
			if (!key.endsWith('Delegate')) continue;

			var v = this[key];
			if (v == null || v.rendered) continue;

			try {
				if (Ext.isObject(v) && !v.xtype) v.xtype = 'gdviewdelegate';
				var dlgt = Ext.widget(v);
				dlgt.wireView(this);
				this[key] = dlgt;
				this._innerDlgts.push(dlgt);
			} catch(e) {}
		}

		this.rendered = true;
		this.fireEvent('afterRender');
	},
	//private
	afterRestoreByDescription : function(canvasPanel) {
		//restore linkers
		var linkers = this.linkers;
		delete this.linkers;
		if (!Ext.isEmpty(linkers) && this.linkDelegate) {
			this.linkDelegate.restoreLinkers(linkers);
		}

		this.restoreCustomDescription();
	},
	//public
	setDisabled : function(disabled) {
		this.disabled = disabled;

		if (disabled) {
			this.labelDelegate ? this.labelDelegate.disableListeners() : null;
			this.rotateDelegate ? this.rotateDelegate.disableListeners() : null;
			this.dragDelegate ? this.dragDelegate.disableListeners() : null;
			this.resizeDelegate ? this.resizeDelegate.disableListeners() : null;
			this.linkDelegate ? this.linkDelegate.disableListeners() : null;
			this.keyDelegate ? this.keyDelegate.disableListeners() : null;
			this.dockDelegates ? this.dockDelegates.disableListeners() : null;
			this.frameTipDelegate ? this.dockDelegates.disableListeners() : null;
			this.contextmenuDelegate ? this.contextmenuDelegate.disableListeners() : null;
			this.inspectorDelegate ? this.inspectorDelegate.disableListeners() : null;
			this._innerDlgts.filter(function(d) {d.disableListeners();});
		} else {
			this.labelDelegate ? this.labelDelegate.enableListeners() : null;
			this.rotateDelegate ? this.rotateDelegate.enableListeners() : null;
			this.dragDelegate ? this.dragDelegate.enableListeners() : null;
			this.resizeDelegate ? this.resizeDelegate.enableListeners() : null;
			this.linkDelegate ? this.linkDelegate.enableListeners() : null;
			this.keyDelegate ? this.keyDelegate.enableListeners() : null;
			this.dockDelegates ? this.dockDelegates.enableListeners() : null;
			this.frameTipDelegate ? this.dockDelegates.enableListeners() : null;
			this.contextmenuDelegate ? this.contextmenuDelegate.enableListeners() : null;
			this.inspectorDelegate ? this.inspectorDelegate.enableListeners() : null;
			this._innerDlgts.filter(function(d) {d.enableListeners();});
		}
	},
	//private
	destroy : function() {
		if (this.selected) {
			this.fireEvent('deselected');
		}
		this.labelDelegate ? this.labelDelegate.destroy() : null;
		this.rotateDelegate ? this.rotateDelegate.destroy() : null;
		this.dragDelegate ? this.dragDelegate.destroy() : null;
		this.resizeDelegate ? this.resizeDelegate.destroy() : null;
		this.linkDelegate ? this.linkDelegate.destroy() : null;
		this.keyDelegate ? this.keyDelegate.destroy() : null;
		this.dockDelegates ? this.dockDelegates.destroy() : null;
		this.contextmenuDelegate ? this.contextmenuDelegate.destroy() : null;
		this.inspectorDelegate ? this.inspectorDelegate.destroy() : null;
		Ext.each(this._innerDlgts, function(d) {d.destroy();});

		this.set.remove();

		this.ownerCt ? this.ownerCt.removeView(this) : null;
		this.inspectorDelegate ? this.inspectorDelegate.bbEvent('destroy', []) : null;

		this.destroyed = true;
		if (this.selected) {
			this.ownerCt.selModel ? this.ownerCt.selModel.fireEvent('selectionchange') : null;
		}
	}
});
Ext.define('GraphicDesigner.ViewDelegate', {
	extend : 'GraphicDesigner.BaseObject',
	xtype : 'gdviewdelegate',
	//return object in format: {onDrag: function() ...}
	getEventListeners : Ext.emptyFn,
	preBuild : Ext.emptyFn,
	buildDelegate : Ext.emptyFn,
	doDestroy : Ext.emptyFn,
	wireView : function(view) {
		this.view = view;

		this.preBuild();
		this.buildDelegate();

		this._listeners = this.getEventListeners();
		this.enableListeners();
		this.rendered = true;
	},
	enableListeners : function() {
		this.disabled = false;
		if (!Ext.isObject(this._listeners)) return;
		for (var key in this._listeners) {
			this.view.on(key, this._listeners[key]);
		}
	},
	disableListeners : function() {
		this.disabled = true;
		if (!Ext.isObject(this._listeners)) return;
		for (var key in this._listeners) {
			this.view.un(key, this._listeners[key]);
		}
	},
	destroy : function() {
		this.disableListeners();
		this.destroyed = true;
		this.doDestroy();
	}
});
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


(function($) {
	var supportedCSS,supportedCSSOrigin, styles=document.getElementsByTagName("head")[0].style,toCheck="transformProperty WebkitTransform OTransform msTransform MozTransform".split(" ");
	for (var a = 0; a < toCheck.length; a++) if (styles[toCheck[a]] !== undefined) { supportedCSS = toCheck[a]; }
	if (supportedCSS) {
		supportedCSSOrigin = supportedCSS.replace(/[tT]ransform/,"TransformOrigin");
		if (supportedCSSOrigin[0] == "T") supportedCSSOrigin[0] = "t";
	}

	// Bad eval to preven google closure to remove it from code o_O
	eval('IE = "v"=="\v"');

	jQuery.fn.extend({
		rotate:function(parameters)
		{
			if (this.length===0||typeof parameters=="undefined") return;
			if (typeof parameters=="number") parameters={angle:parameters};
			var returned=[];
			for (var i=0,i0=this.length;i<i0;i++)
			{
				var element=this.get(i);
				if (!element.Wilq32 || !element.Wilq32.PhotoEffect) {

					var paramClone = $.extend(true, {}, parameters);
					var newRotObject = new Wilq32.PhotoEffect(element,paramClone)._rootObj;

					returned.push($(newRotObject));
				}
				else {
					element.Wilq32.PhotoEffect._handleRotation(parameters);
				}
			}
			return returned;
		},
		getRotateAngle: function(){
			var ret = [];
			for (var i=0,i0=this.length;i<i0;i++)
			{
				var element=this.get(i);
				if (element.Wilq32 && element.Wilq32.PhotoEffect) {
					ret[i] = element.Wilq32.PhotoEffect._angle;
				}
			}
			return ret;
		},
		stopRotate: function(){
			for (var i=0,i0=this.length;i<i0;i++)
			{
				var element=this.get(i);
				if (element.Wilq32 && element.Wilq32.PhotoEffect) {
					clearTimeout(element.Wilq32.PhotoEffect._timer);
				}
			}
		}
	});

	// Library agnostic interface

	Wilq32=window.Wilq32||{};
	Wilq32.PhotoEffect=(function(){

		if (supportedCSS) {
			return function(img,parameters){
				img.Wilq32 = {
					PhotoEffect: this
				};

				this._img = this._rootObj = this._eventObj = img;
				this._handleRotation(parameters);
			}
		} else {
			return function(img,parameters) {
				this._img = img;
				this._onLoadDelegate = [parameters];

				this._rootObj=document.createElement('span');
				this._rootObj.style.display="inline-block";
				this._rootObj.Wilq32 =
				{
					PhotoEffect: this
				};
				img.parentNode.insertBefore(this._rootObj,img);

				if (img.complete) {
					this._Loader();
				} else {
					var self=this;
					// TODO: Remove jQuery dependency
					jQuery(this._img).bind("load", function(){ self._Loader(); });
				}
			}
		}
	})();

	Wilq32.PhotoEffect.prototype = {
		_setupParameters : function (parameters){
			this._parameters = this._parameters || {};
			if (typeof this._angle !== "number") { this._angle = 0 ; }
			if (typeof parameters.angle==="number") { this._angle = parameters.angle; }
			this._parameters.animateTo = (typeof parameters.animateTo === "number") ? (parameters.animateTo) : (this._angle);

			this._parameters.step = parameters.step || this._parameters.step || null;
			this._parameters.easing = parameters.easing || this._parameters.easing || this._defaultEasing;
			this._parameters.duration = parameters.duration || this._parameters.duration || 1000;
			this._parameters.callback = parameters.callback || this._parameters.callback || this._emptyFunction;
			this._parameters.center = parameters.center || this._parameters.center || ["50%","50%"];
			if (typeof this._parameters.center[0] == "string") {
				this._rotationCenterX = (parseInt(this._parameters.center[0],10) / 100) * this._imgWidth * this._aspectW;
			} else {
				this._rotationCenterX = this._parameters.center[0];
			}
			if (typeof this._parameters.center[1] == "string") {
				this._rotationCenterY = (parseInt(this._parameters.center[1],10) / 100) * this._imgHeight * this._aspectH;
			} else {
				this._rotationCenterY = this._parameters.center[1];
			}

			if (parameters.bind && parameters.bind != this._parameters.bind) { this._BindEvents(parameters.bind); }
		},
		_emptyFunction: function(){},
		_defaultEasing: function (x, t, b, c, d) { return -c * ((t=t/d-1)*t*t*t - 1) + b },
		_handleRotation : function(parameters, dontcheck){
			if (!supportedCSS && !this._img.complete && !dontcheck) {
				this._onLoadDelegate.push(parameters);
				return;
			}
			this._setupParameters(parameters);
			if (this._angle==this._parameters.animateTo) {
				this._rotate(this._angle);
			}
			else {
				this._animateStart();
			}
		},

		_BindEvents:function(events){
			if (events && this._eventObj)
			{
				// Unbinding previous Events
				if (this._parameters.bind){
					var oldEvents = this._parameters.bind;
					for (var a in oldEvents) if (oldEvents.hasOwnProperty(a))
					// TODO: Remove jQuery dependency
						jQuery(this._eventObj).unbind(a,oldEvents[a]);
				}

				this._parameters.bind = events;
				for (var a in events) if (events.hasOwnProperty(a))
				// TODO: Remove jQuery dependency
					jQuery(this._eventObj).bind(a,events[a]);
			}
		},

		_Loader:(function()
		{
			if (IE)
				return function() {
					var width=this._img.width;
					var height=this._img.height;
					this._imgWidth = width;
					this._imgHeight = height;
					this._img.parentNode.removeChild(this._img);

					this._vimage = this.createVMLNode('image');
					this._vimage.src=this._img.src;
					this._vimage.style.height=height+"px";
					this._vimage.style.width=width+"px";
					this._vimage.style.position="absolute"; // FIXES IE PROBLEM - its only rendered if its on absolute position!
					this._vimage.style.top = "0px";
					this._vimage.style.left = "0px";
					this._aspectW = this._aspectH = 1;

					/* Group minifying a small 1px precision problem when rotating object */
					this._container = this.createVMLNode('group');
					this._container.style.width=width;
					this._container.style.height=height;
					this._container.style.position="absolute";
					this._container.style.top="0px";
					this._container.style.left="0px";
					this._container.setAttribute('coordsize',width-1+','+(height-1)); // This -1, -1 trying to fix ugly problem with small displacement on IE
					this._container.appendChild(this._vimage);

					this._rootObj.appendChild(this._container);
					this._rootObj.style.position="relative"; // FIXES IE PROBLEM
					this._rootObj.style.width=width+"px";
					this._rootObj.style.height=height+"px";
					this._rootObj.setAttribute('id',this._img.getAttribute('id'));
					this._rootObj.className=this._img.className;
					this._eventObj = this._rootObj;
					var parameters;
					while (parameters = this._onLoadDelegate.shift()) {
						this._handleRotation(parameters, true);
					}
				}
			else return function () {
				this._rootObj.setAttribute('id',this._img.getAttribute('id'));
				this._rootObj.className=this._img.className;

				this._imgWidth=this._img.naturalWidth;
				this._imgHeight=this._img.naturalHeight;
				var _widthMax=Math.sqrt((this._imgHeight)*(this._imgHeight) + (this._imgWidth) * (this._imgWidth));
				this._width = _widthMax * 3;
				this._height = _widthMax * 3;

				this._aspectW = this._img.offsetWidth/this._img.naturalWidth;
				this._aspectH = this._img.offsetHeight/this._img.naturalHeight;

				this._img.parentNode.removeChild(this._img);


				this._canvas=document.createElement('canvas');
				this._canvas.setAttribute('width',this._width);
				this._canvas.style.position="relative";
				this._canvas.style.left = -this._img.height * this._aspectW + "px";
				this._canvas.style.top = -this._img.width * this._aspectH + "px";
				this._canvas.Wilq32 = this._rootObj.Wilq32;

				this._rootObj.appendChild(this._canvas);
				this._rootObj.style.width=this._img.width*this._aspectW+"px";
				this._rootObj.style.height=this._img.height*this._aspectH+"px";
				this._eventObj = this._canvas;

				this._cnv=this._canvas.getContext('2d');
				var parameters;
				while (parameters = this._onLoadDelegate.shift()) {
					this._handleRotation(parameters, true);
				}
			}
		})(),

		_animateStart:function()
		{
			if (this._timer) {
				clearTimeout(this._timer);
			}
			this._animateStartTime = +new Date;
			this._animateStartAngle = this._angle;
			this._animate();
		},
		_animate:function()
		{
			var actualTime = +new Date;
			var checkEnd = actualTime - this._animateStartTime > this._parameters.duration;

			// TODO: Bug for animatedGif for static rotation ? (to test)
			if (checkEnd && !this._parameters.animatedGif)
			{
				clearTimeout(this._timer);
			}
			else
			{
				if (this._canvas||this._vimage||this._img) {
					var angle = this._parameters.easing(0, actualTime - this._animateStartTime, this._animateStartAngle, this._parameters.animateTo - this._animateStartAngle, this._parameters.duration);
					this._rotate((~~(angle*10))/10);
				}
				if (this._parameters.step) {
					this._parameters.step(this._angle);
				}
				var self = this;
				this._timer = setTimeout(function()
				{
					self._animate.call(self);
				}, 10);
			}

			// To fix Bug that prevents using recursive function in callback I moved this function to back
			if (this._parameters.callback && checkEnd){
				this._angle = this._parameters.animateTo;
				this._rotate(this._angle);
				this._parameters.callback.call(this._rootObj);
			}
		},

		_rotate : (function()
		{
			var rad = Math.PI/180;
			if (IE)
				return function(angle)
				{
					this._angle = angle;
					this._container.style.rotation=(angle%360)+"deg";
					this._vimage.style.top = -(this._rotationCenterY - this._imgHeight/2) + "px";
					this._vimage.style.left = -(this._rotationCenterX - this._imgWidth/2) + "px";
					this._container.style.top = this._rotationCenterY - this._imgHeight/2 + "px";
					this._container.style.left = this._rotationCenterX - this._imgWidth/2 + "px";

				}
			else if (supportedCSS)
				return function(angle){
					this._angle = angle;
					this._img.style[supportedCSS]="rotate("+(angle%360)+"deg)";
					this._img.style[supportedCSSOrigin]=this._parameters.center.join(" ");
				}
			else
				return function(angle)
				{
					this._angle = angle;
					angle=(angle%360)* rad;
					// clear canvas
					this._canvas.width = this._width;//+this._widthAdd;
					this._canvas.height = this._height;//+this._heightAdd;

					// REMEMBER: all drawings are read from backwards.. so first function is translate, then rotate, then translate, translate..
					this._cnv.translate(this._imgWidth*this._aspectW,this._imgHeight*this._aspectH);	// at least center image on screen
					this._cnv.translate(this._rotationCenterX,this._rotationCenterY);			// we move image back to its orginal
					this._cnv.rotate(angle);										// rotate image
					this._cnv.translate(-this._rotationCenterX,-this._rotationCenterY);		// move image to its center, so we can rotate around its center
					this._cnv.scale(this._aspectW,this._aspectH); // SCALE - if needed ;)
					this._cnv.drawImage(this._img, 0, 0);							// First - we draw image
				}

		})()
	}

	if (IE)
	{
		Wilq32.PhotoEffect.prototype.createVMLNode=(function(){
			document.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
			try {
				!document.namespaces.rvml && document.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
				return function (tagName) {
					return document.createElement('<rvml:' + tagName + ' class="rvml">');
				};
			} catch (e) {
				return function (tagName) {
					return document.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
				};
			}
		})();
	}

})(jQuery);

//===============custom layout============================
Ext.override(Ext.layout.container.Auto, {
	calculateOverflow: function (ownerContext) {
		var me = this,
			width, height, scrollbarSize, scrollbars, xauto, yauto, targetEl;

		xauto = (me.getOverflowXStyle(ownerContext) === 'auto');
		yauto = (me.getOverflowYStyle(ownerContext) === 'auto');

		if (xauto || yauto) {
			scrollbarSize = Ext.getScrollbarSize();
			if (this.owner.bodyCls == 'gd-view-template-list' || this.owner.bodyCls == 'gd-scrollbar') {
				scrollbarSize.width = 9;
				scrollbarSize.height = 9;
			}
			targetEl = ownerContext.overflowContext.el.dom;
			scrollbars = 0;

			if (targetEl.scrollWidth > targetEl.clientWidth) {
				scrollbars |= 1;
			}

			if (targetEl.scrollHeight > targetEl.clientHeight) {
				scrollbars |= 2;
			}

			width = (yauto && (scrollbars & 2)) ? scrollbarSize.width : 0;
			height = (xauto && (scrollbars & 1)) ? scrollbarSize.height : 0;

			if (width !== me.lastOverflowAdjust.width || height !== me.lastOverflowAdjust.height) {
				me.done = false;

				ownerContext.invalidate({
					state: {
						overflowAdjust: {
							width: width,
							height: height
						},
						overflowState: scrollbars,
						secondPass: true
					}
				});
			}
		}
	}
});

Array.prototype.gdmove = function(from, to) {
	this.splice(to, 0, this.splice(from, 1)[0]);
};
Array.prototype.last = function() {
	return this[this.length - 1];
};
if (!Array.prototype.filter) {
	Array.prototype.filter = function(fun) {
		"use strict";

		if (this === void 0 || this === null)
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun !== "function")
			throw new TypeError();

		var res = [];
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in t) {
				var val = t[i];
				if (fun.call(thisp, val, i, t))
					res.push(val);
			}
		}

		return res;
	};
}
if (!Array.prototype.map) {
	Array.prototype.map = function(callback, thisArg) {
		var T, A, k;

		if (this == null) {
			throw new TypeError(" this is null or not defined");
		}

		var O = Object(this);

		var len = O.length >>> 0;

		if (typeof callback !== "function") {
			throw new TypeError(callback + " is not a function");
		}

		if (thisArg) {
			T = thisArg;
		}

		A = new Array(len);

		k = 0;

		while(k < len) {
			var kValue, mappedValue;

			if (k in O) {

				kValue = O[ k ];
				mappedValue = callback.call(T, kValue, k, O);
				A[ k ] = mappedValue;
			}
			k++;
		}

		return A;
	};
}

//===========================GraphicDesigner definition=============================
var GraphicDesigner = GraphicDesigner || {};

GraphicDesigner.suspendClick = function() {
	GraphicDesigner.suspendClickEvent = true;
	setTimeout(function() {
		delete GraphicDesigner.suspendClickEvent;
	}, 30);
}

GraphicDesigner.isBBoxInBBox = function(b, pb, excludeBound) {
	b.x2 = b.x + b.width;
	b.y2 = b.y + b.height;
	pb.x2 = pb.x + pb.width;
	pb.y2 = pb.y + pb.height;
	if (excludeBound) {
		return b.x > pb.x && b.x2 < pb.x2 && b.y > pb.y && b.y2 < pb.y2;
	}

	return b.x >= pb.x && b.x2 <= pb.x2 && b.y >= pb.y && b.y2 <= pb.y2;
}

GraphicDesigner.isPointInBox = function(x, y, b, excludeBound) {
	b.x2 = b.x + b.width;
	b.y2 = b.y + b.height;
	if (excludeBound) {
		return x < b.x2 && x > b.x && y < b.y2 && y > b.y;
	}

	return x <= b.x2 && x >= b.x && y <= b.y2 && y >= b.y;
}

GraphicDesigner.isBBoxIntersect = function(b1, b2, excludeBound) {
	b1.x2 = b1.x + b1.width;
	b1.y2 = b1.y + b1.height;
	b2.x2 = b2.x + b2.width;
	b2.y2 = b2.y + b2.height;

	if (!excludeBound) return Raphael.isBBoxIntersect(b1, b2);

	//exclude bound!
	if (b1.x == b2.x && b1.x2 == b2.x2) {
		//check y?
		if (b1.y2 <= b2.y || b1.y >= b2.y2) {
			return false;
		}
		return true;
	}
	if (b1.y == b2.y && b1.y2 == b2.y2) {
		//check x?
		if (b1.x2 <= b2.x || b1.x >= b2.x2) {
			return false;
		}
		return true;
	}

	var i = GraphicDesigner.isPointInBox;
	return i(b1.x, b1.y, b2, excludeBound)
		|| i(b1.x2, b1.y, b2, excludeBound)
		|| i(b1.x, b1.y2, b2, excludeBound)
		|| i(b1.x2, b1.y2, b2, excludeBound)
		|| i(b2.x, b2.y, b1, excludeBound)
		|| i(b2.x2, b2.y, b1, excludeBound)
		|| i(b2.x, b2.y2, b1, excludeBound)
		|| i(b2.x2, b2.y2, b1, excludeBound);
}

GraphicDesigner.transformShapeIntoFrame = function(ele, frame, autoExpand) {
	ele.transform('');
	var box = ele.getBBox();
	var w = box.width;
	var h = box.height;

	if (autoExpand) {
		return ele.transform('T' + (frame.x - box.x) + ',' + (frame.y - box.y) + 'S' + frame.width / w + ',' + frame.height / h + ',' + frame.x + ',' + frame.y);
	}

	var scale = Math.min(frame.width / w, frame.height / h);
	return ele.transform('T' + (frame.x - box.x) + ',' + (frame.y - box.y) + 'S' + scale + ',' + scale + ',' + frame.x + ',' + frame.y);
}

GraphicDesigner.getCenter = function(frame) {
	return {
		x : frame.x + frame.width / 2,
		y : frame.y + frame.height / 2
	};
}

GraphicDesigner.translateHexColorFromRgb = function(rgb) {
	var hexDigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f");
	function hex(x) {
		return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
	}
	rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

Ext.define('GraphicDesigner.AttributesInspectorPanel', {
	extend : 'Ext.toolbar.Toolbar',
	xtype : 'gdattributesinspectorpanel',
	cls : 'gd-attr-inspector',
	shadow : false,
	defaults : {
		width : 30,
		height : 30
	},
	infoPanelVisible : true,
	inspectors : [{
		//	xtype : 'gdinspector'
		//}, {
		xtype : 'gdcanvasinfoinspector'
	}, {
		xtype : 'gdframeinfoinspector'
	}],
	updateByView : function(view, eventName, args) {
		if (!this.__VIEW_INSPECTORS) this.__VIEW_INSPECTORS = this.query('*[observeTarget=view]');

		this.__VIEW_INSPECTORS.filter(function(insp) {
			insp.update ? insp.update(view, eventName, args) : null;
		});

	},
	updateByCanvas : function() {},
	onShow : function() {
		this.query('button[pressed=true]').filter(function(b) {
			b.infoPanel ? b.fireEvent('toggle', b, true) : null;
		});

		this.callParent(arguments);
	},
	onHide : function() {
		this.query('button[pressed=true]').filter(function(b) {
			b.infoPanel ? b.infoPanel.hide() : null;
		});

		this.callParent(arguments);
	},
	initComponent : function() {
		this.vertical = true;
		this.floating = true;
		this.fixed = true;

		var toggleGroup = Ext.id() + '-inspector-toggle-group';
		Ext.each(this.inspectors, function(c) {c.toggleGroup = toggleGroup;c.allowDepress = true;});
		this.items =  this.inspectors;

		this.callParent();
	},
	layoutInspector : function() {
		this.query('button[pressed=true]').filter(function(b) {
			b.infoPanel ? b.fireEvent('toggle', b, true) : null;
		});
	},
	afterRender : function() {
		var me = this;
		$(this.el.dom).click(function(e) {
			e.stopPropagation();
			me.owner.fireLastCanvasClick();
		}).prepend('<div class="gd-attr-inspector-header"></div>');
		//toggle first!

		this.callParent();

		if (this.infoPanelVisible && this.getComponent(0)) {
			this.getComponent(0).toggle(true);
		}
	}
});
//------------inspectors---------------
Ext.define('GraphicDesigner.Inspector', {
	xtype : 'gdinspector',
	extend : 'Ext.button.Button',
	iconCls : 'gd-inspector-item-icon',
	title : '',
	panelSize : {
		width : 250,
		height : 300
	},
	panelConfig : {},
	observeTarget : 'view',
	//private
	layoutInfoPanel : function(callback) {
		var me = this;
		new Ext.util.DelayedTask(function() {
			me.infoPanel.show();
			me.infoPanel.alignTo(me.ownerCt.el, 'tr-tl', [1, 11]);
			me.infoPanel.hide();
			callback ? callback(me.infoPanel) : null;
		}).delay(30);
	},
	initComponent : function() {
		var me = this;
		this.infoPanel = Ext.widget({
			xtype : 'toolbar',
			vertical : true,
			shadow : false,
			cls : 'gd-attr-inspector-floating-panel',
			style : 'padding:0px!important;',
			layout : 'column',
			listeners : {
				afterRender : function() {
					$(this.el.dom).click(function(e) {
						e.stopPropagation();
						me.ownerCt.owner.fireLastCanvasClick();
					});
				}
			},
			items : [{
				xtype : 'header',
				cls : 'gd-inspector-panel-header',
				title : this.title,
				style : 'margin-bottom:0px;',
				height : 20,
				columnWidth : 1,
				listeners : {
					afterRender : function() {
						Ext.fly(this.el.query('.x-header-text')[0]).addCls('gd-inspector-panel-header-text');

						$(this.el.dom).append('<div class="gdicon-fast_forward gd-inspector-panel-header-btn"></div>')
							.find('.gd-inspector-panel-header-btn').click(function() {
								me.toggle(false);
							});
					}
				}

			}, Ext.apply({
				xtype : 'panel',
				height : this.panelSize.height - 20,
				columnWidth : 1
			}, this.panelConfig)],
			width : this.panelSize.width,
			height : this.panelSize.height,
			floating : true
		});
		this.infoPanel.hide();
		this.infoPanel.getComponent(1).on('afterRender', function() {
			$(this.el.dom).css('margin-bottom', '0px');
		});

		this.on('toggle', function(b, p) {
			this.layoutInfoPanel(function(ip) {
				ip[p ? 'show' : 'hide']();
			});
		});

		this.callParent();
	},
	afterRender : function() {
		this.callParent();

		var me = this;
		me.layoutInfoPanel();
	},
	destroy : function() {
		this.infoPanel.destroy();
		this.callParent();
	}
});

Ext.define('GraphicDesigner.ShortcutController', {
	extend : 'Ext.Component',
	xtype : 'gdshortcutcontroller',
	//each element in shortcuts should b in format like:
	//{'ctrl+p' : function(canvasPanel, e) {...}} {'l' : func...} {'ctrl+alt+shift+s': func...}
	//remember:1.ctrl 2.alt 3.shift 4.charcter
	shortcutMap : {},
	build : function() {
		var scs = {
			'ctrl+C' : function(cp) {
				if (!cp.selModel || !cp.clipboard) return;

				var ccData = [];
				cp.selModel.getSelections().filter(function(v) {
					ccData.push(v.getGraphicDescription());
				});
				if (ccData.length == 0) return;

				cp.clipboard.ccData = ccData;
				cp.clipboard.command = 'copy';
				cp.fireEvent('copy');
			},
			'ctrl+V' : function(cp) {
				if (!cp.selModel || !cp.clipboard || !cp.clipboard.ccData) return;

				if (cp.clipboard.command == 'cut') {
					//do cut
					var arr = [];
					cp.clipboard.ccData.filter(function(desc) {
						arr.push(Ext.clone(desc));
					});

					var views = cp.restoreViewsByDescriptions(arr);
					cp.selModel.clearSelection();
					cp.selModel.select(views);
					cp.fireEvent('cutpaste', views);

					cp.clipboard.command = 'copy';
				} else {
					//do copy!
					var arr = [];

					var origViewMap = {};
					cp.clipboard.ccData.filter(function(desc) {
						origViewMap[desc.viewId] = desc;
						desc.origViewId = desc.viewId;
						desc.viewId = Raphael.createUUID();
					});
					cp.clipboard.ccData.filter(function(desc) {
						if (desc.linkers) {
							desc.linkers = desc.linkers.filter(function(linker) {
								linker.target.x += 20;
								linker.target.y += 20;
								linker.points.filter(function(p) {
									p[0] += 20;
									p[1] += 20;
								});
								if (linker.target && linker.target.viewId) {
									//find orig view
									var origView = origViewMap[linker.target.viewId];
									if (!origView) {
										return false;
									}

									linker.target.viewId = origView.viewId;
									return true;
								}

								return true;
							});
						}
					});

					cp.clipboard.ccData.filter(function(desc) {
						//add each of copy view data' position to x-20,y-20
						desc.frame.x += 20;
						desc.frame.y += 20;
						var newDesc = Ext.clone(desc);

						arr.push(newDesc);
					});

					var views = cp.restoreViewsByDescriptions(arr);
					cp.selModel.clearSelection();
					cp.selModel.select(views);
					cp.fireEvent('copypaste', views);
				}

			},
			'ctrl+X' : function(cp) {
				if (!cp.selModel || !cp.clipboard) return;

				var ccData = [];
				cp.selModel.getSelections().filter(function(v) {
					ccData.push(v.getGraphicDescription());
				});
				cp.selModel.getSelections().filter(function(v) { v.destroy();});

				if (ccData.length == 0) return;

				cp.clipboard.ccData = ccData;
				cp.clipboard.command = 'cut';
				cp.fireEvent('cut');
			}
		};
		scs = Ext.applyIf(scs, this.shortcutMap);

		this.owner.on('keydown', function(e) {
			var keyarr = [];
			if (e.ctrlKey || e.metaKey) keyarr.push('ctrl');
			if (e.altKey) keyarr.push('alt');
			if (e.shiftKey) keyarr.push('shift');

			keyarr.push(String.fromCharCode(e.keyCode));

			var func = scs[keyarr.join('+')];
			func ? func(this, e) : null;
		});
	},
	destroy : function() {
		this.callParent();
	}
});

Ext.define('GraphicDesigner.ClipBoard', {
	extend : 'Ext.Component',
	xtype : 'gdclipboard',
	build : function() {
	},
	destroy : function() {
		this.callParent();
	}
});

Ext.define('GraphicDesigner.ViewsetPanel', {
	extend : 'Ext.panel.Panel',
	xtype : 'gdviewsetpanel',
	layout : 'column',
	columnWidth : 1,
	width : '100%',
	bodyPadding : '5 0 5 5',
	autoHeight : true,
	cls : 'gd-panel-bg',
	anchor : '100%',
	bodyCls : 'gd-viewset-bg',
	//viewTpls: must b an array&each one of it must in format like:
	// {type : 'Graphic.xxxx or xtype', [keyword: ''], title: 'title', [previewConfig: {...}], [viewConfig: {...}]]}
	// [previewConfig&viewConfig is optional]
	//title: template title
	//previewConfig: config 4 preview ext.drawcomponent
	//viewConfig: when creating this view,it will apply 2 the view' instance
	viewTpls : [],
	initComponent : function() {
		var me = this;
		this.items = [];
		this.viewTpls.filter(function(tpl) {
			var type = tpl.type;
			if (!type) return;

			//check if is xtype?
			var clsName = Ext.ClassManager.getNameByAlias('widget.' + type);
			if (!clsName) {
				clsName = type;
			}
			var cls = Ext.ClassManager.get(clsName);
			if (!cls) {
				alert('no class found 4 ' + type);
				return;
			}

			me.items.push(Ext.apply({
				viewTemplate : true,
				xtype : 'panel',
				width : 40,
				height : 40,
				header : false,
				title : tpl.title,
				keyword : tpl.keyword ? tpl.keyword : '',
				cls : 'gd-view-prview-small',
				viewCls : cls,
				viewConfig : tpl.viewConfig,
				viewBox: false,
				padding : 2,
				html : '<div scope="canvas" style="position:absolute;"></div>',
				listeners : {
					afterRender : function() {
						var ele = $(this.body.dom).find('div[scope=canvas]');
						ele.width(this.getWidth()).height(this.getHeight());
						var previewer = this.ownerCt.ownerCt.previewer;

						//draw preview
						Raphael(ele[0]).add(cls.prototype.getPreview({
							x : 4,
							y : 4,
							width : this.getWidth() - 8,
							height : this.getHeight() - 8
						}));

						var me = this;
						//previewer hover show/hide
						$(this.body.dom).find('div[scope=canvas]').css('cursor', 'move').hover(function() {
							//var draw = previewer.query('*[itemId=draw]')[0];
							previewer.query('*[itemId=title]')[0].setValue(me.title);
							previewer.show();
							var paper = previewer.paper;
							paper.clear();
							paper.add(me.viewCls.prototype.getPreview({
								x : 4,
								y : 4,
								width : paper.width - 8,
								height : paper.height - 20
							}));

							previewer.alignTo(me.el, 'tr', [10, 0]);
						}, function() {
							previewer.hide();
						});

						var canvas = this.ownerCt.ownerCt.getCanvasPanel();
						if (!canvas) return;

						//=================drag drop creation!=========================
						ele.mousedown(function(e) {
							if (e.button != 0 || canvas.viewonly) return;

							$(this).data('mouseDownEvent', e);
							$(this).data('oposition', $(this).offset());

							var clone = ele.clone().append('<div class="gd-tpl-dragging-tip"></div>');
							$(this).data('clone', clone);
							clone.hide();
							$(document.body).append(clone.removeAttr('id').css({
								'z-index' : 123456,
								position : 'absolute',
								x : $(this).offset().left,
								y : $(this).offset().top
							}));

							//bind document mousemove listener
							var canvasFrame = {
								x : $(canvas.paper.canvas).offset().left,
								y : $(canvas.paper.canvas).offset().top,
								width : $(canvas.paper.canvas).width(),
								height : $(canvas.paper.canvas).height()
							};
							var droppable = false;
							var mousemoveLis = function(e) {
								if (!ele.data('mouseDownEvent')) {
									return;
								}

								var clone = ele.data('clone');
								var preE = ele.data('mouseDownEvent');

								var dx = e.pageX - preE.pageX;
								var dy = e.pageY - preE.pageY;

								var op = ele.data('oposition');
								clone.show().css({
									position : 'absolute',
									top : op.top + dy,
									left : op.left + dx
								});

								if (e.pageX >= canvasFrame.x && e.pageX <= canvasFrame.x + canvasFrame.width &&
									e.pageY >= canvasFrame.y && e.pageY <= canvasFrame.y + canvasFrame.height) {
									droppable = true;
									if (!clone.find('.gd-tpl-dragging-tip').hasClass('gdicon-checkmark')) {
										clone.find('.gd-tpl-dragging-tip').removeClass().addClass('gd-tpl-dragging-tip gd-tpl-dragging-droppable gdicon-checkmark');
									}
								} else {
									droppable = false;
									if (!clone.find('.gd-tpl-dragging-tip').hasClass('gdicon-cross')) {
										clone.find('.gd-tpl-dragging-tip').removeClass().addClass('gd-tpl-dragging-tip gd-tpl-dragging-undroppable gdicon-cross');
									}
								}

							};
							$(document).mousemove(mousemoveLis);

							//bind document mouseup listener
							var mouseupLis = function(e) {
								ele.removeData('mouseDownEvent');

								//end dragging,destroy clone
								ele.data('clone') ? ele.data('clone').fadeOut(100, function() {$(this).remove();}) : null;
								ele.removeData('clone');
								delete GraphicDesigner.currentEvent;

								$(document).off('mouseup', mouseupLis);
								$(document).off('mousemove', mousemoveLis);
								$(canvas.paper.canvas).off('mousemove', mousemoveLis);

								//do drop!
								if (droppable) {
									//x,y is center of target frame!
									var x = e.pageX - canvasFrame.x;
									var y = e.pageY - canvasFrame.y;

									var finalFrame = null;

									if (me.viewConfig) {
										finalFrame = me.viewConfig.frame;
										if (!finalFrame && me.viewConfig.getDefaultFrame) {
											//try 2 get frame from func getDefaultFrame
											finalFrame = me.viewConfig.getDefaultFrame();
										}
									}
									if (!finalFrame) {
										//try 2 get frame from cls frame
										finalFrame = me.viewCls.prototype.frame;
									}
									if (!finalFrame) {
										finalFrame = me.viewCls.prototype.getDefaultFrame();
									}

									var v = canvas.addSubView(Ext.create(me.viewCls.getName(), Ext.applyIf({frame: {
										x : x - finalFrame.width / 2,
										y : y - finalFrame.height / 2,
										width : finalFrame.width,
										height : finalFrame.height
									}}, me.viewConfig)));

									canvas.fireLastCanvasClick();
									new Ext.util.DelayedTask(function() {
										canvas.fireEvent('viewclicked', v);
										canvas.fireEvent('viewdropped', v);
									}).delay(10);
								}
							};

							$(document).mouseup(mouseupLis);
						});

					}
				}
			}, tpl.previewConfig));
		});

		this.callParent();
	},
	//private
	renderHeaderEx : function(header) {
		var me = this;
		$(header.el.dom).addClass('gd-viewset-header').click(function() {
			if (me.collapsed) {
				me.expand(null, false);
			} else {
				me.collapse(null, false);
			}
		});
		if (this.collapsed) {
			$(header.el.dom).find('.x-header-text').before('<div class="gd-viewset-header-indicator gdicon-chevron_right"></div>');
		} else {
			$(header.el.dom).find('.x-header-text').before('<div class="gd-viewset-header-indicator gdicon-expand_more"></div>');
		}
		this.on('collapse', function() {
			$(header.el.dom).find('.gd-viewset-header-indicator').removeClass('gdicon-expand_more').addClass('gdicon-chevron_right');
		});
		this.on('expand', function() {
			$(header.el.dom).find('.gd-viewset-header-indicator').removeClass('gdicon-chevron_right').addClass('gdicon-expand_more');
		});
	},
	afterRender : function() {
		var me = this;
		var header = this.getHeader();
		if (header) {
			if (header.rendered) {
				this.renderHeaderEx(header);
			} else {
				header.on('afterRender', function() {
					me.renderHeaderEx(this);
				});
			}
		}

		this.callParent();
	}
});

Ext.define('GraphicDesigner.Viewtemplatelist', {
	extend : 'Ext.panel.Panel',
	xtype : 'gdviewtemplatelist',
	layout : 'column',
	bodyCls : 'gd-view-template-list',
	getCanvasPanel : Ext.emptyFn,
	autoScroll : true,
	viewsets : [],
	filter : function(key) {
		Ext.each(this.query('*[viewTemplate=true]'), function(p) {
			p[p.keyword.indexOf(key) != -1 ? 'show' : 'hide']();
		});
	},
	clearFilter : function() {
		Ext.each(this.query('*[viewTemplate=true]'), function(p) {
			p.show();
		});
	},
	initComponent : function() {
		window.tpll = this;
		this.previewer = Ext.widget({
			xtype: 'toolbar',
			vertical : true,
			border: true,
			floating: true,
			fixed: true,
			cls : 'gd-view-previewer',
			shadow : false,
			width : 200,
			height : 150,
			layout : 'fit',
			items : [{
				xtype : 'panel',
				cls : 'gd-previewer-panel',
				style : 'margin-bottom:0px;',
				bodyStyle : 'background-color:transparent;',
				bodyPadding : 5,
				html : '<div scope="canvas" style="width:188px;height:108px;"></div>',
				listeners : {
					afterRender : function() {
						var ele = $(this.body.dom).find('div[scope=canvas]');
						this.ownerCt.paper = Raphael(ele[0]);
					}
				},
				bbar : {
					style : 'padding:0px!important;',
					items : ['->', {
						itemId : 'title',
						xtype : 'displayfield',
						value : ''
					}, '->']
				}
			}]
		});
		this.previewer.show();
		this.previewer.hide();

		this.items = this.viewsets;

		this.callParent();
	},
	afterRender : function() {
		this.callParent(arguments);

		var me = this;
		new Ext.util.DelayedTask(function(){
			me.doLayout();
		}).delay(20);
	}
});

Ext.define('GraphicDesigner.ContextMenuDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdcontextmenudelegate'//,TODO
	//getEventListeners : function() {
	//	var me = this;
	//	return {
	//		contextmenu : function(x, y, e) {
	//			e.preventDefault();
	//			Ext.menu.Manager.get(me.buildMenu(this)).showAt([x, y]);
	//			return false;
	//		}
	//	};
	//},
	//buildMenu : function(view) {
	//	return [{
	//		text : 'hahaha',
	//		handler : function() {
	//			alert(view.viewId);
	//		}
	//	}];
	//}
});
Ext.define('GraphicDesigner.DockDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gddockdelegate',
	supportBoundDock : true,
	supportCenterDock : true,
	buildDelegate : function() {
		this.xBoundDockers = [];
		this.yBoundDockers = [];
		this.xCenterDockers = [];
		this.yCenterDockers = [];

		var me = this;
		if (this.supportCenterDock) {
			this.xCenterDockers.push({
				spec : 'x',
				getValue : function() {
					return me.view.frame.x + me.view.frame.width / 2;
				},
				dock : function(docker, frame) {
					frame.x = me.view.frame.x + me.view.frame.width / 2 - frame.width / 2;
				}
			});
			this.yCenterDockers.push({
				spec : 'y',
				getValue : function() {
					return me.view.frame.y + me.view.frame.height / 2;
				},
				dock : function(docker, frame) {
					frame.y = me.view.frame.y + me.view.frame.height / 2 - frame.height / 2;
				}
			});
		}

		if (this.supportBoundDock) {
			this.xBoundDockers.push({
				spec : 'x',
				dir : 'l',
				getValue : function() {
					return me.view.frame.x;
				},
				dock : function(docker, frame) {
					if (docker.dir == 'l') {
						frame.x = me.view.frame.x;
					} else if (docker.dir == 'r') {
						frame.x = me.view.frame.x - frame.width;
					}
				}
			}, {
				spec : 'x',
				dir : 'r',
				getValue : function() {
					return me.view.frame.x + me.view.frame.width;
				},
				dock : function(docker, frame) {
					if (docker.dir == 'l') {
						frame.x = me.view.frame.x + me.view.frame.width;
					} else if (docker.dir == 'r') {
						frame.x = me.view.frame.x + me.view.frame.width - frame.width;
					}
				}
			});
			this.yBoundDockers.push({
				spec : 'y',
				dir : 't',
				getValue : function() {
					return me.view.frame.y;
				},
				dock : function(docker, frame) {
					if (docker.dir == 't') {
						frame.y = me.view.frame.y;
					} else if (docker.dir == 'b') {
						frame.y = me.view.frame.y - frame.height;
					}
				}
			}, {
				spec : 'y',
				dir : 'b',
				getValue : function() {
					return me.view.frame.y + me.view.frame.height;
				},
				dock : function(docker, frame) {
					if (docker.dir == 't') {
						frame.y = me.view.frame.y + me.view.frame.height;
					} else if (docker.dir == 'b') {
						frame.y = me.view.frame.y + me.view.frame.height - frame.height;
					}
				}
			});
		}


		Ext.each(this.getOtherDockers(), function(d) {
			if (!d.dir) {
				me[d.spec == 'x' ? 'xCenterDockers' : 'yCenterDockers'].push(d);
			} else {
				me[d.spec == 'x' ? 'xBoundDockers' : 'yBoundDockers'].push(d);
			}
		});

	},
	getDockersByType : function(type) {
		return me.__dockMap ? me.__dockMap[type] : null;
	},
	//return array of dockers
	//each docker is in format like {spec: 'x/y', getValue : fn, dock : fn(docker, frame), type: 'bound/center', dir: ''}
	getOtherDockers : Ext.emptyFn,
	getEventListeners : function() {
		var me = this;
		var cp = this.view.ownerCt;

		return {
			resize : function(frame, spec, minX, minY, maxW, maxH) {
				cp.clearDockers();

				var docked = false;
				var thisview = this;
				frame.x2 = frame.x + frame.width;
				frame.y2 = frame.y + frame.height;

				if (Math.abs(frame.x + frame.x + frame.width - cp.paperWidth) <= 4) {
					cp.drawDocker({
						spec : 'x',
						value : cp.paperWidth / 2
					}, 'black');

					//dock center |
					if (['tl', 'l', 'bl'].indexOf(spec) != -1) {
						//static x2
						//dock x!
						frame.width = frame.x2 + frame.x2 - cp.paperWidth;
						frame.x = frame.x2 - frame.width;
					}
					if (['tr', 'r', 'br'].indexOf(spec) != -1) {
						//static x
						//dock x!
						frame.width = cp.paperWidth - frame.x - frame.x;
					}
					docked = true;
				} else {
					//detect x |-|
					Ext.each(cp.detectViewsByRect({
						x : frame.x - 6,
						y : -9999999,
						width : frame.width + 12,
						height : 20999998
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//check bound docker first!
						var found = false;
						//check center dockers
						var value = frame.x + frame.width / 2;
						Ext.each(v.dockDelegate.xCenterDockers, function(docker) {
							var targetValue = docker.getValue();
							if (Math.abs(targetValue - value) <= 2) {
								found = true;
								cp.drawDocker({
									spec : docker.spec,
									value : targetValue
								});

								if (['tl', 'l', 'bl'].indexOf(spec) != -1) {
									frame.width = frame.x2 + frame.x2 - targetValue - targetValue;
									frame.x = frame.x2 - frame.width;
								}
								if (['tr', 'r', 'br'].indexOf(spec) != -1) {
									frame.width = targetValue + targetValue - frame.x - frame.x;
								}

								return false;
							}
						});

						if (found) {
							docked = true;
							return false;
						}

						Ext.each(v.dockDelegate.xBoundDockers, function(docker) {
							if (['l', 'r'].indexOf(docker.dir) == -1) return;

							var value = 0;
							if (['tl', 'l', 'bl'].indexOf(spec) != -1) {
								value = frame.x;
							}
							if (['tr', 'r', 'br'].indexOf(spec) != -1) {
								value = frame.x2;
							}
							var targetValue = docker.getValue();
							if (Math.abs(targetValue - value) <= 2) {
								found = true;
								cp.drawDocker({
									spec : docker.spec,
									value : targetValue
								});

								if (['tl', 'l', 'bl'].indexOf(spec) != -1) {
									frame.x = targetValue;
								}
								if (['tr', 'r', 'br'].indexOf(spec) != -1) {
									frame.x2 = targetValue;
								}
								frame.width = frame.x2 - frame.x;

								return false;
							}
						});

						if (found) {
							docked = true;
							return false;
						}

					});
				}

				//y dock
				if (Math.abs(frame.y + frame.y + frame.height - cp.paperHeight) <= 4) {
					cp.drawDocker({
						spec : 'y',
						value : cp.paperHeight / 2
					}, 'black');

					//dock center |
					if (['tl', 't', 'tr'].indexOf(spec) != -1) {
						//static x2
						//dock x!
						frame.height = frame.y2 + frame.y2 - cp.paperHeight;
						frame.y = frame.y2 - frame.height;
					}
					if (['bl', 'b', 'br'].indexOf(spec) != -1) {
						//static x
						//dock x!
						frame.height = cp.paperHeight - frame.y - frame.y;
					}
					docked = true;
				} else {
					//detect x |-|
					Ext.each(cp.detectViewsByRect({
						x : -9999999,
						y : frame.y - 6,
						width : 20999998,
						height : frame.height + 12
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//check bound docker first!
						var found = false;
						//check center dockers
						var value = frame.y + frame.height / 2;
						Ext.each(v.dockDelegate.yCenterDockers, function(docker) {
							var targetValue = docker.getValue();
							if (Math.abs(targetValue - value) <= 2) {
								found = true;
								cp.drawDocker({
									spec : docker.spec,
									value : targetValue
								});

								if (['tl', 't', 'tr'].indexOf(spec) != -1) {
									frame.height = frame.y2 + frame.y2 - targetValue - targetValue;
									frame.y = frame.y2 - frame.height;
								}
								if (['bl', 'b', 'br'].indexOf(spec) != -1) {
									frame.height = targetValue + targetValue - frame.y - frame.y;
								}

								return false;
							}
						});

						if (found) {
							docked = true;
							return false;
						}

						Ext.each(v.dockDelegate.yBoundDockers, function(docker) {
							if (['t', 'b'].indexOf(docker.dir) == -1) return;

							var value = 0;
							if (['tl', 't', 'tr'].indexOf(spec) != -1) {
								value = frame.y;
							}
							if (['bl', 'b', 'br'].indexOf(spec) != -1) {
								value = frame.y2;
							}
							var targetValue = docker.getValue();
							if (Math.abs(targetValue - value) <= 2) {
								found = true;
								cp.drawDocker({
									spec : docker.spec,
									value : targetValue
								});

								if (['tl', 't', 'tr'].indexOf(spec) != -1) {
									frame.y = targetValue;
								}
								if (['bl', 'b', 'br'].indexOf(spec) != -1) {
									frame.y2 = targetValue;
								}
								frame.height = frame.y2 - frame.y;

								return false;
							}
						});

						if (found) {
							docked = true;
							return false;
						}

					});
				}

				if (docked) {
					me.view.layoutInRect(frame);
					me.view.fireEvent('resizedocked', spec);
				}


			},
			dragmoving : function() {
				cp.clearDockers();

				var frame = me.view.frame;
				var docked = false;
				var thisview = this;

				if (Math.abs(frame.x + frame.x + frame.width - cp.paperWidth) <= 4) {
					//dock |
					cp.drawDocker({
						spec : 'x',
						value : cp.paperWidth / 2
					}, 'black');
					frame.x = (cp.paperWidth - frame.width) / 2;
					docked = true;
				} else {
					//detect x |-|
					Ext.each(cp.detectViewsByRect({
						x : frame.x - 2,
						y : -9999999,
						width : frame.width + 4,
						height : 20999998
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//check bound docker first!
						var found = false;
						//check center dockers
						Ext.each(v.dockDelegate.xCenterDockers, function(toDocker) {
							var toValue = toDocker.getValue();
							Ext.each(me.xCenterDockers, function(docker) {
								var value = docker.getValue();
								if (Math.abs(value - toValue) <= 2) {
									found = true;
									cp.drawDocker({
										spec : toDocker.spec,
										value : toValue
									});
									docker.docked ? docker.docked(toDocker, frame) : toDocker.dock(docker, frame);
									return false;
								}
							});
							if (found) return false;
						});

						if (!found) {
							Ext.each(v.dockDelegate.xBoundDockers, function(toDocker) {
								var toValue = toDocker.getValue();
								Ext.each(me.xBoundDockers, function(docker) {
									var value = docker.getValue();
									if (Math.abs(value - toValue) <= 2) {
										found = true;
										cp.drawDocker({
											spec : toDocker.spec,
											value : toValue
										});

										docker.docked ? docker.docked(toDocker, frame) : toDocker.dock(docker, frame);
										return false;
									}
								});
								if (found) return false;
							});
						}

						if (found) {
							docked = true;
							return false;
						}

					});
				}

				if (Math.abs(frame.y + frame.y + frame.height - cp.paperHeight) <= 4) {
					//dock -
					cp.drawDocker({
						spec : 'y',
						value : cp.paperHeight / 2
					}, 'black');
					frame.y = (cp.paperHeight - frame.height) / 2;
					docked = true;
				} else {
					Ext.each(cp.detectViewsByRect({
						x : -9999999,
						y : frame.y - 2,
						width : 20999998,
						height : frame.height + 4
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//detect y 工
						var found = false;
						//check center dockers
						Ext.each(v.dockDelegate.yCenterDockers, function(toDocker) {
							var toValue = toDocker.getValue();
							Ext.each(me.yCenterDockers, function(docker) {
								var value = docker.getValue();
								if (Math.abs(value - toValue) <= 2) {
									found = true;
									cp.drawDocker({
										spec : toDocker.spec,
										value : toValue
									});
									docker.docked ? docker.docked(toDocker, frame) : toDocker.dock(docker, frame);
									return false;
								}
							});
							if (found) return false;
						});

						if (!found) {
							Ext.each(v.dockDelegate.yBoundDockers, function(toDocker) {
								var toValue = toDocker.getValue();
								Ext.each(me.yBoundDockers, function(docker) {
									var value = docker.getValue();
									if (Math.abs(value - toValue) <= 2) {
										found = true;
										cp.drawDocker({
											spec : toDocker.spec,
											value : toValue
										});
										docker.docked ? docker.docked(toDocker, frame) : toDocker.dock(docker, frame);
										return false;
									}
								});
								if (found) return false;
							});
						}

						if (found) {
							docked = true;
							return false;
						}
					});
				}

				if (docked) {
					me.view.layoutInRect(frame);
					me.view.fireEvent('dragdocked');
				}
			},
			resizeend : function() {
				cp.clearDockers();
			},
			dragend : function() {
				cp.clearDockers();
			}
		};
	}
});
Ext.define('GraphicDesigner.DragDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gddragdelegate',
	buildDelegate : function() {
		this.view.set.attr('cursor', 'move');
	},
	getEventListeners : function() {
		var startFrame;
		return {
			dragstart : function(x, y, e) {
				if (e.button == 2) return;
				startFrame = this.frame;
			},
			dragmoving : function(dx, dy, x, y, e) {
				if (!startFrame) return;
				this.layoutInRect({
					x : startFrame.x + dx,
					y : startFrame.y + dy,
					width : startFrame.width,
					height : startFrame.height
				});
			},
			dragend : function(e) {
				startFrame = null;
				GraphicDesigner.suspendClick();
			}
		};
	}
});
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

		this.tooltip.css({
			left : rect.x,
			top : rect.y + rect.height + 10
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

Ext.define('GraphicDesigner.InspectorDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdinspectordelegate',
	bbEvent : function(eventName, args) {
		this.view.ownerCt.attributesInspectorPanel ?
			this.view.ownerCt.attributesInspectorPanel.updateByView(this.view, eventName, args) : null;
	},
	getEventListeners : function() {
		var me = this;
		var eventO = {
			dragend : function() { me.bbEvent('dragend', arguments);},
			keymoveend : function() { me.bbEvent('keymoveend', arguments);},
			resizeend : function() { me.bbEvent('resizeend', arguments);},
			selected : function() { me.bbEvent('selected', arguments);},
			deselected : function() { me.bbEvent('deselected', arguments);}
		};

		Ext.each(this.otherBBEvents, function(e) {
			eventO[e] = function() {
				me.bbEvent(e, arguments);
			}
		});

		return eventO;
	},
	//dragstart,layout ect.
	otherBBEvents : []
});
Ext.define('GraphicDesigner.KeyDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdkeydelegate',
	allowMove : true,
	allowDelete : true,
	getEventListeners : function() {
		var me = this;
		this.endTask = new Ext.util.DelayedTask(function(){
			me.view.fireEvent('keymoveend');
		});
		return {
			keydown : function(e) {
				if (this.editing) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				if (me.allowDelete && (event.keyCode == 8 || event.keyCode == 46)) {
					this.destroy();
					return;
				}

				if (me.allowMove) {
					switch (event.keyCode) {
						case 37:
							//move left
							var frame = this.frame;
							frame.x -= event.shiftKey ? 10 : 1;
							this.layoutInRect(frame);
							break;
						case 38:
							//move left
							var frame = this.frame;
							frame.y -= event.shiftKey ? 10 : 1;
							this.layoutInRect(frame);
							break;
						case 39:
							//move left
							var frame = this.frame;
							frame.x += event.shiftKey ? 10 : 1;
							this.layoutInRect(frame);
							break;
						case 40:
							//move left
							var frame = this.frame;
							frame.y += event.shiftKey ? 10 : 1;
							this.layoutInRect(frame);
							break;
					}

					if (event.keyCode >= 37 && event.keyCode <= 40) {
						me.endTask.cancel();
						this.fireEvent('keymovestart');

						me.endTask.delay(400);
					}
				}
			}
		};
	}
});
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
function GDLinker(src) {
	this.src = src;
	this.linkDelegate = src.linkend.data('ownerCt');
	this.paper = this.linkDelegate.view.set.paper;

	this.linkPadding = 30;
	this.mid = function(a, b) {
		return Math.floor((a + b) / 2);
	};
	//stroke-dasharray [“”, “-”, “.”, “-.”, “-..”, “. ”, “- ”, “--”, “- .”, “--.”, “--..”]
	this.dasharray = '';

	this.getTopSPoints = function(src, target, box) {
		var PD = this.linkPadding;
		var ps = [];
		var dx = Math.abs(target.x - src.x);
		var dy = Math.abs(target.y - src.y);

		if (target.y < src.y) {
			//		 ※
			//----------------
			//  |         |
			if (dy >= dx) {
				var midy = this.mid(target.y, src.y);
				//↑
				ps.push([src.x, midy], [target.x, midy]);
			} else {
				//→
				ps.push([src.x, target.y]);
			}
			return ps;
		}

		ps.push([src.x, src.y - PD]);
		if (target.y >= src.y && target.y < box.y2 && (target.x <= box.x || target.x >= box.x2)) {
			//
			//=======================
			// 	※  ||         ||  ※
			//     ||		  ||
			//-----------------------

			if (target.x > box.x - PD && target.x < box.x2 + PD) {
				//   |※||......||※|
				var midx = target.x <= box.x ? box.x - PD : box.x2 + PD;
				ps.push([midx, ps.last()[1]]);
				if (dy > dx) {//b
					ps.push([midx, target.y - PD], [target.x, target.y - PD]);
				} else {
					// l/r?
					ps.push([midx, target.y]);
				}
			} else {
				//  ※||x|......|x||※
				if (dy > dx) {// b
					ps.push([target.x, ps.last()[1]]);
				} else {
					var midx = target.x < box.x ? target.x + PD : target.x - PD;
					ps.push([midx, ps.last()[1]], [midx, target.y]);
				}
			}
			return ps;
		}

		if (target.x > box.x && target.x < box.x2 && target.y >= box.y && target.y < box.y2) {
			ps.push([(target.x < src.x ? box.x - PD : box.x2 + PD), src.y - PD]);
			if (dy > dx) {
				//⬇️
				ps.push([ps.last()[0], target.y - PD]);
				ps.push([target.x, target.y - PD]);
			} else {
				//← →
				ps.push([ps.last()[0], target.y]);
			}
			return ps;
		}

		if (target.x >= box.x - PD && target.x <= box.x2 + PD && target.y >= box.y2) {
			//    |  |         |  |
			//==========================
			//    ||      ※      ||
			//    ||             ||
			ps.push([target.x < src.x ? box.x - PD : box.x2 + PD, ps.last()[1]]);
			if (target.y == box.y2) {
				ps.push([ps.last()[0], target.y + PD], [target.x, target.y + PD]);
			} else {
				//b
				ps.push([ps.last()[0], target.y - PD], [target.x, target.y - PD]);
			}

			return ps;
		}

		//    |  |         |  |
		//==========================
		// ※  |               | ※
		//    |               |
		if (dy > dx) {
			//b
			ps.push([target.x, ps.last()[1]]);
		} else {
			// l/r?
			ps.push([target.x < src.x ? target.x + PD : target.x - PD, ps.last()[1]]);
			ps.push([ps.last()[0], target.y]);
		}

		return ps;
	};
	this.getTopSTPoints = function(src, target, box, tbox) {
		var PD = this.linkPadding;
		var ps = [];

		if (target.dir == 't') {
			if (target.y <= src.y) {
				if (tbox.x2 <= src.x - PD || tbox.x >= src.x + PD) {
					ps.push([src.x, target.y - PD], [target.x, target.y - PD]);
				} else {
					ps.push([src.x, src.y - PD]);
					if (target.x < src.x) {
						//t r t l b
						ps.push([tbox.x2 + PD, ps.last()[1]], [tbox.x2 + PD, target.y - PD]);
					} else {
						//t l t r b
						ps.push([tbox.x - PD, ps.last()[1]], [tbox.x - PD, target.y - PD]);
					}
					ps.push([target.x, target.y - PD]);
				}

				return ps;
			}

			//below src
			ps.push([src.x, src.y - PD]);
			if (target.x <= box.x - PD || target.x >= box.x2 + PD) {
				ps.push([target.x, ps.last()[1]]);
			} else {
				if (target.x < src.x) {
					ps.push([box.x - PD, ps.last()[1]]);
				} else {
					ps.push([box.x2 + PD, ps.last()[1]]);
				}
				ps.push([ps.last()[0], target.y - PD], [target.x, target.y - PD]);
			}

			return ps;
		}

		if (target.dir == 'b') {
			if (target.y <= src.y) {
				var midy = this.mid(src.y, target.y);
				ps.push([src.x, midy], [target.x, midy]);

				return ps;
			}

			ps.push([src.x, src.y - PD]);
			var midx;
			if (tbox.x2 < box.x) {
				midx = this.mid(tbox.x2, box.x);
			} else if (tbox.x > box.x2) {
				midx = this.mid(tbox.x, box.x2);
			} else {
				ps.last()[1] = Math.min(src.y - PD, tbox.y - PD);
				if (target.x < src.x) {
					midx = Math.min(box.x - PD, tbox.x - PD);
				} else {
					midx = Math.max(box.x2 + PD, tbox.x2 + PD);
				}
			}

			ps.push([midx, ps.last()[1]], [midx, target.y + PD]);
			ps.push([target.x, ps.last()[1]]);

			return ps;
		}

		if (target.dir == 'l') {
			if (tbox.y2 < src.y) {
				if (target.x < src.x) {
					//t l t r
					var midy = this.mid(tbox.y2, src.y);
					ps.push([src.x, midy], [tbox.x - PD, midy], [tbox.x - PD, target.y]);
				} else {
					//t r
					ps.push([src.x, target.y]);
				}
				return ps;
			}

			if (target.y < src.y && target.x >= src.x) {
				//t r
				ps.push([src.x, target.y]);
				return ps;
			}

			//intersected or ...
			ps.push([src.x, Math.min(src.y - PD, tbox.y - PD)]);
			if (tbox.x <= box.x2) {
				ps.push([Math.min(box.x - PD, tbox.x - PD), ps.last()[1]]);
				ps.push([ps.last()[0], target.y]);
			} else {
				var midx = this.mid(box.x2, tbox.x);
				ps.push([midx, ps.last()[1]], [midx, target.y]);
			}
		}

		if (target.dir == 'r') {
			if (tbox.y2 < src.y) {
				if (target.x > src.x) {
					//t r t l
					var midy = this.mid(tbox.y2, src.y);
					ps.push([src.x, midy], [tbox.x2 + PD, midy], [tbox.x2 + PD, target.y]);
				} else {
					//t r
					ps.push([src.x, target.y]);
				}
				return ps;
			}

			if (target.y < src.y && target.x <= src.x) {
				//t l
				ps.push([src.x, target.y]);
				return ps;
			}

			//intersected or ...
			ps.push([src.x, Math.min(src.y - PD, tbox.y - PD)]);
			if (tbox.x2 >= box.x) {
				ps.push([Math.max(box.x2 + PD, tbox.x2 + PD), ps.last()[1]]);
				ps.push([ps.last()[0], target.y]);
			} else {
				var midx = this.mid(box.x, tbox.x2);
				ps.push([midx, ps.last()[1]], [midx, target.y]);
			}
		}

		return ps;
	};
	this.getBottomSPoints = function(src, target, box) {
		var PD = this.linkPadding;
		var ps = [];
		var dx = Math.abs(target.x - src.x);
		var dy = Math.abs(target.y - src.y);

		if (target.y > src.y) {

			//  |         |
			//----------------
			//		 ※
			if (dy >= dx) {
				var midy = this.mid(target.y, src.y);
				//↑
				ps.push([src.x, midy], [target.x, midy]);
			} else {
				//→
				ps.push([src.x, target.y]);
			}
			return ps;
		}

		ps.push([src.x, src.y + PD]);
		if (target.y <= src.y && target.y > box.y && (target.x <= box.x || target.x >= box.x2)) {
			//
			//-----------------------
			// 	※  ||         ||  ※
			//     ||		  ||
			//=======================

			if (target.x > box.x - PD && target.x < box.x2 + PD) {
				//   |※||......||※|
				var midx = target.x <= box.x ? box.x - PD : box.x2 + PD;
				ps.push([midx, ps.last()[1]]);
				if (dy > dx) {//t
					ps.push([midx, target.y + PD], [target.x, target.y + PD]);
				} else {
					// l/r?
					ps.push([midx, target.y]);
				}
			} else {
				//  ※||x|......|x||※
				if (dy > dx) {// b
					ps.push([target.x, ps.last()[1]]);
				} else {
					var midx = target.x < box.x ? target.x + PD : target.x - PD;
					ps.push([midx, ps.last()[1]], [midx, target.y]);
				}
			}
			return ps;
		}

		if (target.x > box.x && target.x < box.x2 && target.y > box.y && target.y <= box.y2) {
			ps.push([(target.x < src.x ? box.x - PD : box.x2 + PD), src.y + PD]);
			if (dy > dx) {
				//⬆️
				ps.push([ps.last()[0], target.y + PD]);
				ps.push([target.x, target.y + PD]);
			} else {
				//← →
				ps.push([ps.last()[0], target.y]);
			}
			return ps;
		}

		if (target.x >= box.x - PD && target.x <= box.x2 + PD && target.y <= box.y) {
			//    ||      ※      ||
			//    ||             ||
			//==========================
			//    |  |         |  |

			ps.push([target.x < src.x ? box.x - PD : box.x2 + PD, ps.last()[1]]);
			if (target.y == box.y) {
				ps.push([ps.last()[0], target.y - PD], [target.x, target.y - PD]);
			} else {
				//b
				ps.push([ps.last()[0], target.y + PD], [target.x, target.y + PD]);
			}

			return ps;
		}

		// ※  |               | ※
		//    |               |
		//==========================
		//    |  |         |  |

		if (dy > dx) {
			//b
			ps.push([target.x, ps.last()[1]]);
		} else {
			// l/r?
			ps.push([target.x < src.x ? target.x + PD : target.x - PD, ps.last()[1]]);
			ps.push([ps.last()[0], target.y]);
		}

		return ps;
	};
	this.getBottomSTPoints = function(src, target, box, tbox) {
		var PD = this.linkPadding;
		var ps = [];

		if (target.dir == 'b') {
			if (target.y >= src.y) {
				if (tbox.x2 <= src.x - PD || tbox.x >= src.x + PD) {
					ps.push([src.x, target.y + PD], [target.x, target.y + PD]);
				} else {
					ps.push([src.x, src.y + PD]);
					if (target.x < src.x) {
						//t r t l b
						ps.push([tbox.x2 + PD, ps.last()[1]], [tbox.x2 + PD, target.y + PD]);
					} else {
						//t l t r b
						ps.push([tbox.x - PD, ps.last()[1]], [tbox.x - PD, target.y + PD]);
					}
					ps.push([target.x, target.y + PD]);
				}

				return ps;
			}

			//below src
			ps.push([src.x, src.y + PD]);
			if (target.x <= box.x - PD || target.x >= box.x2 + PD) {
				ps.push([target.x, ps.last()[1]]);
			} else {
				if (target.x < src.x) {
					ps.push([box.x - PD, ps.last()[1]]);
				} else {
					ps.push([box.x2 + PD, ps.last()[1]]);
				}
				ps.push([ps.last()[0], target.y + PD], [target.x, target.y + PD]);
			}

			return ps;
		}

		if (target.dir == 't') {
			if (target.y >= src.y) {
				var midy = this.mid(src.y, target.y);
				ps.push([src.x, midy], [target.x, midy]);

				return ps;
			}

			ps.push([src.x, src.y + PD]);
			var midx;
			if (tbox.x2 < box.x) {
				midx = this.mid(tbox.x2, box.x);
			} else if (tbox.x > box.x2) {
				midx = this.mid(tbox.x, box.x2);
			} else {
				ps.last()[1] = Math.max(src.y + PD, tbox.y2 + PD);
				if (target.x < src.x) {
					midx = Math.min(box.x - PD, tbox.x - PD);
				} else {
					midx = Math.max(box.x2 + PD, tbox.x2 + PD);
				}
			}

			ps.push([midx, ps.last()[1]], [midx, target.y - PD]);
			ps.push([target.x, ps.last()[1]]);

			return ps;
		}

		if (target.dir == 'l') {
			if (tbox.y > src.y) {
				if (target.x < src.x) {
					//t l t r
					var midy = this.mid(tbox.y, src.y);
					ps.push([src.x, midy], [tbox.x - PD, midy], [tbox.x - PD, target.y]);
				} else {
					//t r
					ps.push([src.x, target.y]);
				}
				return ps;
			}

			if (target.y > src.y && target.x >= src.x) {
				//t r
				ps.push([src.x, target.y]);
				return ps;
			}

			//intersected or ...
			ps.push([src.x, Math.max(src.y + PD, tbox.y2 + PD)]);
			if (tbox.x <= box.x2) {
				ps.push([Math.min(box.x - PD, tbox.x - PD), ps.last()[1]]);
				ps.push([ps.last()[0], target.y]);
			} else {
				var midx = this.mid(box.x2, tbox.x);
				ps.push([midx, ps.last()[1]], [midx, target.y]);
			}
		}

		if (target.dir == 'r') {
			if (tbox.y > src.y) {
				if (target.x > src.x) {
					//t r t l
					var midy = this.mid(tbox.y, src.y);
					ps.push([src.x, midy], [tbox.x2 + PD, midy], [tbox.x2 + PD, target.y]);
				} else {
					//t r
					ps.push([src.x, target.y]);
				}
				return ps;
			}

			if (target.y > src.y && target.x <= src.x) {
				//t l
				ps.push([src.x, target.y]);
				return ps;
			}

			//intersected or ...
			ps.push([src.x, Math.max(src.y + PD, tbox.y2 + PD)]);
			if (tbox.x2 >= box.x) {
				ps.push([Math.max(box.x2 + PD, tbox.x2 + PD), ps.last()[1]]);
				ps.push([ps.last()[0], target.y]);
			} else {
				var midx = this.mid(box.x, tbox.x2);
				ps.push([midx, ps.last()[1]], [midx, target.y]);
			}
		}

		return ps;
	};
	this.getLeftSPoints = function(src, target, box) {
		var PD = this.linkPadding;
		var ps = [];
		var dx = Math.abs(target.x - src.x);
		var dy = Math.abs(target.y - src.y);

		if (target.x < src.x) {
			//  |
			//	|-----
			//  |
			//※ |
			//  |
			//  |-----
			//  |
			if (dx >= dy) {
				var midx = this.mid(target.x, src.x);
				//←
				ps.push([midx, src.y], [midx, target.y]);
			} else {
				//⬇️
				ps.push([target.x, src.y]);
			}
			return ps;
		}

		ps.push([src.x - PD, src.y]);
		if (target.x >= src.x && target.x < box.x2 && (target.y <= box.y || target.y >= box.y2)) {
			//    ||     ※   |
			//    ||=========|
			//    ||         |
			//    ||         |
			//    ||         |
			//    ||=========|
			//    ||     ※   |
			//=======================

			if (target.y > box.y - PD && target.y < box.y2 + PD) {
				//---
				//※
				//===
				//.
				//.
				//===
				//※
				//---
				var midy = target.y <= box.y ? box.y - PD : box.y2 + PD;
				ps.push([ps.last()[0], midy]);
				if (dx > dy) {//r
					ps.push([target.x - PD, midy], [target.x - PD, target.y]);
				} else {
					// t/b?
					ps.push([target.x, midy]);
				}
			} else {
				//※
				//---
				//x
				//===
				//.
				//.
				//===
				//x
				//---
				//※
				if (dx > dy) {// r
					ps.push([ps.last()[0], target.y]);
				} else {
					var midy = target.y < box.y ? target.y + PD : target.y - PD;
					ps.push([ps.last()[0], midy], [target.x, midy]);
				}
			}
			return ps;
		}

		//inbox
		if (target.x >= box.x && target.x < box.x2 && target.y > box.y && target.y < box.y2) {
			ps.push([src.x - PD, (target.y < src.y ? box.y - PD : box.y2 + PD)]);
			if (dx > dy) {
				//→
				ps.push([target.x - PD, ps.last()[1]]);
				ps.push([target.x - PD, target.y]);
			} else {
				//↑ ⬇️
				ps.push([target.x, ps.last()[1]]);
			}
			return ps;
		}

		if (target.y >= box.y - PD && target.y <= box.y2 + PD && target.x >= box.x2) {
			// ||
			//-||=========
			//-||
			// ||   ※
			//-||
			//-||=========
			// ||

			ps.push([ps.last()[0], target.y < src.y ? box.y - PD : box.y2 + PD]);
			if (target.x == box.x2) {
				ps.push([target.x + PD, ps.last()[1]], [target.x + PD, target.y]);
			} else {
				//r
				ps.push([target.x - PD, ps.last()[1]], [target.x - PD, target.y]);
			}

			return ps;
		}

		// ||※
		//-||=========
		//-||
		// ||
		//-||
		//-||=========
		// ||※
		if (dx > dy) {
			//r
			ps.push([ps.last()[0], target.y]);
		} else {
			// t/b?
			ps.push([ps.last()[0], target.y < src.y ? target.y + PD : target.y - PD]);
			ps.push([target.x, ps.last()[1]]);
		}

		return ps;
	};
	this.getLeftSTPoints = function(src, target, box, tbox) {
		var PD = this.linkPadding;
		var ps = [];

		if (target.dir == 'l') {
			if (target.x <= src.x) {
				if (tbox.y >= src.y + PD || tbox.y2 <= src.y - PD) {
					ps.push([target.x - PD, src.y], [target.x - PD, target.y]);
				} else {
					ps.push([src.x - PD, src.y]);
					if (target.y > src.y) {
						//l t l b r
						ps.push([ps.last()[0], tbox.y - PD], [target.x - PD, tbox.y - PD]);
					} else {
						//t l t r b
						ps.push([ps.last()[0], tbox.y2 + PD], [target.x - PD, tbox.y2 + PD]);
					}
					ps.push([target.x - PD, target.y]);
				}

				return ps;
			}

			//right 2 src
			ps.push([src.x - PD, src.y]);
			if (target.y <= box.y - PD || target.y >= box.y2 + PD) {
				ps.push([ps.last()[0], target.y]);
			} else {
				if (target.y > src.y) {
					ps.push([ps.last()[0], box.y2 + PD]);
				} else {
					ps.push([ps.last()[0], box.y - PD]);
				}
				ps.push([target.x - PD, ps.last()[1]], [target.x - PD, target.y]);
			}

			return ps;
		}

		if (target.dir == 'r') {
			if (target.x <= src.x) {
				var midx = this.mid(src.x, target.x);
				ps.push([midx, src.y], [midx, target.y]);

				return ps;
			}

			ps.push([src.x - PD, src.y]);
			var midy;
			if (tbox.y > box.y2) {
				midy = this.mid(tbox.y, box.y2);
			} else if (tbox.y2 < box.y) {
				midy = this.mid(tbox.y2, box.y);
			} else {
				ps.last()[0] = Math.min(src.x - PD, tbox.x - PD);
				if (target.y > src.y) {
					midy = Math.max(box.y2 + PD, tbox.y2 + PD);
				} else {
					midy = Math.min(box.y - PD, tbox.y - PD);
				}
			}

			ps.push([ps.last()[0], midy], [target.x + PD, midy]);
			ps.push([ps.last()[0], target.y]);

			return ps;
		}

		if (target.dir == 'b') {
			if (tbox.x2 < src.x) {
				if (target.y > src.y) {
					//l b l t
					var midx = this.mid(tbox.x2, src.x);
					ps.push([midx, src.y], [midx, tbox.y2 + PD], [target.x, tbox.y2 + PD]);
				} else {
					//t r
					ps.push([target.x, src.y]);
				}
				return ps;
			}

			if (target.x < src.x && target.y <= src.y) {
				//l t
				ps.push([target.x, src.y]);
				return ps;
			}

			//intersected or ...
			ps.push([Math.min(src.x - PD, tbox.x - PD), src.y]);
			if (tbox.y2 >= box.y) {
				ps.push([ps.last()[0], Math.max(box.y2 + PD, tbox.y2 + PD)]);
				ps.push([target.x, ps.last()[1]]);
			} else {
				var midy = this.mid(box.y2, tbox.y);
				ps.push([ps.last()[0], midy], [target.x, midy]);
			}
		}

		if (target.dir == 't') {
			if (tbox.x2 < src.x) {
				if (target.y < src.y) {
					//l t l b
					var midx = this.mid(tbox.x2, src.x);
					ps.push([midx, src.y], [midx, tbox.y - PD], [target.x, tbox.y - PD]);
				} else {
					//l b
					ps.push([target.x, src.y]);
				}
				return ps;
			}

			if (target.x < src.x && target.y >= src.y) {
				//l t
				ps.push([target.x, src.y]);
				return ps;
			}

			//intersected or ...
			ps.push([Math.min(src.x - PD, tbox.x - PD), src.y]);
			if (tbox.y <= box.y2) {
				ps.push([ps.last()[0], Math.min(box.y - PD, tbox.y - PD)]);
				ps.push([target.x, ps.last()[1]]);
			} else {
				var midy = this.mid(box.y2, tbox.y);
				ps.push([ps.last()[0], midy], [target.x, midy]);
			}
		}

		return ps;
	};
	this.getRightSPoints = function(src, target, box) {
		var PD = this.linkPadding;
		var ps = [];
		var dx = Math.abs(target.x - src.x);
		var dy = Math.abs(target.y - src.y);

		if (target.x > src.x) {
			//       |
			//	-----|
			//       |
			//       |※
			//       |
			//  -----|
			//       |
			if (dx >= dy) {
				var midx = this.mid(target.x, src.x);
				//←
				ps.push([midx, src.y], [midx, target.y]);
			} else {
				//⬇️
				ps.push([target.x, src.y]);
			}
			return ps;
		}

		ps.push([src.x + PD, src.y]);
		if (target.x <= src.x && target.x > box.x && (target.y <= box.y || target.y >= box.y2)) {
			//    |     ※   ||
			//    |=========||
			//    |         ||
			//    |         ||
			//    |         ||
			//    |=========||
			//    |     ※   ||
			//=======================

			if (target.y > box.y - PD && target.y < box.y2 + PD) {
				//---
				//  ※
				//===
				//  .
				//  .
				//===
				//  ※
				//---
				var midy = target.y <= box.y ? box.y - PD : box.y2 + PD;
				ps.push([ps.last()[0], midy]);
				if (dx > dy) {//r
					ps.push([target.x + PD, midy], [target.x + PD, target.y]);
				} else {
					// t/b?
					ps.push([target.x, midy]);
				}
			} else {
				//  ※
				//---
				//  x
				//===
				//  .
				//  .
				//===
				//  x
				//---
				//  ※
				if (dx > dy) {// l
					ps.push([ps.last()[0], target.y]);
				} else {
					var midy = target.y < box.y ? target.y + PD : target.y - PD;
					ps.push([ps.last()[0], midy], [target.x, midy]);
				}
			}
			return ps;
		}

		//inbox
		if (target.x > box.x && target.x <= box.x2 && target.y > box.y && target.y < box.y2) {
			ps.push([src.x + PD, (target.y < src.y ? box.y - PD : box.y2 + PD)]);
			if (dx > dy) {
				//←
				ps.push([target.x + PD, ps.last()[1]]);
				ps.push([target.x + PD, target.y]);
			} else {
				//↑ ⬇️
				ps.push([target.x, ps.last()[1]]);
			}
			return ps;
		}

		if (target.y >= box.y - PD && target.y <= box.y2 + PD && target.x <= box.x) {
			//         ||
			//=========||-
			//         ||-
			//   ※     ||
			//         ||-
			//=========||-
			//         ||

			ps.push([ps.last()[0], target.y < src.y ? box.y - PD : box.y2 + PD]);
			if (target.x == box.x) {
				ps.push([target.x - PD, ps.last()[1]], [target.x - PD, target.y]);
			} else {
				//l
				ps.push([target.x + PD, ps.last()[1]], [target.x + PD, target.y]);
			}

			return ps;
		}

		//    ※    ||
		//=========||-
		//         ||-
		//         ||
		//         ||-
		//=========||-
		//    ※    ||
		if (dx > dy) {
			//r
			ps.push([ps.last()[0], target.y]);
		} else {
			// t/b?
			ps.push([ps.last()[0], target.y < src.y ? target.y + PD : target.y - PD]);
			ps.push([target.x, ps.last()[1]]);
		}

		return ps;
	};
	this.getRightSTPoints = function(src, target, box, tbox) {
		var PD = this.linkPadding;
		var ps = [];

		if (target.dir == 'r') {
			if (target.x >= src.x) {
				if (tbox.y >= src.y + PD || tbox.y2 <= src.y - PD) {
					ps.push([target.x + PD, src.y], [target.x + PD, target.y]);
				} else {
					ps.push([src.x + PD, src.y]);
					if (target.y > src.y) {
						//r b r t l
						ps.push([ps.last()[0], tbox.y - PD], [target.x + PD, tbox.y - PD]);
					} else {
						//t l t r b
						ps.push([ps.last()[0], tbox.y2 + PD], [target.x + PD, tbox.y2 + PD]);
					}
					ps.push([target.x + PD, target.y]);
				}

				return ps;
			}

			//left 2 src
			ps.push([src.x + PD, src.y]);
			if (target.y <= box.y - PD || target.y >= box.y2 + PD) {
				ps.push([ps.last()[0], target.y]);
			} else {
				if (target.y > src.y) {
					ps.push([ps.last()[0], box.y2 + PD]);
				} else {
					ps.push([ps.last()[0], box.y - PD]);
				}
				ps.push([target.x + PD, ps.last()[1]], [target.x + PD, target.y]);
			}

			return ps;
		}

		if (target.dir == 'l') {
			if (target.x >= src.x) {
				var midx = this.mid(src.x, target.x);
				ps.push([midx, src.y], [midx, target.y]);

				return ps;
			}

			ps.push([src.x + PD, src.y]);
			var midy;
			if (tbox.y > box.y2) {
				midy = this.mid(tbox.y, box.y2);
			} else if (tbox.y2 < box.y) {
				midy = this.mid(tbox.y2, box.y);
			} else {
				ps.last()[0] = Math.max(src.x + PD, tbox.x + PD);
				if (target.y > src.y) {
					midy = Math.max(box.y2 + PD, tbox.y2 + PD);
				} else {
					midy = Math.min(box.y - PD, tbox.y - PD);
				}
			}

			ps.push([ps.last()[0], midy], [target.x - PD, midy]);
			ps.push([ps.last()[0], target.y]);

			return ps;
		}

		if (target.dir == 't') {
			if (tbox.x > src.x) {
				if (target.y < src.y) {
					//r t r b
					var midx = this.mid(tbox.x, src.x);
					ps.push([midx, src.y], [midx, tbox.y - PD], [target.x, tbox.y - PD]);
				} else {
					//t r
					ps.push([target.x, src.y]);
				}
				return ps;
			}

			if (target.x > src.x && target.y >= src.y) {
				//l t
				ps.push([target.x, src.y]);
				return ps;
			}

			//intersected or ...
			ps.push([Math.max(src.x + PD, tbox.x2 + PD), src.y]);
			if (tbox.y <= box.y2) {
				ps.push([ps.last()[0], Math.min(box.y - PD, tbox.y - PD)]);
				ps.push([target.x, ps.last()[1]]);
			} else {
				var midy = this.mid(box.y2, tbox.y);
				ps.push([ps.last()[0], midy], [target.x, midy]);
			}
		}

		if (target.dir == 'b') {
			if (tbox.x > src.x) {
				if (target.y > src.y) {
					//r t r b
					var midx = this.mid(tbox.x, src.x);
					ps.push([midx, src.y], [midx, tbox.y2 + PD], [target.x, tbox.y2 + PD]);
				} else {
					//t r
					ps.push([target.x, src.y]);
				}
				return ps;
			}

			if (target.x > src.x && target.y <= src.y) {
				//l t
				ps.push([target.x, src.y]);
				return ps;
			}

			//intersected or ...
			ps.push([Math.max(src.x + PD, tbox.x2 + PD), src.y]);
			if (tbox.y2 >= box.y) {
				ps.push([ps.last()[0], Math.max(box.y2 + PD, tbox.y2 + PD)]);
				ps.push([target.x, ps.last()[1]]);
			} else {
				var midy = this.mid(box.y, tbox.y2);
				ps.push([ps.last()[0], midy], [target.x, midy]);
			}
		}

		return ps;
	};
	this.getLinkerPoints = function(src, target) {
		var srcV = src.linkend.data('ownerCt').view;
		var box = srcV.set.getBBox();
		var points;
		if (src.dir == 't') {
			if (!target.dir) {
				points = this.getTopSPoints(src, target, src.linkend.data('ownerCt').view.set.getBBox());
			} else {
				var targetV = target.linkend.data('ownerCt').view;
				var tbox = targetV.set.getBBox();
				points = this.getTopSTPoints(src, target, box, tbox);
			}
		} else if (src.dir == 'b') {
			if (!target.dir) {
				points = this.getBottomSPoints(src, target, src.linkend.data('ownerCt').view.set.getBBox());
			} else {
				var targetV = target.linkend.data('ownerCt').view;
				var tbox = targetV.set.getBBox();
				points = this.getBottomSTPoints(src, target, box, tbox);
			}
		} else if (src.dir == 'l') {
			if (!target.dir) {
				points = this.getLeftSPoints(src, target, src.linkend.data('ownerCt').view.set.getBBox());
			} else {
				var targetV = target.linkend.data('ownerCt').view;
				var tbox = targetV.set.getBBox();
				points = this.getLeftSTPoints(src, target, box, tbox);
			}
		} else if (src.dir == 'r') {
			if (!target.dir) {
				points = this.getRightSPoints(src, target, src.linkend.data('ownerCt').view.set.getBBox());
			} else {
				var targetV = target.linkend.data('ownerCt').view;
				var tbox = targetV.set.getBBox();
				points = this.getRightSTPoints(src, target, box, tbox);
			}
		}

		points.unshift([src.x, src.y]);
		points.push([target.x, target.y]);

		return points;
	};

	var targetlinkendHighlight = null;

	this.paths = null;
	this.arrow = null;
	this.draw = function() {
		//draw path!
		this.drawByPoints(this.getLinkerPoints(this.src, this.target));
	}

	this.drawByPoints = function(points) {
		this.paths ? this.paths.remove() : null;
		this.paths = this.paper.set();

		for (var i = 0; i < points.length - 1; i++) {
			var p1 = points[i];
			var p2 = points[i + 1];
			var path = this.paper.path('M' + p1[0] + ',' + p1[1] + 'L' + p2[0] + ',' + p2[1]);
			this.paths.push(path);

			path.mousedown(function(e) {
				e.stopPropagation();
			}).attr({
				'stroke-width' : 2,
				cursor : 'pointer',
				'stroke-dasharray' : this.dasharray
			});
			if (i >= 1 && i + 1 <= points.length - 2) {
				if (p1[0] == p2[0]) {
					//can move l r
					path.dir = 'x';
					path.attr({
						cursor : 'ew-resize'
					});
				} else {
					path.dir = 'y';
					path.attr({
						cursor : 'ns-resize'
					});
				}

				var me = this;
				path.idx = i;
				path.drag(function(dx, dy) {
					var idx = this.idx;
					if (this.dir == 'x') {
						var x = this.startValue + dx;
						var ps = this.attr('path');
						ps[0][1] = ps[1][1] = x;
						this.attr('path', ps);

						var prePath = me.paths[idx - 1];
						var prePathP = prePath.attr('path');
						prePathP[1][1] = x;
						prePath.attr('path', prePathP);

						var nextPath = me.paths[idx + 1];
						var nextPathP = nextPath.attr('path');
						nextPathP[0][1] = x;
						nextPath.attr('path', nextPathP);
					} else {
						var y = this.startValue + dy;
						var ps = this.attr('path');
						ps[0][2] = ps[1][2] = y;
						this.attr('path', ps);

						var prePath = me.paths[idx - 1];
						var prePathP = prePath.attr('path');
						prePathP[1][2] = y;
						prePath.attr('path', prePathP);

						var nextPath = me.paths[idx + 1];
						var nextPathP = nextPath.attr('path');
						nextPathP[0][2] = y;
						nextPath.attr('path', nextPathP);
					}

					me.drawArrow();
					me.dehighlight();
					me.highlight();

				}, function() {
					if (this.dir == 'x') {
						this.startValue = this.attr('path')[0][1];
					} else {
						this.startValue = this.attr('path')[0][2];
					}

					var ld = me.linkDelegate;
					ld.view.ownerCt.selModel ? ld.view.ownerCt.selModel.selectLinker(me) : null;
				}, function() {
					delete this.startValue;
				});
			}
		}

		this.drawArrow();
	}

	this.drawArrow = function() {
		if (this.arrowDragging) {
			delete this.arrowDragging;
		} else {
			this.arrow ? this.arrow.remove() : null;
		}
		this.arrow = null;
		var arr = this.paths[this.paths.length - 1].attr('path');

		//draw path!
		var arrowPathArr = [];
		var lastNode = {
			x : arr[1][1],
			y : arr[1][2]
		};
		arrowPathArr.push('M', lastNode.x, lastNode.y);
		var secLastNode = {
			x : arr[0][1],
			y : arr[0][2]
		};
		if (lastNode.x == secLastNode.x) {//tb
			if (lastNode.y < secLastNode.y) {
				//t
				arrowPathArr.push('L', lastNode.x + 4, lastNode.y + 12, 'L', lastNode.x - 4, lastNode.y + 12, 'Z');
			} else {
				//b
				arrowPathArr.push('L', lastNode.x + 4, lastNode.y - 12, 'L', lastNode.x - 4, lastNode.y - 12, 'Z');
			}
		} else {
			if (lastNode.x < secLastNode.x) {
				//l
				arrowPathArr.push('L', lastNode.x + 12, lastNode.y + 4, 'L', lastNode.x + 12, lastNode.y - 4, 'Z');
			} else {
				//r
				arrowPathArr.push('L', lastNode.x - 12, lastNode.y + 4, 'L', lastNode.x - 12, lastNode.y - 4, 'Z');
			}
		}

		this.arrow = this.paper.path(arrowPathArr.join(',')).attr('fill', 'black').attr('cursor', 'move');
		this.arrow.mousedown(function(e) {
			e.stopPropagation();
		})

		var me = this;
		var ld = this.linkDelegate;
		this.arrow.drag(function(dx, dy) {
			//try 2 remove inlinkers if target has linkend
			if (me.target.linkend) {
				var index = me.target.linkend.inlinkers.indexOf(me);
				if (index > -1) me.target.linkend.inlinkers.splice(index, 1);
			}
			me.detectAndDraw(this.dx + dx, this.dy + dy);

			me.dehighlight();
			me.highlight();
			me.paths.toFront();
			me.arrow.toFront();

			this.hide();
		}, function() {
			this.dx = me.target.x - me.src.x;
			this.dy = me.target.y - me.src.y;
			ld.view.ownerCt.selModel ? ld.view.ownerCt.selModel.selectLinker(me) : null;
			me.arrowDragging = true;
		}, function() {
			if (!me.arrowDragging) {
				this.remove();
				me.saveToLinkends();
				me.complete();
			} else {
				delete me.arrowDragging;
			}
		});
	}

	this.complete = function() {
		targetlinkendHighlight ? targetlinkendHighlight.remove() : null;
		targetlinkendHighlight = null;

		var me = this;
		var ld = this.linkDelegate;

		this.paths.click(function(e) {
			e.stopPropagation();
			ld.view.ownerCt.fireEvent('canvasclicked');
			ld.view.ownerCt.selModel ? ld.view.ownerCt.selModel.selectLinker(me) : null;
		});
	}

	this.saveToLinkends = function() {
		//store data...
		if (this.target.linkend && this.target.linkend.inlinkers.indexOf(this) == -1) {
			this.target.linkend.inlinkers.push(this);
		}
		if (this.src.linkend && this.src.linkend.outlinkers.indexOf(this) == -1) {
			this.src.linkend.outlinkers.push(this);
		}
	}

	this.highlight = function() {
		this.dehighlight();
		this.fx = [this.paths.glow({width : 2})];
		this.paths.toFront();
		this.arrow.toFront();
	}
	this.dehighlight = function() {
		this.fx ? this.fx[0].remove() : null;
		delete this.fx;
	}

	var cp = this.linkDelegate.view.ownerCt;
	this.detectAndDraw = function(dx, dy) {
		targetlinkendHighlight ? targetlinkendHighlight.remove() : null;
		targetlinkendHighlight = null;

		var target = {
			x : Math.round(this.src.x + dx),
			y : Math.round(this.src.y + dy)
		};

		var detectBox = {
			x : target.x - 5,
			y : target.y - 5,
			width : 10,
			height : 10
		};
		var targetView = cp.detectViewsByRect(detectBox, 1, function(v) { return v.linkDelegate != null;})[0];
		if (targetView) {
			//TRY 2 LINK 2 ANOTHER VIEWS' LINKEND
			targetView.linkDelegate.set.show();
			Ext.each(targetView.linkDelegate.set, function(linkend) {
				if (GraphicDesigner.isBBoxIntersect(linkend.getBBox(), detectBox)) {
					target.linkend = linkend;
					return false;
				}
			});

			if (target.linkend) {
				var targetLinkEnd = target.linkend;
				target.dir = targetLinkEnd.data('spec');
				target.x = targetLinkEnd.attr('cx');
				target.y = targetLinkEnd.attr('cy');

				targetlinkendHighlight = targetLinkEnd.paper.
					circle(target.x, target.y, 10).attr({fill : 'red', stroke : 'red', opacity : .5});
				targetLinkEnd.toFront();
			}
		}

		//default draw a link that is no target linkend!
		this.target = target;
		this.draw();
	}

	this.remove = function() {
		this.dehighlight();
		this.paths.remove();
		this.arrow.remove();
		//remove datas...

		if (this.src.linkend && this.src.linkend.outlinkers) {
			var index = this.src.linkend.outlinkers.indexOf(this);
			if (index > -1) this.src.linkend.outlinkers.splice(index, 1);
		}
		if (this.target.linkend && this.src.linkend.inlinkers) {
			var index = this.target.linkend.inlinkers.indexOf(this);
			if (index > -1) this.target.linkend.inlinkers.splice(index, 1);
		}
	}
}

Ext.define('GraphicDesigner.LinkDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdlinkdelegate',
	linkends : ['t', 'b', 'l', 'r'],
	redrawInOutLinkersWhenLayout : function() {
		this.set.forEach(function(ele) {
			var targetx = ele.attr('cx');
			var targety = ele.attr('cy');

			Ext.each(ele.outlinkers, function(linker) {
				//src x, y changed!
				linker.src.x = targetx;
				linker.src.y = targety;
				linker.draw();
				linker.complete();
			});

			Ext.each(ele.inlinkers, function(linker) {//linker is a set
				//target x, y changed!
				linker.target.x = targetx;
				linker.target.y = targety;
				linker.draw();
				linker.complete();
			});

			ele.toFront();
		});
	},
	getLinkersData : function() {
		var linkers = [];
		this.set.forEach(function(linkend) {
			linkend.outlinkers.filter(function(linker) {
				var target = {
					x : linker.target.x,
					y : linker.target.y,
					dir : linker.target.dir
				};
				target.viewId = linker.target.linkend ? linker.target.linkend.data('ownerCt').view.viewId : null;

				var points = [];
				linker.paths.forEach(function(p) {
					var path = p.attr('path');
					points.push([path[1][1], path[1][2]]);
				});
				points.pop();
				linkers.push({
					spec : linkend.data('spec'),
					target : target,
					points : points
				});
			});
		});

		return linkers;
	},
	restoreLinkers : function(linkers) {
		var cp = this.view.ownerCt;
		var me = this;
		linkers.filter(function(linkerData) {
			var srclinkend = me.getLinkendBySpec(linkerData.spec);
			if (!srclinkend) return;

			var targetlinkend;

			var target = linkerData.target;
			if (target.dir && target.viewId) {
				//try 2 find target view
				var targetView = cp.getView(target.viewId);
				if (targetView && targetView.linkDelegate) {
					targetlinkend = targetView.linkDelegate.getLinkendBySpec(target.dir);
				}
			}

			var linker = new GDLinker({
				x : srclinkend.attr('cx'),
				y : srclinkend.attr('cy'),
				linkend : srclinkend,
				dir : linkerData.spec
			});
			linker.target = {
				x : target.x,
				y : target.y,
				dir : target.dir,
				linkend : targetlinkend
			};

			if (linkerData.points) {
				var points = Ext.apply([], linkerData.points);
				points.unshift([linker.src.x, linker.src.y]);
				points.push([linker.target.x, linker.target.y]);
				linker.drawByPoints(points);
			} else {
				linker.draw();
			}
			linker.saveToLinkends();
			linker.complete();
		});

	},
	getLinkendBySpec : function(spec) {
		var res = null;
		this.set.forEach(function(le) {
			if (le.data('spec') == spec) {
				res = le;
				return false;
			}
		});

		return res;
	},
	buildDelegate : function() {
		var paper = this.view.set.paper;
		this.set = paper.set();

		function bindLink(linkend) {

			linkend.mousedown(function(e) {
				e.stopPropagation();
			});

			linkend.drag(function(dx, dy) {
				this.linker.detectAndDraw(dx, dy);
				this.toFront();
			}, function() {
				this.linker = new GDLinker({
					x : Math.round(this.attr('cx')),
					y : Math.round(this.attr('cy')),
					dir : this.data('spec'),
					linkend : linkend
				});
			}, function() {
				this.linker.saveToLinkends();
				this.linker.complete();
				delete this.linker;
			});
		}

		if (this.linkends.indexOf('t') != -1) {
			var t = this.produceLinkend('t');
			this.set.push(t);
			bindLink(t);
		}

		if (this.linkends.indexOf('r') != -1) {
			var r = this.produceLinkend('r');
			this.set.push(r);
			bindLink(r);
		}

		if (this.linkends.indexOf('b') != -1) {
			var b = this.produceLinkend('b');
			this.set.push(b);
			bindLink(b);
		}

		if (this.linkends.indexOf('l') != -1) {
			var l = this.produceLinkend('l');
			this.set.push(l);
			bindLink(l);
		}

		this.layoutElements();

		var me = this;
		this.set.hover(function() {
			me.set.show();
		}, Ext.emptyFn);

		this.set.hide();

	},
	getEventListeners : function() {
		var me = this;
		return {
			hover : function() {
				if (GraphicDesigner.selecting) return;
				me.set.toFront().show();
			},
			unhover : function() {
				if (!this.selected) me.set.hide();
			},
			zindexed : function() {
				if (me.view.selected) {
					new Ext.util.DelayedTask(function(){
						me.set.toFront();
					}).delay(100);
				}
			},
			resizestart : function() {
				this.ownerCt.selModel ? this.ownerCt.selModel.clearLinkerSels() : null;
			},
			selected : function(views) {
				me.set.toFront().show();
			},
			deselected : function() {
				me.set.hide();
			},
			layout : function() {
				me.layoutElements();
				me.redrawInOutLinkersWhenLayout();
			},
			dragstart : function() {
				me.set.toFront().show();
			}
		};
	},
	doDestroy : function() {
		this.set.forEach(function(linkend) {
			linkend.outlinkers ? linkend.outlinkers.filter(function(linker) {
				linker ? linker.remove() : null;
			}) : null;
		});
		this.set.remove();
	},
	layoutElements : function() {

		var box = this.view.frame;
		this.set.forEach(function(ele) {
			if (ele.data('type') != 'linkend') return;
			var hw = box.width / 2;
			var hh = box.height / 2;
			switch(ele.data('spec')) {
				case 't':
					ele.attr({cx: box.x + hw, cy: box.y});
					break;
				case 'r':
					ele.attr({cx: box.x + box.width, cy: box.y + hh});
					break;
				case 'b':
					ele.attr({cx: box.x + hw, cy: box.y + box.height});
					break;
				case 'l':
					ele.attr({cx: box.x, cy: box.y + hh});
					break;
			}
		});

	},
	produceLinkend : function(spec) {
		var paper = this.view.set.paper;

		var linkend = paper.circle(0, 0, 3)
			.data('type', 'linkend')
			.data('spec', spec).data('ownerCt', this)
			.attr({fill : 'white', cursor : 'crosshair', stroke: '#883333'}).click(function(e) { e.stopPropagation();});

		linkend.outlinkers = [];
		linkend.inlinkers = [];

		return linkend;
	}
});
Ext.define('GraphicDesigner.MultilineLabelDelegate', {
	extend : 'GraphicDesigner.LabelDelegate',
	xtype : 'gdmultilinelabeldelegate',
	buildTextHolder : function() {
		this.textHolder = $('<textarea style="resize:none;outline:none;" />').hide();
	}
});
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
Ext.define('GraphicDesigner.RotateDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdrotatedelegate',
	buildDelegate : function() {
	},
	getEventListeners : function() {},
	doDestroy : function() {}
});

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
Ext.define('GraphicDesigner.CanvasInfoInspector', {
	extend : 'GraphicDesigner.Inspector',
	xtype : 'gdcanvasinfoinspector',
	iconCls : 'gd-inspector-item-icon gdicon-navigation2',
	title : 'preview',
	observeTarget : 'view',
	initComponent : function() {
		this.panelSize = {
			width : 220,
			height : 243
		};
		var me = this;
		this.panelConfig = {
			bodyPadding : 5,
			bodyStyle : 'background-color:transparent;',
			html : '<div style="height:100%;padding:5px;" align="center"><canvas class="gd-canvas-preview-canvas"></canvas><div class="gd-splitter-h" style="margin-top:5px;"></div></div>',
			bbar : {
				cls : 'gd-inspector-panel-toolbar',
				style : 'padding-bottom:8px;',
				items : ['Scale:', {
					xtype : 'numberfield',
					width : 80,
					style : 'margin-left:5px;'
				}, '->', {
					tooltip : 'presentation',
					iconCls : 'gdicon-presentation gd-canvas-preview-btn',
					style : 'margin-right:3px;'
				}, {
					iconCls : 'gdicon-expand gd-canvas-preview-btn'
				}]
			},
			listeners : {
				afterRender : function() {
					me.update();
				}
			}
		};

		this.callParent();
	},
	update : function() {
		var me = this;
		if (!this.task) this.task = new Ext.util.DelayedTask(function() {
			var img = $('<img src="' + me.ownerCt.owner.getDataUrl() + '" />');
			try {
				var svg = $(me.ownerCt.owner.getCanvas());
				img.width(svg.width()).height(svg.height());
				$(me.el.dom).append(img);

				var cvs = $(me.infoPanel.el.dom).find('canvas');
				cvs.attr('width', svg.width()).attr('height', svg.height());

				var ctx = cvs[0].getContext('2d');

				ctx.fillStyle = me.ownerCt.owner.bgColor;
				ctx.fillRect(0, 0, svg.width(), svg.height());

				ctx.drawImage(img[0], 0, 0, svg.width(), svg.height());
			} catch(e) {
			} finally {
				img.remove();
			}
		});

		this.task.cancel();
		this.task.delay(100);
	}
});
Ext.define('GraphicDesigner.FrameInfoInspector', {
	extend : 'GraphicDesigner.Inspector',
	xtype : 'gdframeinfoinspector',
	iconCls : 'gd-inspector-item-icon gdicon-ruler3',
	title : 'Position & Size',
	labels : ['X', 'Y', 'W', 'H'],
	observeTarget : 'view',
	update : function(view, eventName, args) {
		var fields = this.infoPanel.query('numberfield');
		if (['dragend', 'selected', 'resizeend', 'keymoveend'].indexOf(eventName) != -1) {
			this.view = view;
			//update values
			fields.filter(function(f) {
				f.enable();
				f.suspendEvents(false);
				switch (f.scope) {
					case 'x' :
						f.setValue(view.frame.x);
						f.setDisabled(view.dragDelegate == null);
						break;
					case 'y' :
						f.setValue(view.frame.y);
						f.setDisabled(view.dragDelegate == null);
						break;
					case 'w' :
						f.setValue(view.frame.width);
						f.setDisabled(view.resizeDelegate == null);
						break;
					case 'h' :
						f.setValue(view.frame.height);
						f.setDisabled(view.resizeDelegate == null);
						break;
				}
				f.resumeEvents();
			});
		} else if (eventName == 'deselected') {
			fields.filter(function(f) {f.disable();});
			delete this.view;
		};
	},
	initComponent : function() {
		var me = this;
		this.panelSize = {
			width : 230,
			height : 110
		}
		this.panelConfig = {
			layout : 'vbox',
			defaults : {
				xtype : 'toolbar'
			},
			items : [{
				style : 'background-color:transparent;',
				items : [{
					xtype : 'label',
					html : this.labels[0],
					style : 'width:20px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 1,
					scope : 'x',
					value : 0,
					width : 80,
					enableKeyEvents : true,
					updateView : function() {
						if (!me.view) return;
						me.view.frame.x = this.getValue();
						me.view.layoutInRect(me.view.frame);
						me.view.fireEvent('keymoveend');
					},
					listeners : {
						blur : function() {
							this.updateView();
						},
						keyup : function(ctrl, e) {
							if (e.keyCode == 13) this.updateView();
						}
					}
				}, {
					xtype : 'label',
					html : this.labels[2],
					style : 'width:20px;margin-left:10px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 1,
					scope : 'w',
					value : 20,
					width : 80,
					enableKeyEvents : true,
					updateView : function() {
						if (!me.view) return;
						var ct = me.ownerCt.owner;
						me.view.frame.width = this.getValue();
						if (ct.constraint) {
							me.view.frame.width = Math.min(me.view.frame.width, ct.paperWidth - ct.constraintPadding - ct.constraintPadding - me.view.frame.x);
						}
						me.view.layoutInRect(me.view.frame);
						me.view.fireEvent('resizeend');
					},
					listeners : {
						blur : function() {
							this.updateView();
						},
						keyup : function(ctrl, e) {
							if (e.keyCode == 13) this.updateView();
						}
					}
				}]
			}, {
				style : 'background-color:transparent;',
				items : [{
					xtype : 'label',
					html : this.labels[1],
					style : 'width:20px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 1,
					scope : 'y',
					value : 0,
					width : 80,
					enableKeyEvents : true,
					updateView : function() {
						if (!me.view) return;

						me.view.frame.y = this.getValue();
						me.view.layoutInRect(me.view.frame);
						me.view.fireEvent('keymoveend');
					},
					listeners : {
						blur : function() {
							this.updateView();
						},
						keyup : function(ctrl, e) {
							if (e.keyCode == 13) this.updateView();
						}
					}
				}, {
					xtype : 'label',
					html : this.labels[3],
					style : 'width:20px;margin-left:10px;'
				}, {
					xtype : 'gdsymbolnumberfield',
					symbol : 'px',
					step : 1,
					scope : 'h',
					value : 20,
					width : 80,
					enableKeyEvents : true,
					updateView : function() {
						if (!me.view) return;
						var ct = me.ownerCt.owner;

						me.view.frame.height = this.getValue();
						if (ct.constraint) {
							me.view.frame.height = Math.min(me.view.frame.height, ct.paperHeight - ct.constraintPadding - ct.constraintPadding - me.view.frame.y);
						}
						me.view.layoutInRect(me.view.frame);
						me.view.fireEvent('resizeend');
					},
					listeners : {
						blur : function() {
							this.updateView();
						},
						keyup : function(ctrl, e) {
							if (e.keyCode == 13) this.updateView();
						}
					}
				}]
			}],
			listeners : {
				afterRender : function() {
					me.update(null, 'deselected');
				}
			}
		};

		this.callParent();
	}
});
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

Ext.define('GraphicDesigner.Image', {
	extend : 'GraphicDesigner.View',
	xtype : 'gdimage',
	src : null,
	setSrc : function(src) {
		this.src = src;
		this.set[0].attr('src', src);
	},
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
			type : 'image',
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
			type : 'image'
		}];

		this.callParent(arguments);
	},
	afterViewBuilt : function() {
		this.labelDelegate = Ext.applyIf(Ext.clone(this.labelDelegate), {
			xtype : 'gdlabeldelegate',
			//editable : false,
			text : this.text,
			getTextRect : function() {
				return this.view.frame;
			}
		});
		this.resizeDelegate = Ext.applyIf(Ext.clone(this.resizeDelegate), {
			xtype : 'gdresizedelegate',
			resizers : ['tl', 'tr', 'bl', 'br'],
			showOutline : true
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

