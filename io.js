"use strict";

class io {

  /**
   * @param {SocketIO.Server} io Socket.io Server
   */
  create(io) { this.io = io; return this.io }
  use() { this.io.use(arguments); }

}

module.exports = new io();