(function(window){
	'use strict';
	if( !window.FlowChart ){
		window.FlowChart = (function () {
			let _canvas; // 畫布
			let _ctx; // 畫筆
			let _objects; // 物件陣列
			let _option = {
				gap: 50,
				width: null,
				height: null,
				bgColor: null,
				hasGrid: true,
				repaintAfterModify: true
			};

			class FlowChart {

				/**
				 * FlowChart constructor
				 * @param {string} canvasId - the ID of the target canvas.
				 * @param {object} options - some setting of the target canvas.
				 */
				constructor( canvasId, options ){
					try{
						_canvas = document.querySelector("canvas#"+canvasId);
						_ctx = _canvas.getContext("2d");
						_objects = [];
						
						if( options )
							_option = Object.assign( {}, _option, options );

						// adjust width and height by _option.width and _option.height
						_option.width = _option.width || _canvas.offsetWidth;
						_option.height = _option.height || _canvas.offsetHeight;
						_canvas.setAttribute( 'width', _option.width );
						_canvas.setAttribute( 'height', _option.height );

						// add css text inside the head tag
						let style = document.createElement("style");
						let css = `canvas#${canvasId}{width:${_option.width}px;height:${_option.height}px;}`;
						style.type = 'text/css';
						if (style.styleSheet){
							style.styleSheet.cssText = css;
						} else {
							style.appendChild(document.createTextNode(css));
						}
						document.head.appendChild(style);
						
						// make canvas high resolution
						if( window.devicePixelRatio ){
							let ratio = window.devicePixelRatio;
							_canvas.setAttribute( 'width', _option.width * ratio );
							_canvas.setAttribute( 'height', _option.height * ratio );
							_canvas.style.width = _option.width;
							_canvas.style.height = _option.height;
							_ctx.scale( ratio, ratio );
						}
						
						// 校正 html canvas 線條模糊( 所有座標平移 0.5px，且線條盡量以整數座標繪製，所以大部分之座標皆以 Math.round 取整數 )
						_ctx.translate(0.5, 0.5);
						
						this.repaint( _ctx, _objects, _option );
					}catch( error ){
						console.error("[FlowChart] ", error);
					}
				}

				/**
				 * create a circle data
				 * @param {object} options - options of the rectangle
				 */
				static circle( options ){
					// default setting of rectangle object
					let setting = shape( "CIRCLE" );
					let extendSetting = {
						radius: 0.5,
					}
					setting = Object.assign( {}, setting, options );
					return setting;
				}
				
				/**
				 * create a rectangle data
				 * @param {object} options - options of the rectangle
				 */
				static rect( options ){
					// default setting of rectangle object
					let setting = shape( "RECTANGLE" );
					setting = Object.assign( {}, setting, options );
					return setting;
				}

				/**
				 * create a diamond/rhombus data
				 * @param {object} options - options of the rhombus
				 */
				static rhom( options ){
					// default setting of rhombus object
					let setting = shape( "RHOMBUS" );
					setting = Object.assign( {}, setting, options );
					return setting;
				}
				
				/**
				 * create a text data
				 * @param {object} options - options of the rhombus
				 */
				static text( options ){
					// default setting of rhombus object
					let setting = {
						type: "TEXT",
						fontSize: 0.5,
						fontFamily: "Arial",
						color: "black",
						maxWidth: null,
						alignX: "left",
						alignY: "top"
					};
					setting = Object.assign( {}, setting, options );
					return setting;
				}
				
				/**
				 * create a arrow data
				 * @param {object} options - options of the rhombus
				 */
				static arrow( options ){
					// default setting of arrow object
					let setting = {
						type: "ARROW",
						lineWidth: 0.05,
						arrowhead: true,
						twoHead: false,
						point: [],
						color: "black",
					};
					// default setting of headstyle
					let defaultHeadStyle = {
						headlen: 0.2,
						lineWidth: 0.05,
						color: "black",
						theta: 30,
					}
					
					setting = Object.assign( {}, setting, options );
					setting.headStyle = Object.assign( {}, defaultHeadStyle, options.headStyle );
					
					return setting;
				}

				/**
				 * add an object or objects into array and paint it on the canvas
				 * @param {array} newItems - an array that stores objects added to the canvas
				 */
				add( ...newItems ){
					_objects = _objects.concat( newItems );
					if( _option.repaintAfterModify )
						this.repaint( _ctx, _objects, _option );
				}
				
				/**
				 * remove an object or objects from the _objects array and repaint.
				 * @param {array} removeObj - an array that stores objects needing to be removed from the canvas.
				 */
				remove( ...removeObj ){
					removeObj.forEach(( obj )=>{
						let removeIndex = _objects.indexOf( obj );
						if( removeIndex >= 0 )
							_objects.splice( removeIndex, 1 );
					});
					if( _option.repaintAfterModify )
						this.repaint( _ctx, _objects, _option );
				}
				
				clear(){
					_objects = [];
					this.repaint( _ctx, _objects, _option );
				}
				
				/**
				 * set gap width
				 * @param {integer} value - the width of gap (pixel).
				 */
				setGap( value ){
					_option.gap = value;
				}
				
				/**
				 * get gap width
				 */
				getGap(){
					return _option.gap;
				}

				/**
				 * repaint everything on the canvas
				 * @param {CanvasRenderingContext2D} ctx - the context of canvas
				 * @param {array} objects - an array containing objects to draw
				 * @param {object} globalOption - options of canvas
				 */
				repaint( ctx, objects, globalOption ){
					ctx.clearRect( 0, 0, globalOption.width, globalOption.height );
					if( globalOption.bgColor ){
						ctx.fillStyle = globalOption.bgColor;
						ctx.fillRect( 0, 0, globalOption.width, globalOption.height );
					}
					paintGrid( ctx, globalOption );
					if( objects.length ){
						objects.forEach( function( value ){
							switch( value.type ){
								case "CIRCLE":
									paintCircle( ctx, value, globalOption );
									break;
								case "RECTANGLE":
									if( !value.radius )
										paintRect( ctx, value, globalOption );
									else
										paintRoundRect( ctx, value, globalOption );
									break;
								case "RHOMBUS":
									paintRhombus( ctx, value, globalOption );
									break;
								case "TEXT":
									paintText( ctx, value, globalOption );
									break;
								case "ARROW":
									paintArrow( ctx, value, globalOption );
									break;
								default:
									break;
							}
						});
					}
				}
				
				update(){
					this.repaint( _ctx, _objects, _option );
				}
			}
			return FlowChart;
			
			/**
			 * create data structure of basic shape
			 * @param {string} typename - the type of shape
			 */
			function shape( typename ){
				return {
					type: typename,
					x: 0,
					y: 0,
					width: 0,
					height: 0,
					isFill: false,
					fillColor: "gray",
					strokeColor: "#000",
					lineWidth: 0.05
				}
			}
			
			/**
			 * paint grid of the canvas
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} globalOption - options of canvas
			 */
			function paintGrid( ctx, globalOption ){
				if( globalOption.hasGrid ){
					let maxWidth = globalOption.width;
					let maxHeight = globalOption.height;

					ctx.save();
					ctx.beginPath();
					ctx.strokeStyle = "#D3D3D3";
					ctx.lineWidth = 0.05;
					for(let x=0; x<globalOption.width; x+=globalOption.gap ){
						ctx.moveTo( Math.round(x), 0 );
						ctx.lineTo( Math.round(x), Math.round(maxHeight) );
						ctx.stroke();
					}
					for(let y=0; y<globalOption.width; y+=globalOption.gap ){
						ctx.moveTo( 0, Math.round(y) );
						ctx.lineTo( Math.round(maxWidth), Math.round(y) );
						ctx.stroke();
					}
					ctx.restore();
				}
			}

			/**
			 * paint single circle
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the circle
			 * @param {object} globalOption - options of canvas
			 */
			function paintCircle( ctx, option, globalOption ){
				ctx.save();
				ctx.beginPath();
				ctx.strokeStyle = option.strokeColor;
				ctx.lineWidth = globalOption.gap * option.lineWidth;
				ctx.arc( Math.round( globalOption.gap * option.x ), 
						 Math.round( globalOption.gap * option.y ), 
						 globalOption.gap * option.radius, 
						 0, 2 * Math.PI );
				ctx.stroke();
				if( option.isFill ){
					ctx.fillStyle = option.fillColor;
					ctx.fill();
				}
				ctx.restore();
			}
			
			/**
			 * paint single rectangle
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the rectangle
			 * @param {object} globalOption - options of canvas
			 */
			function paintRect( ctx, option, globalOption ){
				ctx.save();
				ctx.beginPath();
				ctx.strokeStyle = option.strokeColor;
				ctx.lineWidth = globalOption.gap * option.lineWidth;
				ctx.rect( Math.round( globalOption.gap * option.x ), 
						 Math.round( globalOption.gap * option.y ), 
						 Math.round( globalOption.gap * option.width ), 
						 Math.round( globalOption.gap * option.height ) );
				ctx.stroke();
				if( option.isFill ){
					ctx.fillStyle = option.fillColor;
					ctx.fill();
				}
				ctx.restore();
			}

			/**
			 * paint single round rectangle 
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the rectangle
			 * @param {object} globalOption - options of canvas
			 */
			function paintRoundRect( ctx, option, globalOption ){
				let x = Math.round( globalOption.gap * option.x );
				let y = Math.round( globalOption.gap * option.y );
				let width = Math.round( globalOption.gap * option.width );
				let height = Math.round( globalOption.gap * option.height );
				
				if (typeof option.radius === 'undefined') {
					option.radius = 15;
				}
				if (typeof option.radius === 'number') {
					option.radius *= globalOption.gap;
					option.radius = {tl: option.radius, tr: option.radius, br: option.radius, bl: option.radius};
				} else {
					var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
					for (var side in defaultRadius) {
						option.radius[side] = option.radius[side] || defaultRadius[side];
					}
				}
				ctx.save();
				ctx.beginPath();
				ctx.strokeStyle = option.strokeColor;
				ctx.lineWidth = option.lineWidth;
				ctx.moveTo(x + option.radius.tl, y);
				ctx.lineTo(x + width - option.radius.tr, y);
				ctx.quadraticCurveTo(x + width, y, x + width, y + option.radius.tr);
				ctx.lineTo(x + width, y + height - option.radius.br);
				ctx.quadraticCurveTo(x + width, y + height, x + width - option.radius.br, y + height);
				ctx.lineTo(x + option.radius.bl, y + height);
				ctx.quadraticCurveTo(x, y + height, x, y + height - option.radius.bl);
				ctx.lineTo(x, y + option.radius.tl);
				ctx.quadraticCurveTo(x, y, x + option.radius.tl, y);
				ctx.closePath();
				ctx.stroke();
				if ( option.isFill ) {
					ctx.fillStyle = option.fillColor;
					ctx.fill();
				}
				ctx.restore();
			}
			
			/**
			 * paint single rhombus 
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the rhombus
			 * @param {object} globalOption - options of canvas
			 */
			function paintRhombus( ctx, option, globalOption ){
				let x = Math.round( globalOption.gap * option.x );
				let y = Math.round( globalOption.gap * option.y );
				let width = Math.round( globalOption.gap * option.width );
				let height = Math.round( globalOption.gap * option.height );

				ctx.save();
				ctx.beginPath();
				ctx.strokeStyle = option.strokeColor;
				ctx.lineWidth = option.lineWidth;
				ctx.moveTo(x + width/2, y);
				ctx.lineTo(x , y + height/2);
				ctx.lineTo(x + width/2, y + height);
				ctx.lineTo(x + width, y + height/2);
				ctx.lineTo(x + width/2, y);
				ctx.closePath();
				ctx.stroke();
				if ( option.isFill ) {
					ctx.fillStyle = option.fillColor;
					ctx.fill();
				}
				ctx.restore();
			}
			
			/**
			 * paint text 
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the text
			 * @param {object} globalOption - options of canvas
			 */
			function paintText( ctx, option, globalOption ){
				
				if( option.text ){
					ctx.save();
					// set font size and font family
					if( typeof option.fontSize !== "number" )
						option.fontSize = parseFloat( option.fontSize );
					ctx.font = ( option.fontSize * globalOption.gap ) + "px " + option.fontFamily;
					
					// align the text
					switch( option.alignX ){
						case "center":
							ctx.textAlign = "center";
							break;
						case "right":
							ctx.textAlign = "right";
							break;
						case "left":
						default:
							ctx.textAlign = "left";
							break;
					}
					switch( option.alignY ){
						case "bottom":
							ctx.textBaseline = "bottom";
							break;
						case "center":
							ctx.textBaseline = "middle";
							break;
						case "top":
						default:
							ctx.textBaseline = "top";
							break;
					}
					let x = Math.round( globalOption.gap * option.x );
					let y = Math.round( globalOption.gap * option.y );
					
					ctx.fillStyle = option.color;
					
					// measure text width
					let width = ctx.measureText(option.text).width;
					
					// if custom width < measure width, limit it while drawing
					if( typeof option.maxWidth === "number" && ( option.maxWidth * globalOption.gap ) < width )
						ctx.fillText( option.text, x, y, option.maxWidth * globalOption.gap );
					else
						ctx.fillText( option.text, x, y );
					ctx.restore();
				}
			}
			
			/**
			 * paint arrow/line
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the line
			 * @param {object} globalOption - options of canvas
			 */
			function paintArrow( ctx, option, globalOption ){
				
				if( Array.isArray( option.point ) && option.point.length > 0 ){
					
					ctx.save();
					ctx.beginPath();
					ctx.strokeStyle = option.color;
					ctx.lineWidth = option.lineWidth * globalOption.gap;
					
					// paint every line
					option.point.forEach(( value, index, array )=>{
						if( index === 0 ){
							ctx.moveTo( value[0] * globalOption.gap, value[1] * globalOption.gap );
						}else{
							ctx.lineTo( value[0] * globalOption.gap, value[1] * globalOption.gap );
						}
					});
					ctx.stroke();
					ctx.restore();
					
					// draw arrowhead if needed.
					if( option.arrowhead ){
						let lastTwoPoint = option.point.slice(-2);
						paintArrowHead(
							ctx, {
								fromX: lastTwoPoint[0][0]*globalOption.gap,
								fromY: lastTwoPoint[0][1]*globalOption.gap,
								toX: lastTwoPoint[1][0]*globalOption.gap,
								toY: lastTwoPoint[1][1]*globalOption.gap,
								theta: option.headStyle.theta,
								headlen: option.headStyle.headlen*globalOption.gap,
								width: option.headStyle.lineWidth*globalOption.gap,
								color: option.headStyle.color
							}, globalOption
						);
						
						// draw reversely arrowhead, if needed.
						if( option.twoHead ){
							let firstTwoPoint = option.point.slice(0, 2);
							paintArrowHead(
								ctx, {
									fromX: firstTwoPoint[1][0]*globalOption.gap,
									fromY: firstTwoPoint[1][1]*globalOption.gap,
									toX: firstTwoPoint[0][0]*globalOption.gap,
									toY: firstTwoPoint[0][1]*globalOption.gap,
									theta: option.headStyle.theta,
									headlen: option.headStyle.headlen*globalOption.gap,
									width: option.headStyle.lineWidth*globalOption.gap,
									color: option.headStyle.color
								}, globalOption
							);
						}
					}
					
				}
			}
			
			/**
			 * 參考來源: https://www.w3cplus.com/canvas/drawing-arrow.html © w3cplus.com
			 * paint arrow head
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} points - point of the arrow
			 * @param {object} style - style of the arrow
			 * @param {object} globalOption - options of canvas
			 */
			function paintArrowHead(ctx, option, globalOption) {
				let setting = {
					fromX: 0,
					fromY: 0,
					toX: 0,
					toY: 0,
					theta: 30,
					headlen: 0.3 * globalOption.gap,
					width: 0.1 * globalOption.gap,
					color: "#000",
				};
				setting = Object.assign( {}, setting, option );
				
				let angle = Math.atan2(setting.fromY - setting.toY, setting.fromX - setting.toX) * 180 / Math.PI;
				let angle1 = (angle + setting.theta) * Math.PI / 180;
				let angle2 = (angle - setting.theta) * Math.PI / 180;
				let topX = setting.headlen * Math.cos(angle1);
				let topY = setting.headlen * Math.sin(angle1);
				let botX = setting.headlen * Math.cos(angle2);
				let botY = setting.headlen * Math.sin(angle2);
				
				ctx.save();
				ctx.beginPath();
				
				// Reverse length on the other side 
				let arrowX = setting.toX + topX;
				let arrowY = setting.toY + topY;
				ctx.moveTo(arrowX, arrowY);
				ctx.lineTo(setting.toX, setting.toY);
				arrowX = setting.toX + botX;
				arrowY = setting.toY + botY;
				ctx.lineTo(arrowX, arrowY);
				ctx.strokeStyle = setting.color;
				ctx.lineWidth = setting.width;
				ctx.stroke();
				ctx.restore();
			}
		})();
	}
}(window));