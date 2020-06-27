class Port {
  constructor({ portConfig, runtime, proc }) {
    this.name = portConfig.name;
    this.proc = proc;
    this.runtime = runtime;
    this.connection = null;
  }

  setConnection(conn) {
    this.connection = conn;
  }
}

module.exports = Port;