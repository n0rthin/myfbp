const Enum = require('./Enum');

const ProcessStatus = Enum([
  'NotInitialized',
  'Active',
  'WaitingToSend',
  'ReadyToExecute',
  'Suspended',
  'Closed',
  'Done'
]);

module.exports = {
  ProcessStatus
}