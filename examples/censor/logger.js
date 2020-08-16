module.exports = {
  name: 'Logger',
  inports: [{ name: 'Prefix' }, { name: 'IN' }],
  async execute() {
    const inPort = this.getPort('IN');
    const prefixPort = this.getPort('Prefix');
    const prefixIp = await prefixPort.receiveIp();
    const prefix = prefixIp ? prefixIp.content : '';

    if (prefixIp) this.dropIp(prefixIp);
    
    let ip = await inPort.receiveIp();

    while (ip) {
      console.log(prefix + ip.content);
      
      this.dropIp(ip);

      ip = await inPort.receiveIp();
    }
  }
}