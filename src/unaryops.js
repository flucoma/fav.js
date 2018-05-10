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
