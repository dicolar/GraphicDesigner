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

		if (this.src.linkend) {
			var index = this.src.linkend.outlinkers.indexOf(this);
			if (index > -1) this.src.linkend.outlinkers.splice(index, 1);
		}
		if (this.target.linkend) {
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