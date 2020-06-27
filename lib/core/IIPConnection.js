const Connection = require('./Connection');

class IIPConnection extends Connection {
  constructor({ iipContent }) {
    super();
    this.iipContent = iipContent;
  }
}

module.exports = IIPConnection;