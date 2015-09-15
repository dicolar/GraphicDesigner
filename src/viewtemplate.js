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
