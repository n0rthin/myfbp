const Runtime = require('../lib/core/Runtime');
const Network = require('../lib/core/Network');
const trace = require('../lib/core/trace');

const compA = {
  name: 'CompA',
  inports: [{ name: 'IN' }, { name: 'OPT' }],
  outports: [{ name: 'OUT' }],
  * execute() {
    const optPort = this.getPort('OPT');
    const outport = this.getPort('OUT');
    const ip = optPort.receiveIp();
    
    console.log(ip.content);

    for (let i = 1; i <= 20; i++) {
      trace(`${i} ip send`);
      yield outport.send(this.createIp(i));
    }
  }
};

const compB = {
  name: 'CompB',
  inports: [{ name: 'IN' }],
  outports: [{ name: 'OUT' }],
  * execute() {
    
    const inport = this.getPort('IN');
    let ip = inport.receiveIp();

    while (ip !== null) {
      trace(`Receive ${ip.content} ip`);
  
      this.dropIp(ip);

      ip = inport.receiveIp();
    }
  }
};

const runtime = new Runtime();
const network = new Network({ runtime });

const procA = network.addProcess(compA)
const procB = network.addProcess(compB);

network.connect(procA, 'OUT', procB, 'IN');
network.initialize(procA, 'OPT', 'IIP Hello world!');
network.run();