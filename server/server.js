const HTTPS_PORT = process.env.PORT || 8443;

const fs = require('fs');
const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// Yes, TLS is required
const serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// ----------------------------------------------------------------------------------------

const app = express();
app.use(express.static('client-datachannel')); // Use datachannel example for now

const httpsServer = https.createServer(serverConfig, app);
httpsServer.listen(HTTPS_PORT,'0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({server: httpsServer});

wss.on('connection', function(ws) {
  if (wss.clients.size > 2) {
    // we support at most 2 clients at a time right now.
    ws.close(1002,"Closing connection, can handle at most 2 connections at a time.");
  }
  ws.on('message', function(message) {
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
  });
  ws.on('error',function(e){});
});

wss.broadcast = function(data) {
  this.clients.forEach(function(client) {
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome.\n\n\
Some important notes:\n\
  * Note the HTTPS; there is no HTTP -> HTTPS redirect.\n\
  * You\'ll also need to accept the invalid TLS certificate.\n\
  * Some browsers or OSs may not allow the webcam to be used by multiple pages at once. You may need to use two different browsers or machines.\n'
);
