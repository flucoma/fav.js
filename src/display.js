let Signal = require("./signal.js");

class Layer{
  //http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
  hslToRgb(h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      } else {
          var hue2rgb = function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  constructor(type, canvas, margin = 10){
    let drawFuncs = {
      "line": this.drawLine,
      "fill": this.drawFill,
      "wave": this.drawWave,
      "errorbar": this.drawError,
      "image": this.drawImage
    }
    this.draw = drawFuncs[type];
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.margin = margin;
    this.type = type;
  }

  _mapVal(x, min, range, height){
    return height * (x - min) / range;
  }
  clear(){
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawLine(desc, style){
    if (desc.length !== this.canvas.width){
      desc = desc.sample( desc.length / this.canvas.width);
    }
    let y0 = this._mapVal(desc.data[0], desc.min, desc.range, this.canvas.height - this.margin);
    this.context.moveTo(0, this.canvas.height - y0);
    for (let i = 1; i < desc.data.length; i++){
      let y = this._mapVal(desc.data[i], desc.min, desc.range, this.canvas.height - this.margin);
      this.context.lineTo(i, this.canvas.height - y);
    };
    this.context.lineTo(desc.data.length, this.canvas.height - y0);
    this.context.strokeStyle = style;
    this.context.stroke();
  }

  drawWave(desc, style) {
      let step = desc.data.length / this.canvas.width;
      let min = desc.sample(step, "min");
      let max = desc.sample(step, "max");
      let amp = this.canvas.height / 2;

      if(typeof style === "string"){
        this.context.fillStyle = style;
        for(let i = 0; i < this.canvas.width; i++){
          this.context.fillRect(i,(1 - max.data[i]) * amp, 1, Math.max(1,(max.data[i]-min.data[i]) * amp));
        }
      } else if (style instanceof Array) {
        style = style.map(x => x instanceof Signal?
            x.sample(x.length/this.canvas.width):
            {data:Array(this.canvas.width).fill(x)}
        );
        for(let i = 0; i < this.canvas.width; i++){
          this.context.fillStyle = "hsl("
            + style[0].data[i] + ","
            + style[1].data[i] +"%,"
            + style[2].data[i] +"%)"
            this.context.fillRect(i,(1 - max.data[i]) * amp, 1, Math.max(1,(max.data[i]-min.data[i]) * amp));
        }
      }
  }

  drawFill(desc, style){
    if (desc.length !== this.canvas.width){
      desc = desc.sample( desc.length / this.canvas.width);
    }
    this.context.fillStyle = style;
    for (let i = 1; i < desc.data.length; i++){
      let y = this._mapVal(desc.data[i], desc.min, desc.range, this.canvas.height - this.margin);
      this.context.fillRect(i, this.canvas.height - y, 1, y);
    }
  }

  drawError(desc, style){
    let factor = desc.length / this.canvas.width;
    let desc_mean = desc.sample(factor,"mean").smooth(10);
    let desc_std = desc.sample(factor,"std").smooth(10);
    let upper = desc_mean.add(desc_std.scale(2));
    let lower = desc_mean.add(desc_std.scale(-2));

    let min = lower.min;
    let max = upper.max;
    let range = max - min;

    this.context.fillStyle = style;
    for(let i = 0; i < this.canvas.width; i++){
      let up = this._mapVal(upper.data[i], min, range, this.canvas.height - this.margin);
      let down = this._mapVal(lower.data[i], min, range, this.canvas.height - this.margin);
      this.context.fillRect(i, this.canvas.height - up, 1, this.canvas.height - down);
    }
  }

  drawImage(desc){
    if (desc.rank !== 2) throw "Trying to draw 1D signal as image";
    let tmp = document.createElement("canvas");
    let tmpContext = tmp.getContext('2d');
    tmp.width = desc.length;
    tmp.height = desc.nBands;
    let imageData = tmpContext.getImageData(0, 0, tmp.width, tmp.height);
    for (let i = 0; i < desc.nBands; i++){
      let row = desc.nBands - i;
      for (let j = 0; j < desc.length; j++){
        let val = desc.data[j][i];
        let rgb = this.hslToRgb(val, 0, val);
        let pos = (desc.nBands - i) * (desc.length * 4) + (j*4);
          imageData.data[pos] = rgb[0];
          imageData.data[pos + 1] = rgb[1];
          imageData.data[pos + 2] = rgb[2];
          imageData.data[pos + 3] = 255;
      }
    }
    tmpContext.putImageData(imageData, 0, 0);
    this.context.drawImage(tmp, 0, 0,  this.canvas.width, this.canvas.height);
  }
}


class Display{

  constructor(container, firstLayerType, width = null, height = 100, margin = 10){
    this.layers = [];
    this.margin = margin;
    this.width = width;
    this.height = height;
    this.display = this;//workaround for syntactic sugar
    this.container = document.getElementById(container);
    this.container.style.height = height+"px";
    if(width!=null) this.container.style.width = width+"px";
    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.lastChild);
    }
    this.addLayer(firstLayerType);
  }

  addLayer(type){
    let canvas = document.createElement('canvas');
    canvas.style.position = "absolute";
    canvas.style.left = "0px";
    canvas.style.top = "0px";
    canvas.style.border = "thin dotted black";
    canvas.style.zIndex = this.layers.length;
    canvas.height = this.height;
    this.container.appendChild(canvas);
    let layer = new Layer(type, canvas, this.margin);
    layer.display = this;
    this[this.layers.length] = layer; // add array-style syntax sugar
    this.layers.push(layer);
  }

  draw(desc, style, layer){
    if(layer === this) layer = this.layers[0];
    // if width is not set, all layers will have the width of the first visualized descriptor
    if (this.width === null){
      this.width = desc.length;
      this.container.style.width = this.width+"px";
      for(let l of this.layers){
        l.canvas.width = this.width;
      }
    }
    else {
      layer.canvas.width = this.width;
    }
    layer.canvas.height = this.height;
    layer.clear();
    layer.draw(desc, style);
  }
}

module.exports = Display;
