//jquery rotate
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

Array.prototype.gdmove = function (from, to) {
	this.splice(to, 0, this.splice(from, 1)[0]);
};

//===========================GraphicDesigner definition=============================
var GraphicDesigner = GraphicDesigner || {};

GraphicDesigner.suspendClick = function() {
	GraphicDesigner.suspendClickEvent = true;
	new Ext.util.DelayedTask(function(){
		delete GraphicDesigner.suspendClickEvent;
	}).delay(30);
}

GraphicDesigner.transformShapeIntoFrame = function(ele, frame) {
	ele.transform('');
	var box = ele.getBBox();
	var w = box.width;
	var h = box.height;

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

//depends on extjs&jquery&raphael
//----------------------------canvas panel------------------------------------------
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
	bgColor : 'white',
	selModel : {
		xtype : 'gdselmodel'
	},
	attributesInspectorPanel : {
		xtype : 'gdattributesinspectorpanel'
	},
	//when restore view,and u need 2 inject some extra configs on it,implement this!
	//args:config	--just add more configs into it
	preProcessRestoreData : Ext.emptyFn,
	bodyCls : 'gd-canvas-bg',
	html : '<div scope="container"></div>',
	viewonly : false,
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
		var img = $('<image src="' + this.getDataUrl(true) + '" />');
		img.width(svg.width()).height(svg.height());
		$(document.body).append(img);
		img.on('load', function() { $(this).hide();});

		var cvs = $('<canvas></canvas>');
		cvs.attr('width', svg.width()).attr('height', svg.height());

		var ctx = cvs[0].getContext('2d');
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

		this.container.parent().parent().parent().find('*').stop();
		if (this.viewonly) {
			this.container.width(width).height(height);
			this.canvasContainer.css({left : 0, top : 0}).width(width).height(height);

			this.bgLayer.css({left : 0, top : 0}).width(width).height(height);
			this.container.parent().parent().parent().animate({scrollTop:0,scrollLeft:0}, 300);
			this.readOnlyMask.show();
			this.selModel ? this.selModel.clearSelection() : null;
			this.hideGrid();
		} else {
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
		this.viewonly = viewonly;
		this.setPaperSize(this.paperWidth, this.paperHeight);
	},
	afterLayout : function(layout) {
		if (this.attributesInspectorPanel) {
			this.attributesInspectorPanel.show();
			this.attributesInspectorPanel.alignTo(this.body, 'tr-tr?');
			this.attributesInspectorPanel.layoutInspector();
		}

		this.callParent(arguments);
	},
	afterRender : function() {
		this.attributesInspectorPanel ? this.attributesInspectorPanel = Ext.widget(this.attributesInspectorPanel) : null;
		this.attributesInspectorPanel ? this.attributesInspectorPanel.owner = this : null;

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

		this.readOnlyMask = $('<div class="gd-readonly-mask"></div>');
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
				$(paper.canvas).fadeTo(300, 1);
			} else {
				lastDownTarget = null;
				$(paper.canvas).fadeTo(300, .8);
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

				me.views.filter(function(view) {
					view.fireEvent('keydown', event);
				});
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
						me.selModel ? me.selModel.removePathSels() : null;
					} else {
						return;
					}
				}

				me.views.filter(function(view) {
					view.fireEvent('keyup', event);
				});
			}
		};
		document.addEventListener('keyup', keyupLis);
		//end key listeners

		window.paper = paper;
		//test

		if (this.selModel) {
			this.selModel = Ext.widget(this.selModel);
			this.selModel.build(this);
		}

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
		//order by zindex
		views.sort(function(o1, o2) {return o1.zIndex > o2.zIndex});
		var me = this;
		views.filter(function(desc) {
			if (!desc.hasOwnProperty('typeName')) return;

			me.preProcessRestoreData(desc);
			me.addSubView(Ext.create(desc.typeName, desc));
		});

		function allViewsByDescRendered() {
			me.views.filter(function(view) {
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
		this.removeAllViews();
		this.selModel ? this.selModel.destroy() : null;

		this.callParent(arguments);
	}
});

//-------------------------------------------views------------------------------------------
//default listeners : onDragMove onResize onRotate onFocus
//this class is abstract
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
	otherDelegates : [],
	resizeDelegate : {xtype : 'gdresizedelegate'},
	dragDelegate : {xtype : 'gddragdelegate'},
	linkDelegate : {xtype : 'gdlinkdelegate'},
	rotateDelegate : {xtype : 'gdrotatedelegate'},
	labelDelegate : {xtype : 'gdlabeldelegate'},
	keyDelegate : {xtype : 'gdkeydelegate'},
	dockDelegate : {xtype : 'gddockdelegate'},
	frameTipDelegate : {xtype : 'gdframetipdelegate'},
	inspectorDelegate : {xtype : 'gdinspectordelegate'},
	getCustomDescription : Ext.emptyFn,
	restoreCustomDescription : Ext.emptyFn,
	//private
	addDelegate : function(dl) {
		dl = Ext.widget(dl);
		dl.wireView(this);
		this.otherDelegates.push(dl);
	},
	getMoreGraphicDescription : Ext.emptyFn,
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
		var o = Ext.apply({
			typeName : Ext.getClassName(this),
			viewId : this.viewId,
			frame : this.frame,
			minW : this.minW,
			minH : this.minH,
			text : this.labelDelegate ? this.labelDelegate.text : '',
			linkers : this.linkDelegate ? this.linkDelegate.getLinkersData() : null,
			zIndex : this.zIndex
		}, this.getCustomDescription());

		return Ext.applyIf(o, this.getMoreGraphicDescription());
	},
	findDelegateBy : function(fn) {
		return this.otherDelegates.filter(fn);
	},
	afterRender : function() {
		this.rendered = true;
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
			this.dragDelegate = Ext.widget(this.dragDelegate);
			this.dragDelegate.wireView(this);
		}
		if (this.labelDelegate) {
			this.labelDelegate = Ext.widget(this.labelDelegate);
			this.labelDelegate.wireView(this);
		}
		if (this.rotateDelegate) {
			this.rotateDelegate = Ext.widget(this.rotateDelegate);
			this.rotateDelegate.wireView(this);
		}
		if (this.resizeDelegate) {
			this.resizeDelegate = Ext.widget(this.resizeDelegate);
			this.resizeDelegate.wireView(this);
		}
		if (this.linkDelegate) {
			this.linkDelegate = Ext.widget(this.linkDelegate);
			this.linkDelegate.wireView(this);
		}
		if (this.keyDelegate) {
			this.keyDelegate = Ext.widget(this.keyDelegate);
			this.keyDelegate.wireView(this);
		}
		if (this.dockDelegate) {
			this.dockDelegate = Ext.widget(this.dockDelegate);
			this.dockDelegate.wireView(this);
		}
		if (this.frameTipDelegate) {
			this.frameTipDelegate = Ext.widget(this.frameTipDelegate);
			this.frameTipDelegate.wireView(this);
		}
		if (this.inspectorDelegate) {
			this.inspectorDelegate = Ext.widget(this.inspectorDelegate);
			this.inspectorDelegate.wireView(this);
		}
		var od = [];
		Ext.each(this.otherDelegates, function(d) {
			var d = Ext.widget(d);
			if (!Ext.isObject(d)) return;
			od.push(d);
			d.wireView(me);
		});
		this.otherDelegates = od;

		this.fireEvent('afterRender');
	},
	//private
	afterRestoreByDescription : function(canvasPanel) {
		//restore linkers
		var linkers = this.linkers;
		delete this.linkers;
		if (!Ext.isEmpty(linkers) && this.linkDelegate) {
			this.linkDelegate.restoreLinkers(linkers, canvasPanel);
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
			this.inspectorDelegate ? this.inspectorDelegate.disableListeners() : null;
			this.otherDelegates.filter(function(d) {d.disableListeners();});
		} else {
			this.labelDelegate ? this.labelDelegate.enableListeners() : null;
			this.rotateDelegate ? this.rotateDelegate.enableListeners() : null;
			this.dragDelegate ? this.dragDelegate.enableListeners() : null;
			this.resizeDelegate ? this.resizeDelegate.enableListeners() : null;
			this.linkDelegate ? this.linkDelegate.enableListeners() : null;
			this.keyDelegate ? this.keyDelegate.enableListeners() : null;
			this.dockDelegates ? this.dockDelegates.enableListeners() : null;
			this.frameTipDelegate ? this.dockDelegates.enableListeners() : null;
			this.inspectorDelegate ? this.inspectorDelegate.enableListeners() : null;
			this.otherDelegates.filter(function(d) {d.enableListeners();});
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
		this.inspectorDelegate ? this.inspectorDelegate.destroy() : null;
		Ext.each(this.otherDelegates, function(d) {d.destroy();});

		this.set.remove();

		this.ownerCt ? this.ownerCt.removeView(this) : null;
		this.inspectorDelegate ? this.inspectorDelegate.bbEvent('destroy', []) : null;

		this.destroyed = true;
	}
});

Ext.define('GraphicDesigner.Circle', {
	extend : 'GraphicDesigner.View',
	xtype : 'gdcircle',
	fill : 'white',
	'fill-opacity' : 1,
	getMoreGraphicDescription : function() {
		return {
			fill : this.fill,
			'fill-opacity' : this['fill-opacity']
		};
	},
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
			fill : this.fill,
			'fill-opacity' : this['fill-opacity'],
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

Ext.define('GraphicDesigner.Pool', {
	extend : 'GraphicDesigner.View',
	xtype : 'gdpool',
	fill : 'white',
	'fill-opacity' : 1,
	minH : 90,
	getPreview : function(frame) {
		var w = Math.min(frame.height, frame.width);
		var h = frame.height - 4;

		if (w >= h) {
			w = h * .6;
		}
		var fromx = frame.x + (frame.width - w) / 2

		return [{
			type : 'rect',
			x : fromx,
			y : frame.y,
			width : w,
			height : h
		}, {
			type : 'path',
			path : 'M' + fromx + ',' + (frame.y + 20) + 'H' + (fromx + w)
		}];
	},
	getMoreGraphicDescription : function() {
		return {
			fill : this.fill,
			'fill-opacity' : this['fill-opacity']
		};
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
	buildUI : function(paper) {
		this.shapes = [{
			type : 'rect',
			'stroke-width' : 0,
			'fill-opacity' : this['fill-opacity'],
			fill : this.fill
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
			path : 'M' + (fromx + 20) + ',' + fromy + 'V' + (fromy + h)
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
			'stroke-width' : 0,
			'fill-opacity' : this['fill-opacity'],
			fill : this.fill
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
				var frame = this.getTextRect();
				return {
					angle : -90,
					cx : frame.x + frame.width / 2,
					cy : frame.y + frame.height / 2
				}
			},
			getTextRect : function() {
				var rect = this.view.frame;
				return {
					x : rect.x,
					y : rect.y,
					width : 40,
					height : rect.height
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

Ext.define('GraphicDesigner.Rect', {
	extend : 'GraphicDesigner.View',
	xtype : 'gdrect',
	fill : 'white',
	'fill-opacity' : 1,
	'stroke-width' : 2,
	getMoreGraphicDescription : function() {
		return {
			fill : this.fill,
			'fill-opacity' : this['fill-opacity']
		};
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
			fill : this.fill,
			'fill-opacity' : this['fill-opacity'],
			'stroke-width' : this['stroke-width']
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

//---------------------------------------delegates-------------------------------------------------
//abstract
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
//abstract
Ext.define('GraphicDesigner.ViewDelegate', {
	extend : 'GraphicDesigner.BaseObject',
	xtype : 'gdviewdelegate',
	//return object in format: {onDrag: function() ...}
	getEventListeners : Ext.emptyFn,
	buildDelegate : Ext.emptyFn,
	doDestroy : Ext.emptyFn,
	wireView : function(view) {
		this.view = view;

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

Ext.define('GraphicDesigner.DragDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gddragdelegate',
	buildDelegate : function() {
		this.view.set.attr('cursor', 'move');
	},
	getEventListeners : function() {
		var me = this;
		var startFrame;
		return {
			dragstart : function(x, y, e) {
				startFrame = me.view.frame;
			},
			dragmoving : function(dx, dy, x, y, e) {
				me.view.layoutInRect({
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
			keydown : function() {
				if (!this.selected || this.editing) return;

				if (me.allowDelete && event.keyCode == 8) {
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

//==========link delegate!
Ext.define('GraphicDesigner.LinkDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdlinkdelegate',
	linkends : ['t', 'b', 'l', 'r'],
	set : null,
	redrawInOutLinkers : function() {
		var me = this;

		this.set.forEach(function(ele) {
			var targetx = ele.attr('cx');
			var targety = ele.attr('cy');

			Ext.each(ele.data('outlinkers'), function(linker) {//linker is a set
				if (!linker[0].node) return;//path not exists
				var target = linker[0].data('target');
				linker.remove();
				me.drawLinker({
					x : targetx,
					y : targety,
					dir : ele.data('spec'),
					linkend : ele
				}, target);

			});

			Ext.each(ele.data('inlinkers'), function(linker) {//linker is a set
				if (!linker[0].node) return;//path not exists
				var src = linker[0].data('src');
				linker.remove();
				me.drawLinker(src, {
					x : targetx,
					y : targety,
					dir : ele.data('spec'),
					linkend : ele
				});

			});

			ele.toFront();
		});
	},
	drawLinker : function(src, target) {
		//src (x, y, linkend, dir)
		//target (x, y, linkend, dir)
		//var pathset = paper.set();
		src.x = Math.round(src.x);
		src.y = Math.round(src.y);
		target.x = Math.round(target.x);
		target.y = Math.round(target.y);

		//TODO TEST
		var path = this.calculateByAStar(src, target);
		//bind selection behavior...
		var me = this;
		path.click(function(e) {
			e.stopPropagation();
			me.view.ownerCt.fireEvent('canvasclicked');
			me.view.ownerCt.selModel ? me.view.ownerCt.selModel.selectPath(path) : null;
		});

		if (src.linkend && src.linkend.node) {
			//remove all destroyed path instances.
			var linkers = src.linkend.data('outlinkers').filter(function(l) {
				if (l == null) return false;
				return l[0].node != null;
			});
			linkers.push(path);
			src.linkend.data('outlinkers', linkers);
		}
		if (target.linkend && target.linkend.node) {
			//remove all destroyed path instances.
			var linkers = target.linkend.data('inlinkers').filter(function(l) {
				if (l == null) return false;
				return l[0].node != null;
			});
			linkers.push(path);
			target.linkend.data('inlinkers', linkers);
		}

		return path;
		//pathset.push(paper.path(lineDesc.join(',')));
		//return pathset.attr('stroke-width', 2);
	},
	getLinkersData : function() {
		var linkers = [];
		this.set.forEach(function(linkend) {
			linkend.data('outlinkers').filter(function(linker) {
				if (!linker[0].node) return;//this path is already destoryed,ignore it!

				var target = Ext.apply({}, linker[0].data('target'));
				target.viewId = target.linkend ? target.linkend.data('ownerCt').view.viewId : null;
				delete target.linkend;
				linkers.push({
					spec : linkend.data('spec'),
					target : target
				});
			});
		});

		return linkers;
	},
	restoreLinkers : function(linkers, canvasPanel) {
		var me = this;
		linkers.filter(function(linker) {
			var srclinkend = me.getLinkendBySpec(linker.spec);
			if (!srclinkend) return;

			var targetlinkend;

			var target = linker.target;
			if (target.dir && target.viewId) {
				//try 2 find target view
				var targetView = canvasPanel.getView(target.viewId);
				if (targetView && targetView.linkDelegate) {
					targetlinkend = targetView.linkDelegate.getLinkendBySpec(target.dir);
				}
			}

			me.drawLinker({
				x : srclinkend.attr('cx'),
				y : srclinkend.attr('cy'),
				linkend : srclinkend,
				dir : linker.spec
			}, {
				x : target.x,
				y : target.y,
				dir : target.dir,
				linkend : targetlinkend
			});

		});

	},
	getLinkendBySpec : function(spec) {
		var res;
		this.set.forEach(function(le) {
			if (le.data('spec') == spec) {
				res = le;
				return false;
			}
		});

		return res;
	},
	calculateByAStar : function(src, target) {
		var startTime = new Date().getTime();
		//indicate a proper step:100 50 25 10 5 2 1

		if (src.x == target.x && src.y == target.y) {
			return;
		}

		var step = Math.min(Math.abs(target.x - src.x), Math.abs(target.y - src.y));

		var srcBox, srcOutBox;
		if (src.linkend && src.linkend.data('ownerCt')) {
			srcBox = src.linkend.data('ownerCt').view.set.getBBox();
			step = Math.min(step, Math.round(srcBox.width), Math.round(srcBox.height));
			srcOutBox = {
				x : Math.round(srcBox.x) - 30,
				y : Math.round(srcBox.y) - 30,
				width : Math.round(srcBox.width) + 60,
				height : Math.round(srcBox.height) + 60
			};
		}
		var targetBox, targetOutBox;
		if (target.linkend && target.linkend.data('ownerCt')) {
			targetBox = target.linkend.data('ownerCt').view.set.getBBox();
			step = Math.min(step, Math.round(targetBox.width), Math.round(targetBox.height));
			targetOutBox = {
				x : Math.round(targetBox.x) - 30,
				y : Math.round(targetBox.y) - 30,
				width : Math.round(targetBox.width) + 60,
				height : Math.round(targetBox.height) + 60
			};
		}

		step = Math.max(29, step);
		step = Math.min(step, 50);
		//step = 1;
		console.log('step', step);
		//step = 10;

		//point:x,y rect:x,y,width,height
		function isNodeInBox(node, box) {
			if (box == null) return false;
			return node.x > box.x && node.x < box.x + box.width && node.y > box.y && node.y < box.y + box.height
		}

		//node:x y parent f g h key nextNode(dx, y) refrehs()
		function getNode(x, y, parent) {
			return {
				key : x + ',' + y,
				x : x,
				y : y,
				parent : parent,
				nextNode : function(dx, dy) {
					return getNode(this.x + dx, this.y + dy, this);
				},
				refresh : function() {
					this.g = this.parent ? (this.parent.g + Math.abs(this.parent.x - this.x) + Math.abs(this.parent.y - this.y)) : 0;
					this.h = Math.abs(target.y - this.y) + Math.abs(target.x - this.x);

					//add a factor
					var factor = 0;
					//if (this.parent && this.parent.parent) {
					//	var dx = this.parent.x - this.parent.parent.x;
					//	if (dx != 0 && this.y - this.parent.y != 0) {
					//		//im now moving horizontally
					//		factor += .1;
					//	}
					//
					//	var dy = this.parent.y - this.parent.parent.y;
					//	if (dy != 0 && this.x - this.parent.x != 0) {
					//		//im now moving vertically
					//		factor += .1;
					//	}
					//}

					this.f = this.g + this.h + factor;
					return this;
				}
			}.refresh();
		}

		var closeMap = {};

		var openList = [];
		openList.openMap = {};
		openList.sortByMinF = function() {
			return this.sort(function(o1, o2) {
				return o1.f > o2.f;
			});
		}

		function isNodeInvalid(node) {
			//|-box
			if (isNodeInBox(target, srcBox)) return false;

			//box-outbox
			if (isNodeInBox(target, srcOutBox)) {//TODO
				if (isNodeInBox(node, srcBox)) return true;

				if (src.dir == 't') {
					//if target in zone A(includes box bound)
					if (target.y <= src.y) {
						if (node.x != src.x) {
							if (target.y != src.y && node.y == src.y) return true;
						}
						return false;
					}

					//if target in zone B(includes box bounds)
					if ((target.x <= srcBox.x || target.x >= srcBox.x + srcBox.width) && (target.y >= src.y && target.y < srcBox.y + srcBox.height + 30)) {
						//exclude zone a's nodes
						//	  left-a										 right-a
						if (( (node.x > srcBox.x - 30 && node.x < src.x) || (node.x > src.x && node.x < srcBox.x + srcBox.width + 30) )
								//topbound-top
							&& (node.y <= src.y && node.y > src.y - 30)) return true;

						//	left-b												//right-b
						if (( (node.x > srcBox.x - 30 && node.x < srcBox.x) || (node.x > srcBox.x + srcBox.width && node.x < srcBox.x + srcBox.width + 30) )
								//above target.y
							&& (node.y < target.y && node.y >= src.y)) return true;

						return false;
					}

					//if target is zone C(include bound)
					if (target.y >= srcBox.y + srcBox.height) {
						//exclude zone a's nodes
						//	  left-a										 right-a
						if (( (node.x > srcBox.x - 30 && node.x < src.x) || (node.x > src.x && node.x < srcBox.x + srcBox.width + 30) )
								//topbound-top
							&& (node.y <= src.y && node.y > src.y - 30)) return true;

						//		left-b											right-b
						if (( (node.x > srcBox.x - 30 && node.x < srcBox.x) || (node.x > srcBox.x + srcBox.width && node.x < srcBox.x + srcBox.width + 30) )
								//above target.y
							&& (node.y < src.y + srcBox.height + 30 && node.y >= src.y)) return true;

						//		left-c									right-c
						if ( ((node.x > srcBox.x && node.x < target.x) || (node.x > target.x && node.x < srcBox.x + srcBox.width))
							&& node.y > src.y && node.y <= srcBox.y + srcBox.height + 30) return true;

						return false;
					}

				}

				if (src.dir == 'b') {
					//if target in zone A(includes box bound)
					if (target.y >= src.y) {
						if (node.x != src.x) {
							if (target.y != src.y && node.y == src.y) return true;
						}
						return false;
					}

					//if target in zone B(includes box bounds)
					if ((target.x <= srcBox.x || target.x >= srcBox.x + srcBox.width) && (target.y <= src.y && target.y > srcBox.y - 30)) {
						//exclude zone a's nodes
						//	  left-a										 right-a
						if (( (node.x > srcBox.x - 30 && node.x < src.x) || (node.x > src.x && node.x < srcBox.x + srcBox.width + 30) )
								//topbound-top
							&& (node.y >= src.y && node.y < src.y + 30)) return true;

						//	left-b												//right-b
						if (( (node.x > srcBox.x - 30 && node.x < srcBox.x) || (node.x > srcBox.x + srcBox.width && node.x < srcBox.x + srcBox.width + 30) )
								//above target.y
							&& (node.y > target.y && node.y <= src.y)) return true;

						return false;
					}

					//if target is zone C(include bound)
					if (target.y <= srcBox.y) {
						//exclude zone a's nodes
						//	  left-a										 right-a
						if (( (node.x > srcBox.x - 30 && node.x < src.x) || (node.x > src.x && node.x < srcBox.x + srcBox.width + 30) )
								//topbound-top
							&& (node.y >= src.y && node.y < src.y + 30)) return true;

						//		left-b											right-b
						if (( (node.x > srcBox.x - 30 && node.x < srcBox.x) || (node.x > srcBox.x + srcBox.width && node.x < srcBox.x + srcBox.width + 30) )
								//above target.y
							&& (node.y > srcBox.x - 30 && node.y <= src.y)) return true;

						//		left-c									right-c
						if ( ((node.x > srcBox.x && node.x < target.x) || (node.x > target.x && node.x < srcBox.x + srcBox.width))
							&& node.y < src.y && node.y >= srcBox.y - 30) return true;

						return false;
					}

				}

				if (src.dir == 'l') {
					//if target in zone A(includes box bound)
					if (target.x <= src.x) {
						if (node.y != src.y) {
							if (target.x != src.x && node.x == src.x) return true;
						}
						return false;
					}

					//if target in zone B(includes box bounds)
					if ((target.y <= srcBox.y || target.y >= srcBox.y + srcBox.height) && (target.x >= src.x && target.x < srcBox.x + srcBox.width + 30)) {
						//exclude zone a's nodes
						//	  top-a										 	bottom-a
						if (( (node.y < src.y && node.y > srcBox.y - 30) || (node.y > src.y && node.y < srcBox.y + srcBox.height + 30) )
								//topbound-top
							&& (node.x <= src.x && node.x > src.x - 30)) return true;

						//	top-b												//bottom-b
						if (( (node.y > srcBox.y - 30 && node.y < srcBox.y) || (node.y > srcBox.y + srcBox.height && node.y < srcBox.y + srcBox.height + 30) )
								//above target.y
							&& (node.x < target.x && node.x >= src.x)) return true;

						return false;
					}

					//if target is zone C(include bound)
					if (target.x <= src.x + srcBox.width + 30) {
						//exclude zone a's nodes
						//	  top-a										 	bottom-a
						if (( (node.y < src.y && node.y > srcBox.y - 30) || (node.y > src.y && node.y < srcBox.y + srcBox.height + 30) )
								//topbound-top
							&& (node.x <= src.x && node.x > src.x - 30)) return true;

						//	top-b												//bottom-b
						if (( (node.y > srcBox.y - 30 && node.y < srcBox.y) || (node.y > srcBox.y + srcBox.height && node.y < srcBox.y + srcBox.height + 30) )
								//above target.y
							&& (node.x < src.x + srcBox.width + 30 && node.x >= src.x)) return true;

						//		top-c										bottom-c
						if ( ((node.y > srcBox.y && node.y < target.y) || (node.y > target.y && node.y < srcBox.y + srcBox.height))
							&& node.x <= src.x + srcBox.width + 30 && node.x > src.x + srcBox.width) return true;

						return false;
					}

				}

				//TODO
				if (src.dir == 'r') {
					//if target in zone A(includes box bound)
					if (target.x >= src.x) {
						if (node.y != src.y) {
							if (target.x != src.x && node.x == src.x) return true;
						}
						return false;
					}

					//if target in zone B(includes box bounds)
					if ((target.y <= srcBox.y || target.y >= srcBox.y + srcBox.height) && (target.x <= src.x && target.x > srcBox.x - 30)) {
						//exclude zone a's nodes
						//	  top-a										 	bottom-a
						if (( (node.y < src.y && node.y > srcBox.y - 30) || (node.y > src.y && node.y < srcBox.y + srcBox.height + 30) )
								//topbound-top
							&& (node.x >= src.x && node.x < src.x + 30)) return true;

						//	top-b												//bottom-b
						if (( (node.y > srcBox.y - 30 && node.y < srcBox.y) || (node.y > srcBox.y + srcBox.height && node.y < srcBox.y + srcBox.height + 30) )
								//above target.y
							&& (node.x > target.x && node.x <= src.x)) return true;

						return false;
					}

					//if target is zone C(include bound)
					if (target.x <= src.x) {
						//exclude zone a's nodes
						//	  top-a										 	bottom-a
						if (( (node.y < src.y && node.y > srcBox.y - 30) || (node.y > src.y && node.y < srcBox.y + srcBox.height + 30) )
								//topbound-top
							&& (node.x >= src.x && node.x < src.x + 30)) return true;

						//	top-b												//bottom-b
						if (( (node.y > srcBox.y - 30 && node.y < srcBox.y) || (node.y > srcBox.y + srcBox.height && node.y < srcBox.y + srcBox.height + 30) )
								//above target.y
							&& (node.x > srcBox.x - 30 && node.x <= src.x)) return true;

						//		top-c										bottom-c
						if ( ((node.y > srcBox.y && node.y < target.y) || (node.y > target.y && node.y < srcBox.y + srcBox.height))
							&& node.x <= srcBox.x && node.x > srcBox.x - 30) return true;

						return false;
					}

				}

				return false;

			}

			//outbox-|
			if (isNodeInBox(node, srcOutBox)) {
				//check if in outgoing stub

				if (src.dir == 't' && node.x == src.x && node.y < srcBox.y) {
					//⬆
					return false;
				}

				if (src.dir == 'b' && node.x == src.x && node.y > src.y) {
					//⬇
					return false;
				}

				if (src.dir == 'r' && node.y == src.y && node.x > src.x) {
					//➡
					return false;
				}

				if (src.dir == 'l' && node.y == src.y && node.x < src.x) {
					//⬅
					return false;
				}

				return true;
			}

			if (!targetBox) {
				return false;
			}

			//if has targetBox
			if (target.dir == 't' && isNodeInBox(node, targetOutBox)) {
				if (node.y >= target.y - 30 && node.y <= target.y && node.x == target.x) return false;
				return true
			}
			if (target.dir == 'b' && isNodeInBox(node, targetOutBox)) {
				if (node.y >= target.y && node.y <= target.y + 30 && node.x == target.x) return false;
				return true
			}
			if (target.dir == 'l' && isNodeInBox(node, targetOutBox)) {
				if (node.x >= target.x - 30 && node.x <= target.x && node.y == target.y) return false;
				return true
			}
			if (target.dir == 'r' && isNodeInBox(node, targetOutBox)) {
				if (node.x >= target.x && node.x <= target.x + 30 && node.y == target.y) return false;
				return true
			}

			return false;
		}

		openList.add = function(node) {
			if (closeMap.hasOwnProperty(node.key) || isNodeInvalid(node)) return this; //TODO (or is invalid)
			if (this.openMap.hasOwnProperty(node.key)) {
				//check g!
				var tg = currentNode.g + Math.abs(node.x - currentNode.x) + Math.abs(node.y - currentNode.y);
				//if (tg == node.g && node.h < currentNode.h) console.log('=', currentNode, node);
				if (tg < node.g) {
					//change node's parent 2 currentnode
					node.parent = currentNode;
					node.refresh();
					this.sortByMinF();
				}

				return this;
			}

			this.openMap[node.key] = node;

			var idx = this.length;
			$.each(this, function(i, o) {
				if (o.f > node.f) {
					idx = i;return false;
				}
			});
			this.splice(idx, 0, node);
			return this;
		}

		var srcNode = getNode(src.x, src.y);
		var currentNode = srcNode;
		//put srcNode into closeList first!
		closeMap[srcNode.key] = srcNode;

		var i = 0;
		var targetPathNode;
		while (true) {
			//put 4 nodes into openList
			var xStep = Math.min(step, Math.abs(target.x - currentNode.x));
			var yStep = Math.min(step, Math.abs(target.y - currentNode.y));

			xStep = Math.max(1, xStep);
			yStep = Math.max(1, yStep);

			var nextNode;

			if (src.dir == 't' || src.dir == 'b') {
				nextNode = currentNode.nextNode(xStep, 0);//right
				openList.add(nextNode);
				nextNode = currentNode.nextNode(-xStep, 0);//left
				openList.add(nextNode);

				nextNode = currentNode.nextNode(0, yStep);//bottom
				openList.add(nextNode);
				nextNode = currentNode.nextNode(0, -yStep);//top
				openList.add(nextNode);
			} else {
				nextNode = currentNode.nextNode(0, yStep);//bottom
				openList.add(nextNode);
				nextNode = currentNode.nextNode(0, -yStep);//top
				openList.add(nextNode);

				nextNode = currentNode.nextNode(xStep, 0);//right
				openList.add(nextNode);
				nextNode = currentNode.nextNode(-xStep, 0);//left
				openList.add(nextNode);
			}

			var minFNode = openList.shift();
			if (minFNode == null) {
				console.log('path not found!');
				break;
			}

			if (minFNode.x == target.x && minFNode.y == target.y) {
				//target found!
				targetPathNode = minFNode;
				break;
			}

			closeMap[minFNode.key] = minFNode;
			//remove minfnode from openlist
			delete openList.openMap[minFNode.key];
			currentNode = minFNode;

			i++;
			if (i >= 10000) break;//warning!
		}

		console.log((new Date().getTime() - startTime) + 'ms', i + '-times');

		//--------------1111111----------------------
		//if (this.testset) this.testset.remove();
		//var paper = this.view.set.paper;
		//this.testset = paper.set();
		//for (var key in closeMap) {
		//	var n = closeMap[key];
		//	this.testset.push(paper.circle(n.x, n.y, 2).attr('fill', 'green').attr('stroke', 'transparent'));
		//}
		//for (var key in openList.openMap) {
		//	var n = openList.openMap[key];
		//	this.testset.push(paper.circle(n.x, n.y, 2).attr('fill', 'red').attr('stroke', 'transparent'));
		//}

		//TODO

		var nodes = [];
		if (targetPathNode) {
			var p = targetPathNode;
			while (p) {
				nodes.unshift(p);
				p = p.parent;
			}
		}

		var patharr = [];
		this.reducePaths(nodes).filter(function(node) {
			patharr.push('L', node.x, node.y);
		});
		if (patharr.length > 0) patharr[0] = 'M';
		console.log(patharr);

		var lll = patharr.length;
		var arrow = [];
		if (lll >= 6) {
			var lastNode = {
				x : patharr[lll - 2],
				y : patharr[lll - 1]
			};
			arrow.push('M', lastNode.x, lastNode.y);
			var secLastNode = {
				x : patharr[lll - 5],
				y : patharr[lll - 4]
			};
			if (lastNode.x == secLastNode.x) {//tb
				if (lastNode.y < secLastNode.y) {
					//t
					arrow.push('L', lastNode.x + 4, lastNode.y + 10, 'L', lastNode.x - 4, lastNode.y + 10, 'Z');
				} else {
					//b
					arrow.push('L', lastNode.x + 4, lastNode.y - 10, 'L', lastNode.x - 4, lastNode.y - 10, 'Z');
				}
			}

			if (lastNode.y == secLastNode.y) {
				if (lastNode.x < secLastNode.x) {
					//l
					arrow.push('L', lastNode.x + 10, lastNode.y + 4, 'L', lastNode.x + 10, lastNode.y - 4, 'Z');
				} else {
					//r
					arrow.push('L', lastNode.x - 10, lastNode.y + 4, 'L', lastNode.x - 10, lastNode.y - 4, 'Z');
				}
			}
		}

		var paper = this.view.set.paper;
		var s = paper.set();
		s.push(paper.path(patharr.join(',')).attr('stroke-width', 2).attr('cursor', 'hand')
			.data('target', target).data('src', src));
		s.push(paper.path(arrow.join(',')).attr('fill', 'black').attr('cursor', 'crosshair'));

		return s;

	},
	reducePaths : function(arr) {
		var key = null;
		var lastNode = null;
		var res = [];
		res.replaceLast = function(o) {
			this[this.length - 1] = o;
		}

		arr.filter(function(node) {
			if (lastNode) {
				if (!key) {
					//try 2 define key?
					if (node.x == lastNode.x) key = 'x';
					if (node.y == lastNode.y) key = 'y';

					res.push(node);
				} else {
					if (node[key] == lastNode[key]) {
						res.replaceLast(node);
					} else {
						key = (key == 'x') ? 'y' : 'x';
						res.push(node);
					}
				}
			} else {
				res.push(node);
			}
			lastNode = node;
		});

		return res;
	},
	buildDelegate : function() {
		var view = this.view;
		var paper = this.view.set.paper;

		this.set = paper.set();

		function bindLink(linkpoint) {

			var targetlinkendHighlight = null;

			linkpoint.drag(function(dx, dy, x, y, e) {
				if (this.data('currentlinker')) this.data('currentlinker').remove();

				targetlinkendHighlight ? targetlinkendHighlight.remove() : null;

				var targetView = view.ownerCt.detectViewsByRect({x : this.ox + dx - 10, y : this.oy + dy - 10, width: 20, height: 20}, 1, function(v) { return v.linkDelegate != null;})[0];

				var targetx = this.ox + dx;
				var targety = this.oy + dy;
				var tdir = null;

				var targetLinkEnd;
				if (targetView) {
					//TODO TRY 2 LINK2 ANOTHER VIEWS' LINKEND
					targetView.linkDelegate.set.show();
					Ext.each(targetView.linkDelegate.set, function(linkend) {
						if (linkend == linkpoint) return;
						var bx = linkend.getBBox();
						var centerX = bx.x + bx.width / 2;
						var centerY = bx.y + bx.height / 2;
						if (Math.abs(targetx - centerX) <= 15 && Math.abs(targety - centerY) <= 15) {
							targetLinkEnd = linkend;
							return false;
						}
					});

					if (targetLinkEnd) {
						tdir = targetLinkEnd.data('spec');
						var bx = targetLinkEnd.getBBox();
						targetx = bx.x + bx.width / 2;
						targety = bx.y + bx.height / 2;

						targetlinkendHighlight = targetLinkEnd.paper.
							circle(targetLinkEnd.attr('cx'), targetLinkEnd.attr('cy'), 10).attr({fill : 'red', stroke : 'red', opacity:.5});
						targetLinkEnd.toFront();
					}
				}

				//default draw a link that is no target linkend!
				var path = me.drawLinker({
					x : this.ox,
					y : this.oy,
					dir : linkpoint.data('spec'),
					linkend : this
				}, {
					x : targetx,
					y : targety,
					dir : tdir,
					linkend : targetLinkEnd
				});

				this.toFront();
				this.data('currentlinker', path);
			}, function(x, y ,e) {
				this.ox = this.attr('cx');
				this.oy = this.attr('cy');
			}, function(e) {
				this.removeData('currentlinker');
				targetlinkendHighlight ? targetlinkendHighlight.remove() : null;
			});
		}

		if (this.linkends.indexOf('t') != -1) {
			var t = this.produceLinkend('t');
			this.set.push(t);

			bindLink(t, 't');
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

		view.on('hover', function() {
			me.set.toFront().show();
		});
		view.on('unhover', function() {
			if (!view.selected) me.set.hide();
		});

		this.set.hide();

	},
	getEventListeners : function() {
		var me = this;
		return {
			zindexed : function() {
				if (me.view.selected) {
					new Ext.util.DelayedTask(function(){
						me.set.toFront();
					}).delay(100);
				}
			},
			selected : function() {
				me.set.toFront().show();
			},
			deselected : function() {
				me.set.hide();
			},
			layout : function() {
				me.layoutElements();
				me.redrawInOutLinkers();
			},
			dragstart : function() {
				me.set.toFront().show();
			}
		};
	},
	doDestroy : function() {
		this.set.forEach(function(linkend) {
			linkend.data('inlinkers').filter(function(linker) {
				linker ? linker.remove() : null;
			});
			linkend.data('outlinkers').filter(function(linker) {
				linker ? linker.remove() : null;
			});
		});
		this.set.remove();
	},
	layoutElements : function() {

		var box = this.view.frame;
		this.set.forEach(function(ele) {
			if (ele.data('type') != 'linkend') return;
			switch(ele.data('spec')) {
				case 't':
					ele.attr({cx: box.x + box.width / 2, cy: box.y});
					break;
				case 'r':
					ele.attr({cx: box.x + box.width, cy: box.y + box.height / 2});
					break;
				case 'b':
					ele.attr({cx: box.x + box.width / 2, cy: box.y + box.height});
					break;
				case 'l':
					ele.attr({cx: box.x, cy: box.y + box.height / 2});
					break;
			}
		});

	},
	produceLinkend : function(spec) {
		var paper = this.view.set.paper;

		return paper.circle(0, 0, 3)
			.data('type', 'linkend')
			.data('spec', spec).data('ownerCt', this)
			.data('outlinkers', []).data('inlinkers', [])
			.attr({fill : 'white', cursor : 'crosshair', stroke: '#883333'}).click(function(e) { e.stopPropagation();});
	}
});

Ext.define('GraphicDesigner.LabelDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdlabeldelegate',
	editable : true,
	textElement : null,
	text : '',
	'font-size' : '16px',
	//override it!
	getTransform : Ext.emptyFn,
	getTextRect : function() {
		return {
			x : 10,
			y : 10,
			width : 20,
			height : 20
		};
	},
	textHolder : null,
	buildDelegate : function() {
		var me = this;

		this.textElement = this.view.set.paper.text(0, 0, '_')
			.attr({
				'font-size' : this['font-size'],
				'font-family' : 'STHeitiSC-Light, Helvetica, SimSun, Microsoft YaHei'
			}).drag(function(dx, dy, x, y, e) {
				me.view.fireEvent('dragmoving', dx, dy, x, y, e);
			}, function(x, y ,e) {
				e.stopPropagation();
				me.view.fireEvent('dragstart', x, y, e);
				me.view.ownerCt.fireEvent('viewclicked', me.view);
			}, function(e) {
				me.view.fireEvent('dragend', e);
			}).hover(function() {
				me.view.fireEvent('hover');
			}, function() {
				me.view.fireEvent('unhover');
			}).click(function(e) { e.stopPropagation();});

		this.layoutTextElement();
		this.setText(this.text);

		//this.view.set.push(this.textElement);

		this.textHolder = $('<input type="text" />').hide();
		$(this.view.set.paper.canvas).after(this.textHolder);
		this.textHolder.css({
			position : 'absolute',
			'background-color' : 'transparent',
			'border' : '2px solid #F7DDAA',
			'border-radius' : 1,
			'text-align' : 'center'
		}).blur(function() {
			me.endEdit();
		}).keydown(function(e) {
			if (e.keyCode == 13 || e.keyCode == 9) me.endEdit();
			if (e.keyCode == 9) me.tabNext();
		});

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
			keyup : function(e) {
				if (!this.selected || this.editing) return;

				if (me.editable && e.keyCode == 13) {
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

				me.layoutTextElement();
			}
		};
	},
	doDestroy : function() {
		this.textElement.remove();
		this.textHolder.remove();
	},
	//private
	getTransformStr : function() {
		var o = this.getTransform();
		if (!o) return null;

		return 'r' + o.angle + (o.cx ? ',' + o.cx : '') + (o.cy ? ',' + o.cy : '');
	},
	layoutTextElement : function() {
		var rect = this.getTextRect();
		this.textElement.attr({
			x : rect.x + rect.width / 2,
			y : rect.y + rect.height / 2,
			transform : this.getTransformStr()
		});
	},
	startEdit : function() {
		if (!this.editable) return;
		this.textElement.hide();

		var rect = this.getTextRect();
		var position = $(this.view.ownerCt.paper.canvas).position();
		this.textHolder.css(this.textElement.attrs).css({
			left : rect.x + position.left,
			top : rect.y + position.top,
			width : rect.width,// $(this.textElement.node).width()),
			height : rect.height//, $(this.textElement.node).height())
		}).show().val(this.text).select();

		//var o = this.getTransform();
		//if (o) {
		//	this.textHolder.rotate({
		//		angle : o.angle,
		//		center : [o.cx, o.cy]
		//	});
		//}

		this.view.editing = true;
	},
	endEdit : function() {
		if (!this.view.editing) return;
		this.setText(this.textHolder.hide().val());

		var me = this;
		setTimeout(function() {
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

Ext.define('GraphicDesigner.MultilineLabelDelegate', {
	extend : 'GraphicDesigner.LabelDelegate',
	xtype : 'gdmultilinelabeldelegate',
	buildDelegate : function() {
		var me = this;

		this.textElement = this.view.set.paper.text(0, 0, '_')
			.attr({
				'font-size' : this['font-size']
			}).drag(function(dx, dy, x, y, e) {
				me.view.fireEvent('dragmoving', dx, dy, x, y, e);
			}, function(x, y ,e) {
				me.view.fireEvent('dragstart', x, y, e);
				me.view.ownerCt.fireEvent('viewclicked', me.view);
			}, function(e) {
				me.view.fireEvent('dragend', e);
			}).hover(function() {
				me.view.fireEvent('hover');
			}, function() {
				me.view.fireEvent('unhover');
			}).click(function(e) { e.stopPropagation();});

		this.layoutTextElement();
		this.setText(this.text);

		//this.view.set.push(this.textElement);

		this.textHolder = $('<textarea style="resize:none;outline:none;" />').hide();
		$(this.view.set.paper.canvas).after(this.textHolder);
		this.textHolder.css({
			position : 'absolute',
			'background-color' : 'transparent',
			'border' : '2px solid #F7DDAA',
			'border-radius' : 1,
			'text-align' : 'center'
		}).blur(function() {
			me.endEdit();
		}).keydown(function(e) {
			if (e.keyCode == 13 && e.shiftKey) me.endEdit();
			if (e.keyCode == 9) me.tabNext();
		});

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
					new Ext.util.DelayedTask(function(){
						me.set.toFront();
					}).delay(100);
				}
			},
			selected : function() {
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
		}, function(e) {
			delete this.obox;
			me.view.fireEvent('resizeend');

			GraphicDesigner.suspendClick();
		});

		return resizer;
	}
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
			it.click(function() {
				item.handler ? item.handler(me.view) : null;
				me.layoutElements();
			});
		});

		$(paper.canvas).after(this.toolbox);
		$(paper.canvas).after(this.tooltip);

		var disappearTask = new Ext.util.DelayedTask(function(){
			me.toolbox.hide();
		});

		this.view.on('hover', function() {
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
		var position = $(this.view.set.paper.canvas).position();
		this.tooltip.css({
			left : frame.x + frame.width + position.left + 3,
			top : frame.y + position.top - 20
		});
		this.toolbox.css({
			left : frame.x + frame.width + position.left + 3,
			top : frame.y + position.top
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

				if (Math.abs(frame.x + frame.x + frame.width - cp.paperWidth) <= 10) {
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
						height : 19999998
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//check bound docker first!
						var found = false;
						//check center dockers
						var value = frame.x + frame.width / 2;
						Ext.each(v.dockDelegate.xCenterDockers, function(docker) {
							var targetValue = docker.getValue();
							if (Math.abs(targetValue - value) <= 5) {
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
							if (Math.abs(targetValue - value) <= 5) {
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
				if (Math.abs(frame.y + frame.y + frame.height - cp.paperHeight) <= 10) {
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
						width : 19999998,
						height : frame.height + 12
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//check bound docker first!
						var found = false;
						//check center dockers
						var value = frame.y + frame.height / 2;
						Ext.each(v.dockDelegate.yCenterDockers, function(docker) {
							var targetValue = docker.getValue();
							if (Math.abs(targetValue - value) <= 5) {
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
							if (Math.abs(targetValue - value) <= 5) {
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

				if (Math.abs(frame.x + frame.x + frame.width - cp.paperWidth) <= 10) {
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
						x : frame.x - 6,
						y : -9999999,
						width : frame.width + 12,
						height : 19999998
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//check bound docker first!
						var found = false;
						//check center dockers
						Ext.each(v.dockDelegate.xCenterDockers, function(toDocker) {
							var toValue = toDocker.getValue();
							Ext.each(me.xCenterDockers, function(docker) {
								var value = docker.getValue();
								if (Math.abs(value - toValue) <= 5) {
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
									if (Math.abs(value - toValue) <= 5) {
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

				if (Math.abs(frame.y + frame.y + frame.height - cp.paperHeight) <= 10) {
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
						y : frame.y - 6,
						width : 19999998,
						height : frame.height + 12
					}, null, function(v) { return v != thisview && v.dockDelegate != null;}), function(v) {
						//detect y 工
						var found = false;
						//check center dockers
						Ext.each(v.dockDelegate.yCenterDockers, function(toDocker) {
							var toValue = toDocker.getValue();
							Ext.each(me.yCenterDockers, function(docker) {
								var value = docker.getValue();
								if (Math.abs(value - toValue) <= 5) {
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
									if (Math.abs(value - toValue) <= 5) {
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

Ext.define('GraphicDesigner.RotateDelegate', {
	extend : 'GraphicDesigner.ViewDelegate',
	xtype : 'gdrotatedelegate',
	buildDelegate : function() {
	},
	getEventListeners : function() {},
	doDestroy : function() {}
});

//-----------------------------------selmodel------------------------------------
Ext.define('GraphicDesigner.SelectionModel', {
	extend : 'Ext.Component',
	xtype : 'gdselmodel',
	requires : ['GraphicDesigner.CanvasPanel'],
	//private
	fx : [],
	pathSels : [],
	//private
	pathwalkers : [],
	selectPath : function(pathset) {
		this.pathSels.push(pathset);
		this.fx.push(pathset.glow({
			width : 2
		}));

		//var me = this;
		//function producePathWalker(path) {
		//	var p = path.paper.path(path.getSubpath(0, 3)).attr({
		//		stroke : 'white',
		//		'stroke-width' : 3
		//	});
		//
		//	var length = path.getTotalLength();
		//	p.start = function() {
		//		this.runByStart(0);
		//	};
		//
		//	p.runByStart = function(start) {
		//		if (start >= length) {
		//			this.stop().remove();
		//			me.pathwalkers.remove(this);
		//			return;
		//		}
		//		var ts = this;
		//		this.animate({
		//			path : pathset[0].getSubpath(start, start + 3)
		//		}, 100, null, function() {
		//			start += 10;
		//			ts.runByStart(start);
		//		});
		//	}
		//
		//	return p;
		//}
		//
		//this.intCode = setInterval(function() {
		//	var p = producePathWalker(pathset[0]);
		//	me.pathwalkers.push(p);
		//	p.start();
		//}, 500);

	},
	clearPathSels : function() {
		this.fx.filter(function(f) {f.remove();});
		this.fx = [];
		this.pathSels = [];
		//window.clearInterval(this.intCode);
		//this.pathwalkers.filter(function(o) {if (o) o.stop().remove();});
		//this.pathwalkers = [];
	},
	removePathSels : function() {
		this.pathSels.filter(function(a) {a.remove();});
		this.clearPathSels();
	},
	destroy : function() {
		$(document).off('click', this.documentClickListener);
	},
	build : function(canvasPanel) {
		this.ownerCt = canvasPanel;
		var me = this;
		//add events...

		this.documentClickListener = function() {
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
			me.clearPathSels();
			canvasPanel.views.filter(function(v) {
				if (v != view) {
					if (v.selected) {
						v.selected = false;
						v.fireEvent('deselected');
					}
				} else {
					if (!v.selected) {
						v.selected = true;
						v.fireEvent('selected');
					}
				}
			});
		});

	},
	clearSelection : function() {
		this.clearPathSels();
		this.ownerCt.views.filter(function(view) {
			//hide em

			if (view.selected) {
				view.selected = false;
				view.fireEvent('deselected');
			}
		});
	},
	getSelections : function() {
		var arr = [];
		this.ownerCt.views.filter(function(view) {
			if (view.selected) arr.push(view);
		});

		return arr.concat(this.pathSels);
	}
});

//-------------------------------view template panel-----------------------------------------
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
				width : 80,
				height : 80,
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
							if (e.button != 0) return;
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

//==================attributes inspector================================
Ext.define('GraphicDesigner.AttributesInspectorPanel', {
	extend : 'Ext.toolbar.Toolbar',
	xtype : 'gdattributesinspectorpanel',
	cls : 'gd-attr-inspector',
	shadow : false,
	defaults : {
		width : 30,
		height : 30
	},
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
	updateByCanvas : function() {},//...TODO
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

		if (this.getComponent(0)) {
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
				columnWidth : 1,
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
		try {
			var svg = $(this.ownerCt.owner.getCanvas());
			var img = $('<image src="' + this.ownerCt.owner.getDataUrl() + '" />');
			img.width(svg.width()).height(svg.height());
			$(this.el.dom).append(img);

			var cvs = $(this.infoPanel.el.dom).find('canvas');
			cvs.attr('width', svg.width()).attr('height', svg.height());

			var ctx = cvs[0].getContext('2d');
			ctx.drawImage(img[0], 0, 0, svg.width(), svg.height());

			img.remove();
		} catch(e) {}
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
						break;
					case 'y' :
						f.setValue(view.frame.y);
						break;
					case 'w' :
						f.setValue(view.frame.width);
						break;
					case 'h' :
						f.setValue(view.frame.height);
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
			width : 200,
			height : 120
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
					xtype : 'numberfield',
					step : 5,
					scope : 'x',
					value : 0,
					width : 65,
					listeners : {
						change : function(f, v) {
							me.view.frame.x = this.getValue();
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('keymoveend');
						}
					}
				}, {
					xtype : 'label',
					html : this.labels[2],
					style : 'width:20px;margin-left:10px;'
				}, {
					xtype : 'numberfield',
					step : 5,
					scope : 'w',
					value : 20,
					width : 65,
					listeners : {
						change : function(f, v) {
							var ct = me.ownerCt.owner;
							me.view.frame.width = this.getValue();
							if (ct.constraint) {
								me.view.frame.width = Math.min(me.view.frame.width, ct.paperWidth - ct.constraintPadding - ct.constraintPadding - me.view.frame.x);
							}
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('resizeend');
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
					xtype : 'numberfield',
					step : 5,
					scope : 'y',
					value : 0,
					width : 65,
					listeners : {
						change : function(f, v) {
							me.view.frame.y = this.getValue();
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('keymoveend');
						}
					}
				}, {
					xtype : 'label',
					html : this.labels[3],
					style : 'width:20px;margin-left:10px;'
				}, {
					xtype : 'numberfield',
					step : 5,
					scope : 'h',
					value : 20,
					width : 65,
					listeners : {
						change : function(f, v) {
							var ct = me.ownerCt.owner;
							me.view.frame.height = this.getValue();
							if (ct.constraint) {
								me.view.frame.height = Math.min(me.view.frame.height, ct.paperHeight - ct.constraintPadding - ct.constraintPadding - me.view.frame.y);
							}
							me.view.layoutInRect(me.view.frame);
							me.view.fireEvent('resizeend');
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


