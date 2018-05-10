(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.fad = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let Signal = require("./signal.js");
let unaryops = require("./unaryops.js");
let binaryops = require("./binaryops.js");
let samplers = require("./samplers.js");
let Display = require("./display.js")

for (var key in unaryops) {
  Signal.prototype[key] = unaryops[key];
}

for (var key in binaryops) {
  Signal.prototype[key] = binaryops[key];
}

for (var key in samplers) {
  Signal.prototype[key] = samplers[key];
}

module.exports = {"Signal":Signal, "Display":Display};

},{"./binaryops.js":2,"./display.js":3,"./samplers.js":4,"./signal.js":5,"./unaryops.js":7}],2:[function(require,module,exports){
module.exports = {

  "checkSizes": function(x,y){
    if(x.data.length != y.data.length){
      throw "Sizes do not match";
    }
    else return true;
  },

  "add": function(desc){
    if(this.checkSizes(this, desc)) return this.map((x,i) => x + desc.data[i]);
  },

  "subtract": function(desc){
    if(this.checkSizes(this, desc)) return this.map((x,i) => x - desc.data[i]);
  },

  "multiply": function(desc){
    if(this.checkSizes(this, desc)) return this.map((x,i) => x * desc.data[i]);
  },

  "over": function(desc){
    if(this.checkSizes(this, desc)) return this.map((x,i) => x / desc.data[i]);
  },

  "and": function(desc){
      if(this.checkSizes(this, desc)) return this.map((x,i) => x && desc.data[i]);
  },

  "or": function(desc){
      if(this.checkSizes(this, desc)) return this.map((x,i) => x || desc.data[i]);
  },

  "xor": function(desc){
      if(this.checkSizes(this, desc)) return this.map((x,i) => x == desc.data[i]? 1:0);
  }
}

},{}],3:[function(require,module,exports){
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

},{"./signal.js":5}],4:[function(require,module,exports){
let Signal = require("./signal.js");
let stats = require("./stats.js");

module.exports = {
  "sample": function(step, method = "mean"){
    let newSize = Math.ceil(this.data.length / step)
    let newData = new Float32Array(newSize);
    let newRate = this.sampleRate / step;
    let ratio = this.data.length / step;
    for (let i = 0; i < newSize; i += 1) {
      let bucketStart = Math.floor(i * step);
      let bucketEnd = Math.floor((i+1) * step);
      if(bucketStart > this.data.length - 1 ) bucketStart = this.data.length -1;
      if(bucketEnd > this.data.length -1 ) bucketEnd = this.data.length -1;
      if(bucketStart === bucketEnd) {
        if(i>0) newData[i]  = newData[i-1];
      }
      else newData[i]  = stats[method](this.data.slice(bucketStart, bucketEnd));
    }
    return new Signal(newData, newRate, this.type);
  }
};

},{"./signal.js":5,"./stats.js":6}],5:[function(require,module,exports){
class Signal{

  constructor(data, sampleRate, type = 0, min = null, max = null){
    if(data instanceof Array && data[0] instanceof Float32Array){
      this.rank = 2;
    }
    else if(data instanceof Float32Array){
      this.rank = 1;
    }
    else throw "invalid data type"

    this.data = data;
    this.sampleRate = sampleRate;
    this.type = type;
    if (min === null||max===null)this.computeRange();
    else {
      this.max = max;
      this.min = min;
    }
  }
  _computeRange1D(){
    let max = this.data[0];
    let min = this.data[0];
    for(let i=1;i<this.data.length;i++){
        if (this.data[i] > max){max = this.data[i]};
        if (this.data[i] < min){min = this.data[i]};
      }
    this.max = max;
    this.min = min;
  }

  _computeRange2D(){
    let max = this.data[0][0];
    let min = this.data[0][0];
    for(let i=1;i<this.data.length;i++){
        for(let j=1;j<this.data[i].length;j++){
          if (this.data[i][j] > max){max = this.data[i][j]};
          if (this.data[i][j] < min){min = this.data[i][j]};
        }
    }
    this.max = max;
    this.min = min;
  }


  computeRange(){
    if (this.type === Signal.TYPE_BINARY) {
      this.min = 0; this.max = 1;
    }
    else{
      if (this.rank === 1) this._computeRange1D();
      if (this.rank === 2) this._computeRange2D();
    }
    this.range = this.max - this.min;
    return this;
  }

  get length(){
    return this.data.length;
  }

  get nBands(){
    if (this.rank ==1) return 1;
    else if (this.rank ==2) return this.data[0].length;
    else throw "Invalid signal dimensions";
  }

  clone(){
    return new Signal(
      this.data.slice(), this.sampleRate,
      this.type, this.min, this.max
    );
  }

  map(f, newType = null, newMin = null, newMax= null){
    return new Signal(
      this.rank==2?this.data.map(x=>x.map(f)):this.data.map(f),
      this.sampleRate,
      newType? newType:this.type,
      newMin!==null? newMin:this.min,
      newMax!==null? newMax:this.max
    );
  }

  draw(target, style, samplingMethod = "mean"){
    target.display.draw(this, style, target, samplingMethod);
    return this;
  }
}

Signal.TYPE_FLOAT = 0;
Signal.TYPE_INT = 1;
Signal.TYPE_BINARY = 2;

module.exports = Signal;

},{}],6:[function(require,module,exports){
module.exports = {
      "mean": function(slice){
        return slice.reduce((a,b) => a+b)/slice.length;
      },
      "median": function(slice){
        let sorted = slice.slice(0).sort((a,b) => a - b);
        let mid = Math.floor(slice.length / 2);
        if(slice.length% 2 === 0)return (sorted[mid] + sorted[mid - 1]) / 2
        else return sorted[mid]
      },
      "sample": function(slice){
        return slice[Math.floor(slice.length / 2)];
      },
      "std": function(slice){
        let mean = slice.reduce((a,b) => a+b) / slice.length;
        let diffs = slice.map(x => Math.pow(x - mean, 2));
        return Math.sqrt(diffs.reduce((a,b) => a + b)) / slice.length;
      },
      "max": function(slice){
        return slice.reduce((a,b) => Math.max(a,b)) ;
      },
      "min": function(slice){
        return slice.reduce((a,b) => Math.min(a,b)) ;
      }
};

},{}],7:[function(require,module,exports){
let stats = require("./stats.js");
let unaryops = {
  "threshold" : function(th){
    return this.map(
      x => x > th,
      2, 0, 1
    );
  },
  "slice" : function(from, to, unit = "samples"){
    if (unit === "seconds"){
      from = Math.round(from * this.sampleRate);
      to = Math.round(to * this.sampleRate);
    }
    let clone = this.clone();
    clone.data = clone.data.slice(from, to);
    clone.computeRange();
    return clone;
  },
  "normalize":function(){
    let newDesc = this.map(x => (x-this.min)/this.range);
    newDesc.min = 0;
    newDesc.max = 1;
    return newDesc;
  },
  "offset":function(num){return this.map(x => x+num)},
  "log" : function(){return this.map(Math.log).computeRange()},
  "square" : function(){return this.map(x => Math.pow(x,2))},
  "pow" : function(n){return this.map(x => Math.pow(x,n))},
  "exp" : function(){return this.map(Math.exp)},
  "sqrt" : function(){return this.map(Math.sqrt)},
  "abs" : function(){return this.map(Math.abs)},
  "scale" : function(num){return this.map(x => x*num)},
  "reflect" : function(num){return this.map(x => this.max - x)},
  "diff" : function(){
    return this.map((x,i) => i==0?i:x-this.data[i-1]).computeRange();
  },
  "delay" : function(n){
    return this.map((x,i) => i<=n?0:this.data[i-n]).computeRange();
  },

  "smooth": function(n, stat = "mean"){
    let nPrev = Math.floor(n/2);
    let newDesc = this.map((x,i) =>
        i<=nPrev?
          stats[stat](this.data.slice(0, n - i)):
          stats[stat](this.data.slice(i - nPrev, i + n - nPrev))
    );
    newDesc.computeRange();
    return newDesc;
  },

  "schmitt": function(th0, th1){
    let result = this.clone();
    let state = 0;
    for(let i = 0;  i < this.length; i++){
      let newState  = state;
      if  (state === 0 && this.data[i] > th0) newState =  1;
      else if (state === 1 && this.data[i] < th1) newState =  0;
      state = newState;
      this.data[i] = state;
    }
    return this;
  },

  "slide" : function (up,down){
    up = Math.max(up,1);
    down = Math.max(down,1);
    let previous = 0;
    let slide = 1;
    for(let i = 0;  i < this.length; i++){
      let current  = this.data[i];
      if  (current >= previous)
        slide =  up;
      else
        slide = down;
      this.data[i] = previous + ((current - previous)/slide);
      previous = this.data[i];
    }
    this.computeRange();
    return this;
  }

}

module.exports = unaryops;

},{"./stats.js":6}]},{},[1])(1)
});
