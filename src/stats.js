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
