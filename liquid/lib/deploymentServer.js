var log = require('debug')("ljs:deploymentServer");
var config = require('../config');
var codes = require('./codes');
var path = require('path')
var fs = require('fs')
var express = require('express')
var app = express()
var cors = require('cors')
var http = require('http').Server(app)
var io = require('socket.io')(http)

var publicFolder = undefined
var applicationFolder = undefined

/*
 * Starts listening on application.port and specify routes
 */
function openServerRoutes() {
	http.listen(config.deploymentServer.port)

	app.get('/', function(req,res){
		var data = {
			title: config.title,
			components: config.components,
			deploymentServer: config.deploymentServer,
			stateServer: config.stateServer,
			signalingServer: config.signalingServer
		}

		res.render('index.jade', data)
	})

	app.get('/echo', function(req,res){
		res.status(200).send('ok')
	})
}

var openServer = function() {
	publicFolder = path.join(__dirname, '..', 'public')
	applicationFolder = path.join(publicFolder, config.folder, 'public')

	app.set('view engine', 'jade');
	app.set('views', path.join(__dirname, '..', 'views'))
	app.use(cors());
	app.use(express.static(publicFolder))
	app.use(express.static(applicationFolder))

	openServerRoutes()
}

if(config.deploymentServer.enable) {
  openServer()
  log('Deployment server started on port ' + config.deploymentServer.port)
} else {
  log('Deployment server not enabled')
}