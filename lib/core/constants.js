const Enum = require('./Enum');

const ProcessStatus = Enum([
  'NotInitialized',
  'Active',
  'WaitingToSend',
  'WaitingToReceive',
  'ReadyToExecute',
  'Suspended',
  'PendingCallback',
  'Closed',
  'Done'
]);

const IPType = Enum([
  'Normal',
  'OpenBracket',
  'ClosedBracket'
]);

module.exports = {
  ProcessStatus,
  IPType
}