const path = require('path');
const Runtime = require("../../core/Runtime");
const Network = require("../../core/Network");
const logger = require('./logger');
const reader = require('./reader');
const censor = require('./censor');
const joinLines = require('./JoinLines');

const runtime = new Runtime();
const network = new Network({ runtime });

const loggerProc = network.addProcess(logger, 'Logger');
const loggerCensoredProc = network.addProcess(logger, 'LoggerCensored');
const readerProc = network.addProcess(reader, 'Reader');
const censorProc = network.addProcess(censor, 'Censor');
const joinLinesProc = network.addProcess(joinLines, 'JoinLines');

network.connect(readerProc, 'ERR', loggerProc, 'IN');
network.connect(readerProc, 'OUT', censorProc, 'IN');
network.connect(censorProc, 'OUT', joinLinesProc, 'IN');
network.connect(joinLinesProc, 'OUT', loggerProc, 'IN');
network.connect(censorProc, 'Censored', loggerCensoredProc, 'IN');

network.initialize(readerProc, 'OPT', path.join(__dirname, './infile'));
network.initialize(loggerCensoredProc, 'Prefix', 'Censored: ');
network.initialize(censorProc, 'BlackList', 'Tramp,war,black,nigga');
network.run({ trace: true });