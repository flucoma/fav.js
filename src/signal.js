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
