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