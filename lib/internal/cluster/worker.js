'use strict';

const {
  ReflectApply,
} = primordials;

const EventEmitter = require('events');

const { kEmptyObject } = require('internal/util');

class Worker extends EventEmitter {
  constructor(options) {
    super();

    if (options === null || typeof options !== 'object')
      options = kEmptyObject;

    this.exitedAfterDisconnect = undefined;

    this.state = options.state || 'none';
    this.id = options.id | 0;

    if (options.process) {
      this.process = options.process;
      this.process.on('error', (code, signal) =>
        this.emit('error', code, signal),
      );
      this.process.on('message', (message, handle) =>
        this.emit('message', message, handle),
      );
    }
  }

  kill() {
    ReflectApply(this.destroy, this, arguments);
  }

  send() {
    return ReflectApply(this.process.send, this.process, arguments);
  }

  isDead() {
    return this.process.exitCode != null || this.process.signalCode != null;
  }

  isConnected() {
    return this.process.connected;
  }
}

module.exports = Worker;
