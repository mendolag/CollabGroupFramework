var debug = require('debug')
var log = debug("lf:webRTCServer")

var root = require('../applicationConstructor.js')
console.log(root)

var path = require('path')
var express = require('express')
var app = express()
var http = require('http').Server(app)

var statisticsIO = require('socket.io')(http)

app.set('view engine', 'jade');

var PeerServer = require('peer').PeerServer
var Topology = undefined

var isOpen = false
var __port = undefined
var __path = undefined
var __server = undefined
var __key = undefined
var __topology = undefined

module.exports = function(application){

	// var update = setInterval(function(){
	// 	statisticsIO.sockets.emit('graph', __topology.getTopology())
	// }, 3000)

	statisticsIO.on('connection', function(socket){
		socket.on("getGraph", function(){
			var t = __topology.getTopology()

			socket.emit("graph", t)
		})
	})

	var peerMessage = function(data, device_id) {
		var type = data.type
		switch(type) {
			case "connect":
					__topology.getNewConnection(device_id)
				break;
			case "add_link":
				var from = data.from
				var to = data.to

				__topology.addLink(from, to)

				break;
			case "remove_link":
				var from = data.from
				var to = data.to

				__topology.removeLink(from, to)

				break;
			default:
				console.log("Received from peer an undefined message: " + type)
				break;
		}
	}

	// var getNewConnection = function(__device_id, cb) {
	// 	__topology.getNewConnection(__device_id, function(data){

	// 		application.sockets[application.devices[__device_id]].emit('peer_connect', data)

	// 	})
	// }

	var open = function() {
		if(isOpen) {
			log('Already opened')
		} else {
			__server = PeerServer({
				port: __port,
				path: __path,
				key: __key
			})
			
			__server.on('connection', function(id){
				log('Connected: ' + id)

				var temp_id = id.split("_")
				temp_id = parseInt(temp_id[1])

				__topology.addNode(temp_id)
			})

			__server.on('disconnect', function(id){
				log('Disconnected: ' + id)

				var temp_id = id.split("_")
				temp_id = parseInt(temp_id[1])

				__topology.removeNode(temp_id)
			})

			http.listen(__port+1, function(){
				log('Graph server started on port ' + __port+1)
			})	

			app.get('/', function(req,res){
				res.render('graph.jade', {})
			})

			isOpen = true
		}
	}

	var variableForwarding = function(state) {
		topology.variableForwarding(state)
	}

	// Initialization
	var WebRTCServer = function (port, path, key, topology, privateFolder, publicFolder) {


		__port = port
		__path = path
		__key = key

		app.use(express.static(publicFolder))
		app.use(express.static(privateFolder))

		
		Topology = require("./topologies/" + topology + ".js")(application)
		__topology = new Topology()
	}

	// Public class methods
	WebRTCServer.prototype = {
		open: open,
		peerMessage: peerMessage,
		variableForwarding: variableForwarding
	}

	return WebRTCServer;
}

// Exports
// module.exports = WebRTCServer