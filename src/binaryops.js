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
