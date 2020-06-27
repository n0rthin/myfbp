const InPort = require('./InPort');
const OutPort = require('./OutPort');
const IP = require('./IP');
const { ProcessStatus } = require('./constants');
const IIPConnection = require('./IIPConnection');
const { isGeneratorFunction } = require('./utils');
const trace = require('./trace');

class Process {
  constructor({ component, runtime, name }) {
    if (!isGeneratorFunction(component.execute)) {
      throw new Error(`execute method of component "${component.name}" is not a generator`);
    }

    this.name = name;
    this.component = component;
    this._status = ProcessStatus.NotInitialized;
    this.inports = component.inports.map(portConfig => {
      return new InPort({ portConfig, runtime, proc: this });
    });
    this.outports = component.outports ? component.outports.map(portConfig => {
      return new OutPort({ portConfig, runtime, proc: this });
    }) : [];

    this._setupGenerator(component);
  }

  get status() {
    return this._status;
  }

  set status(status) {
    this.trace(`Move from ${this._status} to ${status}`);

    this._status = status;
  }

  async execute() {
    let procResult;
    
    do {
      procResult = await this.generator.next();
    } while (!(procResult.done || procResult.value.isConnectionFull));

    if (procResult.done) {
      this.status = ProcessStatus.Suspended;
      this._setupGenerator(this.component);

      this.inports.forEach(inport => {
        if (inport.connection instanceof IIPConnection) {
          inport.connection.closed = false;
        }
      });

      return null;
    }

    this.status = ProcessStatus.WaitingToSend;

    return procResult.value;
  }

  createIp(content) {
    this.trace(`Create an IP. ${content}`);

    return new IP({ content, owner: this });
  }

  dropIp(ip) {
    ip.owner = null;
    ip.content = null;
  }

  getPort(portName) {
    return (
      this.inports.find(inport => inport.name === portName) ||
      this.outports.find(outport => outport.name === portName) 
    );
  }

  _setupGenerator(component) {
    this.generator = component.execute.call(this);
  }

  trace(msg) {
    trace(`[${this.name}] ${msg}`);
  }
}

module.exports = Process;