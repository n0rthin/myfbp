function trace(message) {
  if (global.fbpTrace)
    console.log(message);
}

module.exports = trace;