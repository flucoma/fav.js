let audioCtx = new AudioContext();
let sr = audioCtx.sampleRate;
let loadAudioFile = function(url, done){
  let req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.responseType = "arraybuffer";
  req.onload = function() {
      audioCtx.decodeAudioData(req.response, done);
  }
  req.send();
}
let barkBandsFilter = xtract_init_bark(24, sr);

let hann = function(buf){
  let l = buf.length;
  let TWO_PI = 6.283185307179586;
  for ( let i = 0; i < l; i++ ) {
   buf[i] *= 0.5 * (1 - Math.cos(TWO_PI * i / (l - 1)));
  }
  return buf;
}

let frameExtractors = {
    // time domain
    "f0": (frame) => xtract_f0(frame, sr),
    "zcr": (frame) => xtract_zcr(frame),
    "rms": (frame) => xtract_rms_amplitude(frame),
    "asdf": (frame) => xtract_asdf(frame),//not working
    "yin": (frame) => xtract_yin(frame), //not working
    // freq domain
    "hps": (frame) =>  xtract_hps(xtract_spectrum(hann(frame),sr)),
    "spectral_centroid": (frame) =>  xtract_spectral_centroid(xtract_spectrum(hann(frame),sr)),
    "spectral_mean": (frame) =>  xtract_spectral_mean(xtract_spectrum(hann(frame),sr)),
    "spectral_variance": (frame) =>  xtract_spectral_variance(xtract_spectrum(hann(frame),sr)),
    "spectral_spread": (frame) =>  xtract_spectral_spread(xtract_spectrum(hann(frame),sr)),
    "spectral_skewness": (frame) =>  xtract_spectral_skewness(xtract_spectrum(hann(frame),sr)),
    "slope": (frame) =>  xtract_spectral_slope(xtract_spectrum(hann(frame),sr)),
    "spectrum": (frame) =>  Float32Array.from(xtract_spectrum(hann(frame),sr, true,false).slice(0, frame.length/2)),
    "bark_bands": (frame) => Float32Array.from(xtract_bark_coefficients(xtract_spectrum(frame,sr, false,false), barkBandsFilter))
  };


let getSignal = function(audio, name, windowSize = 1024, hopSize = 256){
  let frames = new Array();
  let nHops = Math.floor(
      (audio.length - windowSize) / parseFloat(hopSize)
  );
  let desc = new Float32Array(nHops);
  if(name == "spectrum" || name=="bark_bands") desc = new Array(nHops);
  for (let n = 0; n < nHops; n++){
    let start = n * hopSize;
    let end = start + windowSize;
    let frame = audio.slice(start, end);
    desc[n] = frameExtractors[name](frame);
  }
  return new fav.Signal(desc, sr/hopSize);
}
