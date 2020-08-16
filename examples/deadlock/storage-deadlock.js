const path = require('path');
const Runtime = require("../../core/Runtime");
const Network = require("../../core/Network");
const Reader = require('../censor/reader');
const { IPType } = require('../../core/constants');

const Count = {
  inports: [{ name: 'IN' }],
  outports: [{ name: 'OUT' }, { name: 'Count' }],
  async execute() {
    const inPort = this.getPort('IN');
    const outPort = this.getPort('OUT');
    const countPort = this.getPort('Count');
    let ip;
    let counter = 0;
    
    while ((ip = await inPort.receiveIp()) && ip !== null) {
      await outPort.send(ip);
      await countPort.send(this.createIp(++counter));
    }
  }
}

const Concat = {
  inports: [{ name: 'IN[0]' }, { name: 'IN[1]' }],
  outports: [{ name: 'OUT' }],
  async execute() {
    const inPort0 = this.getPort('IN[0]');
    const inPort1 = this.getPort('IN[1]');
    const outPort = this.getPort('OUT');
    
    const processInPort = async port => {
      let ip;
      while ((ip = await port.receiveIp()) && ip !== null) {
        await outPort.send(ip);
      }
    };

    await Promise.all([
      processInPort(inPort0),
      processInPort(inPort1)
    ]);
  }
}

const Print = {
  inports: [{ name: 'IN' }],
  outports: [],
  async execute() {
    const inPort = this.getPort('IN');
    
    let ip;
    while ((ip = await inPort.receiveIp()) && ip !== null) {
      if (ip.type === IPType.OpenBracket || ip.type === IPType.ClosedBracket) {
        console.log('===================================')
      } else {
        console.log(ip.content);
      }

      this.dropIp(ip);
    }
  }
}

const runtime = new Runtime();
const network = new Network({ runtime });

const readerProc = network.addProcess(Reader, 'Reader');
const countProc = network.addProcess(Count, 'Count');
const concatProc = network.addProcess(Concat, 'Concat');
const printProc = network.addProcess(Print, 'Print');

network.connect(readerProc, 'OUT', countProc, 'IN');
network.connect(countProc, 'OUT', concatProc, 'IN[0]');
network.connect(countProc, 'Count', concatProc, 'IN[1]');
network.connect(concatProc, 'OUT', printProc, 'IN');

network.initialize(readerProc, 'OPT', path.join(__dirname, './infile'));

network.run({ trace: false });