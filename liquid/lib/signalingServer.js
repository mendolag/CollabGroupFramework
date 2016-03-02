var log = require('debug')("ljs:signalingServer");
var config = require('../config');
var PeerServer = require('peer').PeerServer;

var openServer = function() {
  var peerServer = PeerServer({port: config.signalingServer.port, path: config.signalingServer.path});

  peerServer.on('connection', function(id) {
    log('Peer connected: ' + id)
  });

  peerServer.on('disconnect', function(id) {
    log('Peer disconnected: ' + id)
  });
}

if(config.signalingServer.enable) {
  openServer()
  log('Signaling server started on port ' + config.signalingServer.port)
} else {
  log('Signaling server not enabled')
}