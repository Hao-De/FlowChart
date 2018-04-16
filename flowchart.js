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
							Object.assign( _option, options );

						// 如果_option中設定了寬高，變更_canvas之寬高
						if( _option.width && _option.height ){
							_canvas.width = _option.width;
							_canvas.height = _option.height;
						}else{ // 反之，用_canvas之寬高，記錄到_option中
							_option.width = _canvas.width;
							_option.height = _canvas.height;
						}

						// 校正 html canvas 線條模糊( 所有座標平移 0.5px，且線條盡量以整數座標繪製，所以大部分之座標皆以 Math.round 取整數 )
						_ctx.translate(0.5, 0.5);
						
						this.repaint( _ctx, _objects, _option );

					}catch( error ){
						console.error("[FlowChart] ", error.message);
					}
				}

				/**
				 * create a rectangle data
				 * @param {object} options - options of the rectangle
				 */
				static rect( options ){
					// default setting of rectangle object
					let setting = shape( "RECTANGLE" );
					Object.assign( setting, options );
					return setting;
				}

				/**
				 * create a diamond/rhombus data
				 * @param {object} options - options of the rhombus
				 */
				static rhom( options ){
					// default setting of rhombus object
					let setting = shape( "RHOMBUS" );
					Object.assign( setting, options );
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
					Object.assign( setting, options );
					return setting;
				}
				
				/**
				 * create a arrow data
				 * @param {object} options - options of the rhombus
				 */
				static arrow( options ){
					// default setting of rhombus object
					let setting = {
						type: "ARROW",
						lineWidth: 0.01,
						arrowhead: true,
						point: [],
						color: "black"
					};
					Object.assign( setting, options );
					return setting;
				}

				/**
				 * add an object or objects into array and print it on the canvas
				 * @param {array} newItems - an array that stores objects added to the canvas
				 */
				add( ...newItems ){
					_objects = _objects.concat( newItems );
					if( _option.repaintAfterModify )
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
					lineWidth: 1
				}
			}
			
			/**
			 * paint grid of the canvas
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} globalOption - options of canvas
			 */
			function paintGrid( ctx, globalOption ){
				if(globalOption.hasGrid){
					let maxWidth = globalOption.width;
					let maxHeight = globalOption.height;

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
				}
			}

			/**
			 * paint single rectangle
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the rectangle
			 * @param {object} globalOption - options of canvas
			 */
			function paintRect( ctx, option, globalOption ){
				ctx.beginPath();
				ctx.strokeStyle = option.strokeColor;
				ctx.lineWidth = option.lineWidth;
				ctx.rect( Math.round( globalOption.gap * option.x ), 
						 Math.round( globalOption.gap * option.y ), 
						 Math.round( globalOption.gap * option.width ), 
						 Math.round( globalOption.gap * option.height ) );
				ctx.stroke();
				if( option.isFill ){
					ctx.fillStyle = option.fillColor;
					ctx.fill();
				}
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
			}
			
			/**
			 * paint text 
			 * @param {CanvasRenderingContext2D} ctx - the context of canvas
			 * @param {object} option - option of the text
			 * @param {object} globalOption - options of canvas
			 */
			function paintText( ctx, option, globalOption ){
				
				if( option.text ){
					
					// set font size and font family
					if( typeof option.fontSize !== "number" )
						option.fontSize = parseFloat( option.fontSize );
					ctx.font = ( option.fontSize * globalOption.gap ) + "px " + option.fontFamily;
					
					// set the width of text
					let width = ctx.measureText(option.text).width;
					if( typeof option.maxWidth === "number" && ( option.maxWidth * globalOption.gap ) < width )
						width = option.maxWidth * globalOption.gap;
					
					// accroding to the align point, calculate the left bottom coordinate
					let x, y;
					switch( option.alignX ){
						case "center":
							x = Math.round( globalOption.gap * option.x - width/2 );
							break;
						case "right":
							x = Math.round( globalOption.gap * option.x - width );
							break;
						case "left":
						default:
							x = Math.round( globalOption.gap * option.x );
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
					y = Math.round( globalOption.gap * option.y );
					
					ctx.fillStyle = option.color;
					if( typeof option.maxWidth === "number" )
						ctx.fillText( option.text, x, y, width );
					else
						ctx.fillText( option.text, x, y );
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
					
				}
			}
		})();
	}
}(window));