const path = require('path');
const Runtime = require("../../core/Runtime");
const Network = require("../../core/Network");
const Reader = require('../censor/reader');
const Logger = require('../censor/logger');
const FilterMap = require('./FilterMap');

const runtime = new Runtime();
const network = new Network({ runtime });

const net = {
  name: 'Main',
  inports: [{ name: 'OPT' }, { name: 'Cond' }, { name: 'Prefix' }],
  outports: [],
  buildSubnet: subnet => {
    const loggerProc = subnet.addProcess(Logger, 'Logger');
    const readerProc = subnet.addProcess(Reader, 'Reader');
    const filterMapProc = subnet.addProcess(FilterMap, 'FilterMap');
    
    network.connect(readerProc, 'OUT', filterMapProc, 'IN');
    network.connect(readerProc, 'ERR', loggerProc, 'IN');
    network.connect(filterMapProc, 'OUT', loggerProc, 'IN');

    subnet.connectMother(readerProc, 'OPT');
    subnet.connectMother(filterMapProc, 'Prefix');
    subnet.connectMother(filterMapProc, 'Cond');    
  }
}


const main = network.addProcess(net, 'Main');

network.initialize(main, 'OPT', path.join(__dirname, './infile'));
network.initialize(main, 'Cond', 'bruh');
network.initialize(main, 'Prefix', 'message: ');

network.run({ trace: false });