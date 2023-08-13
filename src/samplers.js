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
        newData[I] = this.data[bucketStart];
      }
      else newData[i]  = stats[method](this.data.slice(bucketStart, bucketEnd));
    }
    return new Signal(newData, newRate, this.type);
  }
};
