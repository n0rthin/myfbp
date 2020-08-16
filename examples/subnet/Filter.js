const { IPType } = require('../../core/constants');

module.exports = {
  name: 'Filter',
  inports: [{ name: 'Cond' }, { name: 'IN' }],
  outports: [{ name: 'OUT' }, { name: 'Filtered' }],
  * execute() {
    const inPort = this.getPort('IN');
    const conditionPort = this.getPort('Cond');
    const outPort = this.getPort('OUT');
    const filteredPort = this.getPort('Filtered');
    const condIp = conditionPort.receiveIp();
    const cond = condIp.content

    if (condIp) this.dropIp(condIp);
    
    let ip = inPort.receiveIp();

    while (ip) {
      if (ip.type === IPType.OpenBracket || ip.type === IPType.ClosedBracket) {
        this.dropIp(ip);
        ip = inPort.receiveIp();
        continue;
      }

      if (ip.content.indexOf(cond) > -1) {
        yield outPort.send(ip);
      } else {
        if (filteredPort.connection) {
          yield filteredPort.send(ip);
        } else {
          this.dropIp(ip);
        }
      }

      ip = inPort.receiveIp();
    }
  }
}