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