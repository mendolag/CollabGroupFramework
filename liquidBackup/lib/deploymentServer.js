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
			signalingServer: config.signalingServer,
			preload: config.preload
		}

		res.render('index.jade', data)
	})

	app.get('/echo', function(req,res){
		res.status(200).send('ok')
	})
}

var openServer = function() {
	bowerFolder = path.join(__dirname, '..', 'bower_components')
	applicationFolder = path.join(__dirname, '..', config.folder)
	liquidComponentFolder = path.join(__dirname, '..', 'liquidComponents')
	dependencyComponentFolder = path.join(__dirname, '..', 'components')

	app.set('view engine', 'jade');
	app.set('views', path.join(__dirname, '..', 'views'))

	app.use(cors());
	app.options('*', cors());

	app.use(express.static(bowerFolder))
	app.use(express.static(applicationFolder))
	app.use(express.static(liquidComponentFolder))
	app.use(express.static(dependencyComponentFolder))

	openServerRoutes()
}

if(config.deploymentServer.enable) {
  openServer()
  log('Deployment server started on port ' + config.deploymentServer.port)
} else {
  log('Deployment server not enabled')
}