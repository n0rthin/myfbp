const { IPType } = require('./constants');

class IP {
  constructor({ content, owner, type = IPType.Normal }) {
    this.content = content;
    this.owner = owner;
    this.type = type;
  }
}

module.exports = IP;