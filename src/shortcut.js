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