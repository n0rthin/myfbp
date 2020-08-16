class Callbacks {
  _callbacks = new Map();

  addCallbackToProc(proc, cbId, cb) {
    const existingCallbacks = this._callbacks.get(proc) || [];

    if (existingCallbacks.find(cbObj => cbObj.cbId === cbId)) {
      return;
    }

    const cbObj = {
      cbId,
      cb,
      err: null,
      data: null
    };

    existingCallbacks.push(cbObj);
    this._callbacks.set(proc, existingCallbacks);
  }

  isProcHasCallbacks(proc) {
    const cbs = this._callbacks.get(proc);

    return cbs && cbs.length > 0;
  }

  addCallbackDataOrErr(proc, cbId, err, data) {
    const cbObj = this.getCallback(proc, cbId);

    if (!cbObj) return;

    cbObj.data = data;
    cbObj.err = err;
  }

  callCallbackByIdOrFirst(proc, cbId) {
    let cbObj;
    
    if (cbId) {
      cbObj = this.getCallback(proc, cbId);
    } else {
      cbObj = this.getFirstCallback(proc);
    }
    
    if (!cbObj) return;

    cbObj.cb.call(null, cbObj.err, cbObj.data);
  }

  getCallback(proc, cbId) {
    const procCallbacks = this._callbacks.get(proc);

    if (!procCallbacks) return null;

    const cbObj = procCallbacks.find(cbObj => cbObj.cbId === cbId);

    if (!cbObj) return null;

    return cbObj;
  }

  removeCallback(proc, cbId) {
    const procCallbacks = this._callbacks.get(proc);

    if (!procCallbacks) return;

    const cbIndex = procCallbacks.findIndex(cbObj => cbObj.cbId === cbId);

    if (cbIndex === -1) return;

    procCallbacks.splice(cbIndex, 1);
  }

  removeAllCallbacks(proc) {
    this._callbacks.delete(proc);
  }

  getFirstCallback(proc) {
    const procCallbacks = this._callbacks.get(proc);

    return procCallbacks && procCallbacks.length > 0 ? procCallbacks[0] : null;
  }
}

module.exports = Callbacks;