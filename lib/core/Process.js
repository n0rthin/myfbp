const InPort = require('./InPort');
const OutPort = require('./OutPort');
const IP = require('./IP');
const { ProcessStatus, IPType } = require('./constants');
const IIPConnection = require('./IIPConnection');
const { isGeneratorFunction } = require('./utils');
const trace = require('./trace');

class Process {
  constructor({ component, runtime, name }) {
    // if (!isGeneratorFunction(component.execute)) {
    //   throw new Error(`execute method of component "${component.name}" is not a generator`);
    // }

    this.name = name;
    this._ownedIps = 0;
    this.component = component;
    this._status = ProcessStatus.NotInitialized;
    this.inports = component.inports.map(portConfig => {
      return new InPort({ portConfig, runtime, proc: this });
    });
    this.outports = component.outports ? component.outports.map(portConfig => {
      return new OutPort({ portConfig, runtime, proc: this });
    }) : [];
  }

  get ownedIps() {
    return this._ownedIps;
  }

  set ownedIps(ownedIps) {
    this.trace('Owned ips ' + ownedIps);
    this._ownedIps = ownedIps;
  }

  get status() {
    return this._status;
  }

  set status(status) {
    this.trace(`Moving from ${this._status} to ${status}`);

    this._status = status;
  }

  async execute() {
    (async () => {
      await this.component.execute.call(this);

      this.status = ProcessStatus.Suspended;

      this.inports.forEach(inport => {
        if (inport.connection instanceof IIPConnection) {
          inport.connection.closed = false;
        }
      });
    })();
  }

  createOpenBracketIp(content) {
    return this.createIp(content, IPType.OpenBracket);
  }

  createClosedBracketIp(content) {
    return this.createIp(content, IPType.ClosedBracket);
  }

  createIp(content, type = IPType.Normal) {
    this.trace(`Create an IP. ${content}`);
    
    this.ownedIps++;
    return new IP({ content, owner: this, type });
  }

  dropIp(ip) {
    if (!ip) return;
    
    ip.owner = null;
    ip.content = null;

    this.ownedIps--;
  }

  getPort(portName) {
    return (
      this.inports.find(inport => inport.name === portName) ||
      this.outports.find(outport => outport.name === portName) 
    );
  }

  trace(msg) {
    trace(`[${this.name}] ${msg}`);
  }
}

module.exports = Process;