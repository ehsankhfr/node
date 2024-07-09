'use strict';

const {
  ReflectApply,
  SafeMap,
} = primordials;

class ClusterUtils {
  constructor() {
    this.callbacks = new SafeMap();
    this.seq = 0;
  }

  sendHelper(proc, message, handle, cb) {
    if (!proc.connected) {
      return false;
    }

    // Mark message as internal. See INTERNAL_PREFIX in lib/internal/child_process.js
    message = { cmd: 'NODE_CLUSTER', ...message, seq: this.seq };

    if (typeof cb === 'function') {
      this.callbacks.set(this.seq, cb);
    }

    this.seq += 1;
    return proc.send(message, handle);
  }

  // Returns an internalMessage listener that hands off normal messages
  // to the callback but intercepts and redirects ACK messages.
  internal(worker, cb) {
    return (message, handle) => {
      if (message.cmd !== 'NODE_CLUSTER') {
        return;
      }

      let fn = cb;

      if (message.ack !== undefined) {
        const callback = this.callbacks.get(message.ack);

        if (callback !== undefined) {
          fn = callback;
          this.callbacks.delete(message.ack);
        }
      }

      ReflectApply(fn, worker, arguments);
    };
  }
}

const clusterUtils = new ClusterUtils();

module.exports = {
  sendHelper: clusterUtils.sendHelper.bind(clusterUtils),
  internal: clusterUtils.internal.bind(clusterUtils),
};
