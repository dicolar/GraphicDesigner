String.prototype.replaceAll = function(pattern, target) {
	var s = this;
	return s.replace(new RegExp(pattern, 'gm'), target);
};

if(!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, start) {
		for (var i = (start || 0), j = this.length; i < j; i++) {
			if (this[i] === obj) { return i; }
		}
		return -1;
	}
}

Ext.util.Format.fileSize = (function(){
	var byteLimit = 1024,
		kbLimit = 1048576,
		mbLimit = 1073741824;

	return function(size) {
		var out;
		if (size < byteLimit) {
			out = !size ? '0B'  : size + 'B';
		} else if (size < kbLimit) {
			out = (Math.round(((size*10) / byteLimit))/10) + 'KB';
		} else if (size < mbLimit) {
			out = (Math.round(((size*10) / kbLimit))/10) + 'MB';
		} else {
			out = (Math.round(((size*10) / mbLimit))/10) + 'GB';
		}
		return out;
	};
})();

Ext.define('ExtThemeNeptune.resizer.Splitter', {
	override : 'Ext.resizer.Splitter',
	size : 5
});

Ext.define('Ext.form.field.PlaceHolder', {
	extend : 'Ext.form.field.Base',
	alias : 'widget.placeholderfield',
	xtype : 'placeholderfield',
	fieldSubTpl: []
});

Ext.define('Ext.window.YesNoWindow', {
	extend : 'Ext.window.Window',
	alias : 'widget.yesnowindow',
	xtype : 'yesnowindow',
	preButtons : [],
	buttons : [],
	noText : null,
	showNoButton : true,
	yesText : null,
	showYesButton : true,
	onOk : function() {},
	onClose : function() {},
	initComponent : function() {
		var me = this;
		
		var buttons = [{
			text : this.noText,
			hidden : !this.showNoButton,
			btnType : 'common',
			listeners : {
				afterRender : function() {
					me.noButton = this;
				}
			},
			handler : function() {
				var flag = me.onClose();
				
				if (flag == false) {
					return;
				}
				me.close();
			}
		}, {
			text : this.yesText,
			hidden : !this.showYesButton,
			btnType : 'info',
			handler : function() {
				me.onOk();
			},
			listeners : {
				afterRender : function() {
					me.yesButton = this;
				}
			}
		}];
		
		if (this.preButtons) {
			for (var i = this.preButtons.length - 1; i >= 0; i--) {
				buttons.unshift(this.preButtons[i]);
			}
		}
		Ext.each(this.buttons, function(btn) {
			buttons.push(btn);
		});
		this.buttons = buttons;
		
		this.callParent();
	}
});

Ext.override(Ext.form.FieldContainer, {
	afterRender : function() {
		var arr = this.el.query('td.x-form-item-body');
		if (arr.length >= 1) {
			new Ext.Element(arr[0]).setStyle('padding', 0);
		}
		
		this.callParent();
	}
});

Ext.override(Ext.window.Window, {
	constrain : true,
	shadow : false,
	easing : null,
	ghost : false,
	getButtons : function() {
		var its = this.getDockedItems('toolbar[dock="bottom"]');
		if (its.length == 0) return [];
		return its[0].items.items;
	},
	beforeShow : function() {
		var me = this;

		//me.el.setX(-10000);
		me.el.setOpacity(0);

	},
	afterShow : function() {

		var me = this;
		me.callParent(arguments);
		//me.el.alignTo(document.body, 't-t', [0, -me.getHeight()]);
		me.el.addCls('x-window-popup');
		this.el.animate({
			from : {
				opacity : 0
				//y : me.el.getY()
			},
			to : {
				opacity : 1
				//y : me.y
			},
			duration : 300,
			easing : this.easing,
			dynamic : true,
			callback : function() {
				me.el.removeCls('x-window-popup');
				me.doLayout();
			}
		});

	},
	hide : function(e, b, c) {
		var me = this;
		var d = this, a;
		
		me.el.addCls('x-window-popin');
		me.el.animate({
			to : {
				opacity : 0
				//y : -me.getHeight()//Ext.isIE ? Math.max(document.documentElement.clientHeight, document.body.clientHeight) : window.innerHeight
			},
			duration : 300,
			callback : function() {
				me.el.removeCls('x-window-popin');
				if (d.pendingShow) {
					delete d.pendingShow
				}
				if (!(d.rendered && !d.isVisible())) {
					a = (d.fireEvent("beforehide", d) !== false);
					if (d.hierarchicallyHidden || a) {
						d.hidden = true;
						d.getHierarchyState().hidden = true;
						if (d.rendered) {
							d.onHide.apply(d, arguments)
						}
					}
				}
			}
		});

		return d;
	},
	doClose : function() {
		var me = this;
		
		me.el.addCls('x-window-popin');
		me.el.animate({
			to : {
				//y : -me.getHeight(),
				opacity : 0
			},
			duration : 300,
			easing : this.easing,
			callback : function() {
				me.el.removeCls('x-window-popin');
				// Being called as callback after going through the hide call below
				me.fireEvent('close', me);
				if (me.closeAction == 'destroy') {
					me.destroy();
				} else {
					me.hide();
				}

			}
		});

	}
});

Ext.override(Ext.panel.Panel, {
	headerCls : null,
	afterRender : function() {
		if (this.headerCls) {
			Ext.fly(this.el.query('.x-panel-header-default')[0]).addCls(this.headerCls);
			Ext.fly(this.el.query('.x-header-text')[0]).addCls(this.headerCls + '-text');
		}

		this.callParent();
		if (this.handleHeader) {
			var header = this.getHeader();
			if (header) {
				this.handleHeader(header);
			}
		}

	},
	handleHeader : null,//header in
	setHTML : function(html) {
		this.getInnerEl().setHTML(html);
		this.doLayout();
	},
	getInnerEl : function() {
		return this.body.child('span').child('div');
	}
});

Ext.override(Ext.panel.Table, {
	contextDetect : false,
	getContextDetectScope : function() {
		return this;
	},
	afterRender : function() {
		var me = this;
		
		if (this.contextDetect) {
			//bind dblclick event!
			var dblclickBtn;
			Ext.each(this.dockedItems.items, function(bar) {
				if (dblclickBtn) {
					return;
				}
				Ext.each(bar.items.items, function(item) {
					if (dblclickBtn) {
						return;
					}
					if (!item.dynamic || !item.handler || !item.defaultDblClickHandler) {
						return;
					}

					dblclickBtn = item;
				});

			});
			if (dblclickBtn) {
				this.on('itemdblclick', function() {
					if (dblclickBtn.isDisabled()) {
						return;
					}
					
					dblclickBtn.handler.apply(dblclickBtn, [dblclickBtn, Ext.EventObject]);
				});
			}

			function refreshDynamic(grid, records) {
				var scope = me.getContextDetectScope();
				if (!scope || !scope.query) scope = this;
				Ext.each(scope.query('*[dynamic][setDisabled]'), function(item) {
					if (item.getContextDetectScope && item.getContextDetectScope() != me) return;
					
					if (records.length == 0) {
						item.setDisabled(true);
						return;
					}
					
					item.selections = records;

					if (records.length == 1) {
						item.setDisabled((typeof item.dynamicIndicator == 'function' && item.dynamicIndicator(records) == false));
						return;
					}
					
					// >= 2
					item.setDisabled(typeof item.dynamicIndicator == 'function' && item.dynamicIndicator(records) == false || item.dynamic == 'singleselect');
					
				});
			}

			this.on('selectionchange', function(selmodel, selected, eOpts) {
				refreshDynamic(me, selected);
			});
			refreshDynamic(this, []);
		}
		
		this.callParent();
	}
});


Ext.override(Ext.view.View, {
	handleRowElements : null,//function(record, element) {},
	afterRender : function() {
		var me = this;

		if (this.handleRowElements) {
			this.on('itemupdate', function(rec) {
				if (!rec.raw) return;
				me.handleRowElements(rec, me.getNode(rec));
			});

			this.on('refresh', function() {
				me.store.each(function(rec) {
					if (!rec.raw) return;
					me.handleRowElements(rec, me.getNode(rec));
				});
			});

			this.on('itemadd', function(records) {
				records.filter(function(rec) {
					if (!rec.raw) return;
					me.handleRowElements(rec, me.getNode(rec));
				});
			});

			this.fireEvent('refresh');
		}

		this.callParent();
	}
});

Ext.override(Ext.tree.Panel, {
	handleRowElements : null,//function(record, element) {},
	afterRender : function() {
		var me = this;

		if (this.handleRowElements) {
			var view = this.getView();
			view.on('afteritemexpand', function(node) {
				if (!node.raw) return;
				me.handleRowElements(node, view.getNode(node, true));
			});
			view.on('afteritemcollapse', function(node) {
				if (!node.raw) return;
				me.handleRowElements(node, view.getNode(node, true));
			});
			view.on('itemadd', function(nodes, index, node, eOpts) {
				Ext.each(nodes, function(node) {
					if (!node.raw) return;
					me.handleRowElements(node, view.getNode(node, true));
				});
			});

			this.on('beforeitemremove', function(tree, node) {
				var pnode = node.parentNode;
				new Ext.util.DelayedTask(function() {
					Ext.each(pnode.childNodes, function(node) {
						if (!node.raw) return;
						me.handleRowElements(node, view.getNode(node, true));
					});
				}).delay(100);
			});

			new Ext.util.DelayedTask(function(){
				me.getRootNode() ? me.getRootNode().cascadeBy(function(node) {
					if (!node.raw) return;
					me.handleRowElements(node, view.getNode(node, true));
				}) : null;
			}).delay(500);
		}

		this.callParent();
	}
});

Ext.override(Ext.grid.Panel, {
	allowBlankClickDeselect : true,
	handleRowElements : null,//function(record, node) {},
	destroyRowWidgets : function(record) {
		Ext.each(record.rowWidgets, function(o) {
			o.destroy ? o.destroy() : null;
		});
		record.rowWidgets = [];
	},
	//public
	registerRowWidgets : function(record, items) {//object or [objects]
		if (!record.rowWidgets) record.rowWidgets = [];
		if (Ext.isArray(items)) {
			record.rowWidgets = record.rowWidgets.concat(items);
		} else {
			record.rowWidgets.push(items);
		}

		this.fireEvent('rowwidgetsadd', items);
	},
	afterRender : function() {
		var me = this;

		if (this.handleRowElements) {
			var view = this.getView();
			view.on('itemupdate', function(rec) {
				if (!rec.raw) return;
				me.destroyRowWidgets(rec);
				me.handleRowElements(rec, view.getNode(rec, true));
			});

			view.on('itemremove', function(rec) {
				if (!rec.raw) return;
				me.destroyRowWidgets(rec);
			});

			view.on('refresh', function() {
				me.store.each(function(rec) {
					if (!rec.raw) return;
					me.destroyRowWidgets(rec);
					me.handleRowElements(rec, view.getNode(rec, true));
				});
			});

			view.on('itemadd', function(records) {
				records.filter(function(rec) {
					if (!rec.raw) return;
					me.destroyRowWidgets(rec);
					me.handleRowElements(rec, view.getNode(rec, true));
				});
			});

			view.fireEvent('refresh');
		}
		
		if (this.allowBlankClickDeselect) {
			var root = this.el.query('.x-grid-view')[0];

			var rootId = root.id;
			Ext.fly(root).on('click', function(e, ele, o) {
				if (ele.id == rootId) {
					//deselect all!
					try {
						me.getSelectionModel().deselectAll();
					} catch (e) {}
				}
			});
		}
		
		this.callParent();
	}
});

Ext.override(Ext.button.Button, {
	btnType : 'common',
	badge : null,
	initComponent : function() {
		
		if (!(this instanceof Ext.tab.Tab)) {
			if (this.btnType) {
				this.cls = 'special-btn btn-' + this.btnType;
				this.overCls = 'over-' + this.btnType;
				this.focusCls = 'over-' + this.btnType;
				this.pressedCls = 'pressed-' + this.btnType;
				this.textCls = 'x-btn-text-' + this.btnType;
				this.pressedTextCls = 'x-btn-pressed-text-' + this.btnType;
				this.menuActiveCls = 'menu-active-' + this.btnType;
			}

			if (this.actionBtn) {
				this.minWidth = 70;
			}
			
			if (this.closeWinBtn) {
				this.handler = function() {
					try {
						this.ownerCt.ownerCt.close();
					} catch (e) {}
				}
			}
		}

		this.callParent();
	},
	toggle: function(state, suppressEvent) {
		if (!(this instanceof Ext.tab.Tab)) {
			var me = this;
			state = state === undefined ? !me.pressed: !!state;
			if (state !== me.pressed) {
				if (me.rendered) {
					me[state ? 'addClsWithUI': 'removeClsWithUI'](me.pressedCls);
					Ext.fly(me.el.query('.x-btn-inner')[0])[state ? 'addCls' : 'removeCls'](this.pressedTextCls);
				}
				me.pressed = state;
				if (!suppressEvent) {
					me.fireEvent('toggle', me, state);
					Ext.callback(me.toggleHandler, me.scope || me, [me, state]);
				}
			}
		}
		return me;
	},
	onMouseDown: function(e) {
		if (!(this instanceof Ext.tab.Tab)) {
			var me = this;

			if (Ext.isIE) {
				me.getFocusEl().focus();
			}

			if (!me.disabled && e.button === 0) {
				Ext.button.Manager.onButtonMousedown(me, e);
				me.addClsWithUI(me.pressedCls);
				Ext.fly(this.el.query('.x-btn-inner')[0]).addCls(this.pressedTextCls);
			}
		}
	},
	onMouseUp: function(e) {
		if (!(this instanceof Ext.tab.Tab)) {
			var me = this;

			// If the external mouseup listener of the ButtonManager fires after the button has been destroyed, ignore.
			if (!me.isDestroyed && e.button === 0) {
				if (!me.pressed) {
					me.removeClsWithUI(me.pressedCls);
					Ext.fly(this.el.query('.x-btn-inner')[0]).removeCls(this.pressedTextCls);
				}
			}
		}
	},
	afterRender : function() {
		if (!(this instanceof Ext.tab.Tab)) {
			if (this.btnType) {
				if (this.pressed) {
					Ext.fly(this.el.query('.x-btn-inner')[0]).addCls(this.pressedTextCls);
				}
				
				Ext.fly(this.el.query('.x-btn-inner')[0]).addCls(this.textCls);
				
				if (Ext.isIE7 || Ext.isIE8) {
					this.el.dom.style.cssText = 'border-width:1px!important;';
					Ext.each(this.el.query('*[class^="x-frame"]'), function(ele) {
						Ext.fly(ele).setStyle('background-image', 'none');
						Ext.fly(ele).setStyle('background-color', 'transparent');
					});

				}
			}
			
			//button group
			if (this.btnPosition) {
				
				if (this.btnPosition == 'first' || this.btnPosition == 'middle') {
					this.el.setStyle('margin-right', '-1px');
					this.el.setStyle('border-top-right-radius', '0px');
					this.el.setStyle('border-bottom-right-radius', '0px');
				}
				
				if (this.btnPosition == 'middle' || this.btnPosition == 'last') {
					this.el.setStyle('border-top-left-radius', '0px');
					this.el.setStyle('border-bottom-left-radius', '0px');
				}
				
			}
		}

		this.buildBadge();
		this.setBadge(this.badge);
		this.callParent();
	},
	//private
	buildBadge : function() {
		this.badgeEl = this.el.appendChild({
			tag : 'span',
			cls : 'x-badge',
			html : this.badge
		}).hide();
	},
	setBadge : function(badge) {
		this.badge = badge;
		if (!badge) {
			this.badgeEl.hide();
		} else {
			this.badgeEl.setHTML(badge).show();
		}
	}
});

Ext.override(Ext.panel.AbstractPanel, {
	afterRender : function() {
		this.initDescBar();
		this.callParent();
	},
	//private
	initDescBar : function() {
		var me = this;

		if (this.descBar) {
			return;
		}

		if (this.description) {

			var tbar = new Ext.toolbar.Toolbar({
				style : 'padding:0px;'
			});
			this.addDocked(tbar, 'top');
			this.descBar = tbar;

			tbar.on('afterRender', function() {
				me.refreshDescription();
			});

		}

	},
	refreshDescription : function() {
		this.initDescBar();

		var me = this;
		var tpl = new Ext.XTemplate('<div class="x-panel-description-region">', '<table style="width:100%;">', '<tr>', '<tpl if="descIcon"><td style="width:1px;"><img src="{descIcon}" /></td></tpl>', '<td>{description}</td>', '</tr>', '</table>', '</div>');

		me.descBar.el.setHTML(tpl.apply(me));
	}
});

Ext.override(Ext.form.field.ComboBox, {
	//findRecordByValue //default
	triggerIcon : null,
	delayForTriggerValueChange : 0,
	afterRender : function() {
		this.callParent();

		this.on('beforeselect', function(combo, record, idx) {
			var o = combo.getValue();
			var n = record.get(this.valueField);

			if (o != n) {
				this.fireEvent('valuechange', combo, o, n);
			}
		});

		if (this.getValue()) {
			if (this.delayForTriggerValueChange) {
				var me = this;
				new Ext.util.DelayedTask(function(){
					me.fireEvent('valuechange', me, null, me.getValue());
				}).delay(this.delayForTriggerValueChange);
			} else {
				this.fireEvent('valuechange', this, null, this.getValue());
			}
		}

		if (this.triggerIcon) {
			this.triggerEl.elements[0].el.setStyle('background-image', 'url(' + this.triggerIcon + ')');
			this.triggerEl.elements[0].el.setStyle('background-position', '0px 0px');
			this.triggerEl.elements[0].el.setStyle('background-repeating', 'no-repeat');
		}

		if (this.blankSelectable && this.store && this.displayField && this.valueField && this.store.find(this.valueField, '') == -1) {

			var rec = {};
			rec[this.displayField] = '';
			rec[this.valueField] = '';

			this.store.insert(0, rec);

			this.store.on('load', function() {
				this.insert(0, rec);
			});

		}

	},
	setValue : function(v) {
		if (this.getValue() != v && !Ext.isArray(v)) {
			this.fireEvent('valuechange', this, this.getValue(), v);
		}
		this.callParent(arguments);
	},
	alignPicker: function(){
		var me = this,
			picker = me.getPicker(),
			heightAbove = me.getPosition()[1] - Ext.getBody().getScroll().top,
			heightBelow = Ext.Element.getViewHeight() - heightAbove - me.getHeight(),
			space = Math.max(heightAbove, heightBelow);


		// Allow the picker to height itself naturally.
		if (picker.height) {
			delete picker.height;
			picker.updateLayout();
		}
		// Then ensure that vertically, the dropdown will fit into the space either above or below the inputEl.
		if (picker.getHeight() > space - 5) {
			picker.setHeight(space - 5); // have some leeway so we aren't flush against
		}
		me.callParent();
		picker.setWidth(this.inputCell.parent().parent().parent().getWidth());
	}
});

Ext.override(Ext.form.field.Date, {
	format : 'Y-m-d'
});

Ext.override(Ext.panel.Header, {
	headerType : null,
	initComponent : function() {

		if (this.headerType) {
			this.cls = 'header-' + this.headerType;
		}

		this.callParent();
	}
});

Ext.override(Ext.form.Panel, {
	defaultBodyCls : true,
	initComponent : function() {

		if (!this.bodyPadding) {
			this.bodyPadding = 5;
		}

		if (!this.bodyCls && this.defaultBodyCls) {
			this.bodyCls = 'form-body';
		}

		this.callParent();
	}
});

Ext.override(Ext.menu.Item, {
	activate : function() {
		var me = this;

		if (!me.activated && me.canActivate && me.rendered && !me.isDisabled() && me.isVisible()) {
			me.el.addCls(me.activeCls);

			Ext.fly(me.el.query('span.x-menu-item-text')[0]).addCls('menuitem-over');

			me.focus();
			me.activated = true;
			me.fireEvent('activate', me);
		}
	},
	deactivate : function() {
		var me = this;

		if (me.activated) {
			me.el.removeCls(me.activeCls);

			Ext.fly(me.el.query('span.x-menu-item-text')[0]).removeCls('menuitem-over');

			me.blur();
			me.hideMenu();
			me.activated = false;
			me.fireEvent('deactivate', me);
		}
	}
});

Ext.override(Ext.menu.Menu, {
	initComponent : function() {
		if (Ext.isIE7 || Ext.isIE8) {
			this.shadow = false;
		}

		this.callParent();
	},
	onShow : function() {
		var me = this;
		if (me.collapsed && me.isPlaceHolderCollapse()) {
			// force hidden back to true, since this gets set by the layout
			me.setHiddenState(true);
			me.placeholderCollapse();
		} else {
			me.callParent(arguments);
		}
		this.el.setOpacity(0);
		this.el.animate({
			from : {
				height : 0,
				opacity : 0
			},
			to : {
				height : Ext.isIE7 ? this.getHeight() - 2 : this.getHeight(),
				opacity : .95
			},
			duration : 200,
			dynamic : true
		});

	}
});

Ext.override(Ext.grid.Panel, {
	enableDragSort : false,
	initComponent : function() {

		if (this.enableDragSort) {

			var me = this;

			this.viewConfig = {
				plugins : {
					ptype : 'gridviewdragdrop'
				},
				listeners : {
					drop : function(node, data, dropRec, dropPosition) {
						me.view.refresh();
						//me.view.fireEvent('refresh', me.view, {});
					}
				}
			};

		}

		this.callParent();
	}
});

Ext.override(Ext.grid.ViewDropZone, {
	handleNodeDrop : function(data, record, position) {
		if (!data.view.preventDefault) {
			this.callParent(arguments);
		}
	}
});

Ext.override(Ext.form.Label, {
	handler : null,
	setHtml : function(v) {
		this.el.setHTML(v);
		this.updateLayout();
	},
	afterRender : function() {
		
		var me = this;
		if (this.handler) {
			this.el.on('click', function() {
				if (!me.isDisabled()) {
					me.handler(me);
				}
			});
		}
		
		me.setDisabled(this.disabled);
		
		this.callParent();
	},
	isDisabled : function() {
		return this.disabled;
	},
	setDisabled : function(disabled) {
		this.disabled = disabled;
		
		if (!this.rendered) {
			this.on('afterRender', function() {
				this.el.setOpacity(disabled ? .4 : 1);
			});
		} else {
			this.el.setOpacity(disabled ? .4 : 1);
		}
	}
});

Ext.override(Ext.form.field.Base, {
	focused : false,
	trimLabelSeparator : function() {

		var me = this, separator = me.labelSeparator, label = me.fieldLabel || '', lastChar = label.substr(label.length - 1);

		if (this.allowBlank == false && !this.column && this.fieldLabel) {
			label += '<span style="color:red;font-weight:normal;">※</span>';
		}

		return lastChar === separator ? label.slice(0, -1) : label;
	},
	afterRender : function() {

		if (this.focused) {
			var me = this;
			new Ext.util.DelayedTask(function() {
				me.focus();
			}).delay(0);
		}

		if (this.getEnterKeyBtn && this.getEnterKeyBtn() && this.getEnterKeyBtn().handler) {

			this.on('specialkey', function(field, e) {
				if (e.getKey() == e.ENTER) {

					var btn = this.getEnterKeyBtn();

					btn.handler.apply(btn, [btn, Ext.EventObject]);
				}
			});
		}

		this.callParent();
	}
});

Ext.override(Ext.grid.feature.Grouping, {
	getGroupNames : function() {
		var arr = [];

		for (var key in this.groupCache) {
			arr.push(key);
		}

		return arr;
	},
	//private
	renderCustomWidgets : function() {
		var me = this;

		//clear em first!
		Ext.each(me.customWidgets, function(item) {
			item.destroy();
		});
		me.customWidgets = [];

		Ext.each(me.getGroupNames(), function(groupName) {
			var n = me.getHeaderNode(groupName);
			if (!n) {
				return;
			}
			var n = n.child('div');
			if (!n) {
				return;
			}
			//n.setHTML('');

			if (n.child('span[role=customwidgets]')) {
				n.child('span[role=customwidgets]').remove();
			}

			var el = n.appendChild({
				tag : 'span',
				style : 'margin-left:10px;',
				role : 'customwidgets'
			});
			el.on('click', function(e) {
				e.stopPropagation();
			});
			
			me.customWidgets.push(me.getCustomWidget(groupName, n.child('span[role=customwidgets]'), me, me.groupCache[groupName].children));

		});
	},
	afterViewRender : function() {
		var me = this,
			view = me.view;

		//4 CUSTOM WIDGETS
		if (this.getCustomWidget) {
			view.on({
				scope : me,
				refresh : function() {
					me.renderCustomWidgets();
				}
			});
			view.on({
				scope : me,
				groupcollapse : function() {
					me.renderCustomWidgets();
				}
			});
			view.on({
				scope : me,
				groupexpand : function() {
					me.renderCustomWidgets();
				}
			});
			view.store.on({
				scope : me,
				add : function() {
					new Ext.util.DelayedTask(function() {
						me.renderCustomWidgets();
					}).delay(10);
				}
			});
		}
		//END

		view.on({
			scope: me,
			groupclick: me.onGroupClick
		});

		if (me.enableGroupingMenu) {
			me.injectGroupingMenu();
		}

		me.pruneGroupedHeader();

		me.lastGroupers = me.view.store.groupers.getRange();
		me.block();
		me.onGroupChange();
		me.unblock();

		// If disabled in the config, disable now so the store load won't
		// send the grouping query params in the request.
		if (me.disabled) {
			me.disable();
		}
		
	}
});

Ext.override(Ext.window.MessageBox, {
	makeButton : function(btnIdx) {
		var btnId = this.buttonIds[btnIdx];

		return new Ext.button.Button({
			handler : this.btnCallback,
			itemId : btnId,
			scope : this,
			btnType : ['ok', 'yes'].indexOf(btnId) == -1 ? 'common' : 'info',
			text : this.buttonText[btnId],
			minWidth : 75
		});
	},
	//private
	reorderBtns : function() {
		this.msgButtons = this.msgButtons.reverse();
		
		this.bottomTb.removeAll(false);
		this.bottomTb.add(this.msgButtons[0]);
		this.bottomTb.add(this.msgButtons[1]);
		this.bottomTb.add(this.msgButtons[2]);
		this.bottomTb.add(this.msgButtons[3]);
		
		return this;
	},
	alert: function(cfg, msg, fn, scope) {
		if (Ext.isString(cfg)) {
			cfg = {
				title : cfg,
				msg : msg,
				buttons: this.CANCEL,
				fn: fn,
				scope : scope,
				minWidth: this.minWidth
			};
		}
		return this.show(cfg);
	}
});

Ext.Msg.destroy();
Ext.MessageBox = Ext.Msg = new Ext.window.MessageBox().reorderBtns();

Ext.override(Ext.Component, {
	refreshTipsy : function() {
		if (!this.rendered) return;
		
		//tipsy check
		if (this.el && $.fn.tipsy && this.tipsy) {
			
			var cfg = {
				html : true,
				gravity : $.fn.tipsy.autoNS
			};
			var gravity = this.tipsyGravity;
			if (gravity) {
				if (gravity == 'autoWE') {
					gravity = $.fn.tipsy.autoWE;
				} else if (gravity == 'autoNS') {
					gravity = $.fn.tipsy.autoNS;
				}
				cfg.gravity = gravity;
				
			}
			
			$(this.el.dom).attr('original-title', this.tipsy);
			$(this.el.dom).tipsy(cfg);
		}
		//end tipsy
	},
	afterRender : function() {
		this.refreshTipsy();
		
		if (this.on) {
			this.on('hide', function() {
				$('.tipsy').remove();
			});
			this.on('destroy', function() {
				$('.tipsy').remove();
			});
		}
		
		this.callParent();
	}
});

Ext.override(Ext.form.field.HtmlEditor, {
	fontFamilies: [
		'宋体',
		'微软雅黑',
		'Arial',
		'Courier New',
		'Tahoma',
		'Times New Roman',
		'Verdana'
	],
	createToolbar : function() {
		var tb = this.getToolbarCfg();
		
		Ext.each(tb.items, function(item) {
			if (item.tooltip) {
				var tlt = item.tooltip;
				
				item.tipsy = '<div class="' + tlt.cls + '"><div style="font-weight:bold;">' + tlt.title + '</div>' + tlt.text + '</div>';
				delete item.tooltip;
			}
		});
		
		this.toolbar = Ext.widget(tb);

		return this.toolbar;
	}
});

Ext.override(Ext.toolbar.Paging, {
	defaultBtnType : 'label',
	defaultBtnStyle : null,
	perPage : false,
	displayInfo : true,
	afterRender : function() {
		var me = this;
		
		if (this.perPage) {
			this.add('-');
			this.add({
				xtype : 'combo',
				editable : false,
				tipsy : me.pageSizeMsg,
				tipsyGravity : 'e',
				displayField : 'value',
				valueField : 'value',
				value : this.store.pageSize,
				width : 70,
				style : 'margin-right:10px;',
				listeners : {
					valuechange : function(combo, o, n) {
						me.store.pageSize = n;
						me.store.loadPage(1);
					}
				},
				store : {
					fields : ['value'],
					data : [{
						value : 10
					}, {
						value : 15
					}, {
						value : 20
					}, {
						value : 30
					}, {
						value : 50
					}, {
						value : 100
					}, {
						value : 150
					}, {
						value : 200
					}, {
						value : 500
					}]
				}
			});
		}
		
		this.callParent();
	},
	getPagingItems : function() {
		var me = this;
		return [{
			itemId : 'first',
			btnType : this.defaultBtnType,
			style : this.defaultBtnStyle,
			tipsy : me.firstText,
			overflowText : me.firstText,
			iconCls : Ext.baseCSSPrefix + 'tbar-page-first',
			disabled : true,
			handler : me.moveFirst,
			scope : me
		}, {
			itemId : 'prev',
			btnType : this.defaultBtnType,
			style : this.defaultBtnStyle,
			tipsy : me.prevText,
			overflowText : me.prevText,
			iconCls : Ext.baseCSSPrefix + 'tbar-page-prev',
			disabled : true,
			handler : me.movePrevious,
			scope : me
		}, '-', me.beforePageText, {
			xtype : 'numberfield',
			itemId : 'inputItem',
			name : 'inputItem',
			cls : Ext.baseCSSPrefix + 'tbar-page-number',
			allowDecimals : false,
			minValue : 1,
			hideTrigger : true,
			enableKeyEvents : true,
			keyNavEnabled : false,
			selectOnFocus : true,
			submitValue : false,
			// mark it as not a field so the form will not catch it when getting fields
			isFormField : false,
			width : me.inputItemWidth,
			margins : '-1 2 3 2',
			listeners : {
				scope : me,
				keydown : me.onPagingKeyDown,
				blur : me.onPagingBlur
			}
		}, {
			xtype : 'tbtext',
			itemId : 'afterTextItem',
			text : Ext.String.format(me.afterPageText, 1)
		}, '-', {
			itemId : 'next',
			btnType : this.defaultBtnType,
			style : this.defaultBtnStyle,
			tipsy : me.nextText,
			overflowText : me.nextText,
			iconCls : Ext.baseCSSPrefix + 'tbar-page-next',
			disabled : true,
			handler : me.moveNext,
			scope : me
		}, {
			itemId : 'last',
			btnType : this.defaultBtnType,
			style : this.defaultBtnStyle,
			tipsy : me.lastText,
			overflowText : me.lastText,
			iconCls : Ext.baseCSSPrefix + 'tbar-page-last',
			disabled : true,
			handler : me.moveLast,
			scope : me
		}, '-', {
			itemId : 'refresh',
			btnType : this.defaultBtnType,
			style : this.defaultBtnStyle,
			tipsy : me.refreshText,
			overflowText : me.refreshText,
			iconCls : Ext.baseCSSPrefix + 'tbar-loading',
			disabled : me.store.isLoading(),
			handler : me.doRefresh,
			scope : me
		}];
	}
});

Ext.override(Ext.ZIndexManager, {
	_showModalMask: function(comp) {
		var me = this,
			zIndex = comp.el.getStyle('zIndex') - 4,
			maskTarget = comp.floatParent ? comp.floatParent.getTargetEl() : comp.container,
			mask = me.mask,
			shim = me.maskShim,
			viewSize;

		if (!mask) {
			if (Ext.isIE6) {
				shim = me.maskShim = Ext.getBody().createChild({
					//<debug>
					// tell the spec runner to ignore this element when checking if the dom is clean
					'data-sticky': true,
					//</debug>
					tag: 'iframe',
					role: 'presentation',
					cls : Ext.baseCSSPrefix + 'shim ' + Ext.baseCSSPrefix + 'mask-shim'
				});
				shim.setVisibilityMode(Ext.Element.DISPLAY);
			}

			// Create the mask at zero size so that it does not affect upcoming target measurements.
			mask = me.mask = Ext.getBody().createChild({
				//<debug>
				// tell the spec runner to ignore this element when checking if the dom is clean
				'data-sticky': true,
				//</debug>
				role: 'presentation',
				cls: Ext.baseCSSPrefix + 'mask',
				style: 'height:0;width:0'
			});

			mask.setOpacity(0);
			mask.animate({
				to : {
					opacity : .6
				},
				duration : 200
			});

			mask.setVisibilityMode(Ext.Element.DISPLAY);
			mask.on('click', me._onMaskClick, me);
		}

		mask.maskTarget = maskTarget;
		viewSize = me.getMaskBox();

		if (shim) {
			shim.setStyle('zIndex', zIndex);
			shim.show();
			shim.setBox(viewSize);
		}
		mask.setStyle('zIndex', zIndex);

		// setting mask box before showing it in an IE7 strict iframe within a quirks page
		// can cause body scrolling [EXTJSIV-6219]

		//mask.show();
		mask.setBox(viewSize);
	},
	_hideModalMask: function() {
		var mask = this.mask,
			maskShim = this.maskShim;

		if (mask && mask.isVisible()) {
			mask.maskTarget = undefined;
			var me = this;
			mask.animate({
				to : {
					opacity : 0
				},
				duration : 200,
				callback : function() {
					delete me.mask;
					mask.remove();
				}
			});
			if (maskShim) {
				maskShim.hide();
			}
		}
	}
});

Ext.form.field.Base.prototype.labelSeparator = Ext.form.FieldContainer.prototype.labelSeparator = '';
Ext.form.field.Base.prototype.labelWidth = Ext.form.FieldContainer.prototype.labelWidth = 120;
new Ext.util.DelayedTask(function() {
	Ext.form.field.Date.prototype.format = 'Y-m-d';
}).delay(0);

Ext.override(Ext.Img, {
	supportRatio : false,
	afterRender : function() {
		
		if (this.supportRatio) {
			var me = this;
			this.el.on('load', function() {
				me.el.setStyle('width', '');
				me.el.setStyle('height', '');

				me.w = me.getWidth();
				me.h = me.getHeight();
			});
		}
		
		this.callParent();
	},
	adjustRatio : function(ratio, callback) {
		if (this.supportRatio) {
			
			this.el.animate({
				to : {
					width : this.w * ratio,
					height : this.h * ratio
				},
				duration : 200,
				callback : callback
			});
		}
		
	}
});