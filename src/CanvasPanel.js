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
		});
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
