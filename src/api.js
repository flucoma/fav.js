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
