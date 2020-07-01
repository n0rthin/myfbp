module.exports = {
  name: 'Map',
  inports: [{ name: 'Prefix' }, { name: 'IN' }],
  outports: [{ name: 'OUT' }],
  * execute() {
    const inPort = this.getPort('IN');
    const prefixPort = this.getPort('Prefix');
    const outPort = this.getPort('OUT');
    const prefixIp = prefixPort.receiveIp();
    const prefix = prefixIp ? prefixIp.content : '';

    if (prefixIp) this.dropIp(prefixIp);
    
    let ip = inPort.receiveIp();

    while (ip) {      
      outPort.send(this.createIp(prefix + ip.content));

      this.dropIp(ip);
      ip = inPort.receiveIp();
    }
  }
}