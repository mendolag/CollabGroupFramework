var debug = require('debug')
var log = debug("lf:application")

var path = require('path')
var fs = require('fs')
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var forwarding = ['webrtc', 'socket']

app.set('view engine', 'jade');

var application = {
	id_progression: 0,
	socket_subscriptions: {},
	devices: {},
	sockets: {},
	usernames: {}
}

// var databaseManager = require('./databaseManager.js')
// var WebRTCServer = require('./webrtc/webRTCServer.js')(application)

process.on('message' , function(m) {
	switch(m.type) {
		default:
			log('Received message type unknown: ' + m.type)
			break;
	}
})

var id = process.argv[2]
log('Starting application: ' + id)

var location = process.argv[3]
var bowerFolder = path.join(path.join(__dirname, '..'), 'bower_components')
var privateFolder = path.join(path.join(__dirname, '..'), 'components')
var publicFolder = location+id+'/public'

application.commons = {}
var commons = require(publicFolder + '/scripts/commons.js').__load_commons()
for(var c in commons) {
	application.commons[c] = commons[c]
}

log(id + ': Reading config file')
var config = loadJSON(location+id+'/config.json')

var code = validateConfig()
if(code == codes.no_error) {
	// State initialisation
	application.state = {}
	for(var v in application.globals) {
		application.state[v] = application.variables_initialisation[v]
	}

	// Configs processing
	// application.group_sharing = {}
	// for(var i = 0; i < application.groups.length; i++) {
	// 	var group = application.groups[i]
	// 	application.group_sharing[group] = {}

	// 	for(var j = 0; j < application.globals.length; j++) {
	// 		var variable = application.globals[j]
	// 		application.group_sharing[group][variable] = false
	// 	}
	// }

	// for(var variable in application.sharing) {
	// 	var groups = application.sharing[variable]
	// 	for(var i = 0; i < groups.length; i++) {
	// 		var group = groups[i]
	// 		application.group_sharing[group][variable] = true
	// 	}
	// }

	// for(var i = 0; i < application.groups.length; i++) {
	// 	var group = application.groups[i]
	// 	application.socket_subscriptions[group] = []
	// }

	app.use(express.static(publicFolder))
	app.use(express.static(privateFolder))
	app.use(express.static(bowerFolder))

	openServerRoutes()
	// openWebRTCServer()
	// databaseManager.connect(application.database.url)
} else {
	log("Error " + code)
	//TODO close process? restart? etc
}

/*
 * Socket.io
 */
io.on('connection', function(socket){
	var __id = socket.id
	var __device_id = undefined

	socket.emit('handshake' , {})

	socket.on('handshake', function(message){
		var type = message.type

		switch(type) {
			case 'new':
				__device_id = createID()

				application.sockets[__id] = socket
				application.devices[__device_id] = __id
				application.usernames[__device_id] = __device_id

				socket.emit('connected', {
					id: __device_id,
					locals: application.locals_subscriptions,
					globals: application.globals_subscriptions,
					initialisations: application.variables_initialisation,
					state: application.state,
					servers: {
						webrtc: application.webrtc,
						xmpp: application.xmpp,
						wsliquid: application.wsliquid
					},
					pages: application.pages,
					permissions: application.permissions
				})
				io.sockets.emit('deviceList', {devices: application.usernames}) 
				log('Connected: ' + __device_id)
				break;
			case 'reconnect':
				__device_id = message.id
				var name = message.username

				if(!isValidUsername(name)) {
					name = __device_id
				}

				application.sockets[__id] = socket
				application.devices[__device_id] = __id
				application.usernames[__device_id] = name

				log('Reconnected: ' + __device_id)
				socket.emit('reconnected', {})
				break;
			default:
				console.log('Error on handshake: Message type: ' + message.type)
				break;
		}	
	})

	socket.on('username', function(data) {
		var name = data.name

		if(isValidUsername(name)) {
			application.usernames[__device_id] = name
			io.sockets.emit('deviceList', {devices: application.usernames})	
		} else {
			//TODO: low priority
		}
	})

	// var id = socket.id
	// var _group = undefined
	// var _page = undefined

	// socket.on('subscribe', function(data) {
	// 	log('Client ' + id + ' subscribed: {page: ' + data.page + ', subscription: ' + data.subscription + '}' )

	// 	_page = data.page
	// 	_group = data.subscription

	// 	application.socket_subscriptions[_group].push(socket)

	// 	var response = {
	// 		id: id,
	// 		state: variableJSON(_group),
	// 		executions: executionJSON(_group)
	// 	}

	// 	socket.emit('init', response)
	// })

	// socket.on('change', function(data){
	// 	console.log(data)
	// 	var v = data.v
	// 	var value = data.value

	// 	value = executeVariable(v, value)

	// 	application.state[v] = value

	// 	var ss = getSubscribedSockets(v)
		
	// 	for(var i = 0; i < ss.length; i++){
	// 		var s = ss[i]
	// 		if(s.id != id) {
	// 			s.emit('change', {
	// 				v: v,
	// 				value: value
	// 			})
	// 		}
	// 	}
	// })

	socket.on('state', function(data) {
		for(var v in data) {
			var value = data[v]

			application.state[v] = value

			var name = v + "_processing"
			application.commons[name]
			if(typeof(application.commons[name]) == 'function') {
	          application.commons[name](value)
	        }

	        //TODO send only if necessary
	        var o = {}
	        o[v] = value
			variableForwarding(o)
		}
	})

	socket.on('local', function(data) {
		var local = data.local
		var type = data.type
		var device = data.device 
		var windowId = data.windowId
		var token = data.token
		var from = data.from
		var pair = data.pair

		application.sockets[application.devices[device]].emit('local', {
			local: local,
			type: type,
			device: device,
			windowId: windowId,
			token: token,
			from: from,
			pair: pair
		})
	})

	socket.on('newWindow', function(data){
		var device = data.device
		var page = data.page
		var locals = data.locals
		var pair = data.pair
		var from = data.from

		var s = application.sockets[application.devices[device]].emit('newWindow',{
			page: page,
			locals: locals,
			pair: pair,
			from: from
		})

	})

	// socket.on('peer', function(data){
	// 	application.webRTCServer.peerMessage(data, __device_id)
	// })

	socket.on('disconnect', function() {
		delete application.sockets[__id]
		delete application.devices[__device_id]
		delete application.usernames[__device_id]

		io.sockets.emit('deviceList', {devices: application.usernames})
	})

	// socket.on('disconnect', function() {
	// 	for(var i = 0; i < application.socket_subscriptions[_group].length; i++) {
	// 		if(application.socket_subscriptions[_group][i].id == id) {
	// 			application.socket_subscriptions[_group].splice(i,1)
	// 			break;
	// 		}
	// 	}
	// })
});

application.commons._set = function(v, value) {
	application.state[v] = value

	var name = v + "_processing"
	var f = application.commons[name]
	if(typeof(application.commons[name]) == 'function') {
      application.commons[name](value)
    }

	onVariableChange(v, value)

}

application.commons._get = function(v) {
	return application.state[v]
}

/*
 * Input: 
 *		v: the name of the variable
 *
 * Returns an array of all the sockets that need to be updated
 */
function getSubscribedSockets(v) {
	var socket_array = []

	var subscriptions = application.sharing[v]

	for(var i = 0; i < subscriptions.length; i++) {
		var ss = application.socket_subscriptions[subscriptions[i]]
		for(var j = 0; j < ss.length; j++) {
			var s = ss[j]
			socket_array.push(s)
		}
	}

	return socket_array
}

/*
 * Input: 
 *		group: the name of the subscription group
 *
 * Returns a JSON with the values of the states needed to the subscription group
 */
function variableJSON(group) {
	var data = {}

	var variables = application.group_sharing[group]
	for(var variable in variables) {
		if(application.group_sharing[group][variable] == true) {
			data[variable] = application.state[variable]
		}
	}

	return data
}

/*
 * Input: 
 *		group: the name of the subscription group
 *
 * Returns a JSON with the executions specifications needed to the subscription group
 */
function executionJSON(group) {
	var data = {}

	var variables = application.group_sharing[group]
	for(var variable in variables) {
		if(application.group_sharing[group][variable] == true) {
			data[variable] = application.executions[variable]
		}
	}

	return data
}

/*
 * Returns a unique ID
 */
function createID() {
	var date = new Date()
	// application.id_progression = application.id_progression + 1
	// return application.id_progression
	return date.getTime()
} 

/*
 * Starts listening on application.port and specify routes
 */
function openServerRoutes() {
	http.listen(application.port, function(){
		log('Application started on port ' + application.port)
	})

	app.get('/', function(req,res){
		var data = {
			title: application.title,
			pages: application.pages
		}

		res.render('index.jade', data)
	})

	app.get('/var', function(req,res){

		res.json(application.state)
	})

	// for(var p in application.pages) {
	// 	var page = application.pages[p]
	// 	var head = application.views[page] + '_head.html'
	// 	var body = application.views[page] + '_body.html'
	// 	var scripts = application.scripts[page] != undefined ? application.scripts[page]:[]
	// 	var styles = application.styles[page] != undefined ? application.styles[page]:[]

	// 	openRoute(page, head, body, scripts, styles)
	// }
}

/*
 * Starts a webRTC server listening to port: application.port + 1
 */
// function openWebRTCServer() {
// 	if(application.webrtc.enable == true) {
// 		var port = application.webrtc.port || (application.port + 1)
// 		var path = application.webrtc.path || "/"
// 		var key = application.webrtc.key || ""
// 		var topology = application.webrtc.topology || "tree"

// 		var server = new WebRTCServer(port, path, key, topology, privateFolder, publicFolder)
// 		server.open()

// 		application.webRTCServer = server
// 	}
// }

/*
 * Input: 
 *		name: name of the page associated to the route
 *		body: path to the view file inside '/public/views'
 *		scripts: path to the view file inside '/public/views'
 *		css: path to the view file inside '/public/views'
 *
 * Open the route to the page
 */
function openRoute(page, head, body, scripts, styles) {
	var head_html = fs.readFileSync(publicFolder + '/views/' + head)
	var body_html = fs.readFileSync(publicFolder + '/views/' + body)

	var data = {
		page: page,
		head: head_html,
		body: body_html,
		scripts: scripts,
		styles: styles,
		subscription: application.subscriptions[page]
	}

	app.get('/' + page, function(req, res){
		res.render('template.jade', data)
	})
}

/*
 * Validation of the config file
 */
function initApplication() {
	if(config.title != undefined) {
		application.title = config.title
	}

	if(config.port == undefined) {
		return codes.config_no_port
	}
	application.port = config.port

	if(config.pages == undefined) {
		return codes.config_no_pages
	}

	application.pages = []
	application.globals = {}
	application.globals_subscriptions = {}
	application.locals = {}
	application.locals_subscriptions = {}
	for(var p in config.pages) {
		application.pages.push(p)

		if(Array.isArray(config.pages[p].globals)) {
			for(var i = 0; i < config.pages[p].globals.length; i++) {
				if(config.pages[p].globals[i] != undefined) {
					var variableName = config.pages[p].globals[i]
					if(application.globals[variableName] == undefined) {
						application.globals[variableName] = []
					}

					application.globals[variableName].push(p)
				}
			}
		
			application.globals_subscriptions[p] = config.pages[p].globals
		} else {
			return codes.config_no_globals
		}

		if(Array.isArray(config.pages[p].locals)) {
			for(var i = 0; i < config.pages[p].locals.length; i++) {
				if(config.pages[p].locals[i] != undefined) {
					var variableName = config.pages[p].locals[i]
					if(application.locals[variableName] == undefined) {
						application.locals[variableName] = []
					}

					application.locals[variableName].push(p)
				}
			}
		
			application.locals_subscriptions[p] = config.pages[p].locals
		} else {
			return codes.config_no_locals
		}
	}

	// if(config.groups == undefined) {
	// 	return codes.config_no_groups
	// }
	// application.groups = config.groups

	// if(config.variables == undefined) {
	// 	return codes.config_no_variables
	// }
	// application.globals = config.variables

	if(config.initialisation == undefined) {
		return codes.config_no_variables_init
	}
	application.variables_initialisation = {}
	for(var v in application.globals) {
		application.variables_initialisation[v] = config.initialisation[v]
	}
	for(var v in application.locals) {
		application.variables_initialisation[v] = config.initialisation[v]
	}

	if(config.variable_forwarding == undefined || forwarding.indexOf(config.variable_forwarding) == -1 ) {
		return codes.config_no_variables_forwarding
	}
	application.variable_forwarding = config.variable_forwarding

	application.permissions = {}
	if(config.permission == undefined) {
		return codes.config_no_permeission
	}
	for(var v in application.locals) {
		var p = config.permission[v]

		if(p != undefined && p.read != undefined && p.write != undefined) {
			application.permissions[v] =  {
				read: p.read,
				write: p.write
			}
		} else {
			application.permissions[v ] = {
				read: true,
				write: true
			}
		}
	}

	// for(var v in config.views) {
	// 	if(application.pages.indexOf(v) == -1) {
	// 		return codes.config_no_view_match
	// 	}
	// }
	// application.views = config.views

	// for(var s in config.scripts) {
	// 	if(application.pages.indexOf(s) == -1) {
	// 		return codes.config_no_script_match
	// 	}
	// }
	// application.scripts = config.scripts

	// for(var s in config.styles) {
	// 	if(application.pages.indexOf(s) == -1) {
	// 		return codes.config_no_css_match
	// 	}
	// }
	// application.styles = config.styles

	// for(var sub in config.subscriptions) {
	// 	if(application.pages.indexOf(sub) == -1 || application.groups.indexOf(config.subscriptions[sub]) == -1) {
	// 		return codes.config_no_sub_match
	// 	}
	// }
	// application.subscriptions = config.subscriptions

	// for(var e in config.executions) {
	// 	if(application.globals.indexOf(e) == -1) {
	// 		return codes.config_no_exe_match
	// 	}
	// }
	// application.executions = config.executions

	// for(var sha in config.sharing) {
	// 	if(application.globals.indexOf(sha) != -1) {
	// 		for(var g in config.sharing[sha]) {
	// 			if(application.groups.indexOf(config.sharing[sha][g]) == -1) {
	// 				return codes.config_no_share_match
	// 			}
	// 		}
	// 	}
	// }
	// application.sharing = config.sharing
	// if(config.webrtc == undefined) {
	// 	return codes.config_no_webrtc
	// } else {
	// 	application.webrtc = config.webrtc
	// }

	// if(config.webrtc == undefined) {
	// 	return codes.config_no_xmpp
	// } else {
	// 	application.xmpp = config.xmpp
	// }

	if(config.wsliquid == undefined) {
		return codes.config_no_wsliquid
	} else {
		application.wsliquid = config.wsliquid
	}

	// if(config.database == undefined) {
	// 	return codes.config_no_database
	// } else {
	// 	application.database = config.database
	// }

	return codes.no_error
}

function variableForwarding(state) {
	if(application.variable_forwarding == 'webrtc') {
		webRTCServer.variableForwarding(state)
	} else if(application.variable_forwarding == 'socket') {
		io.sockets.emit('state', state)
	} else {
		console.log('Internal error, variable forwarding')
	}
}

/*
 * Loads a json file as an object
 */
function loadJSON(path) {
	var encoding = 'utf8'
	var contents = {}

	try {
		contents = fs.readFileSync(path)
		contents = JSON.parse(contents)
	} catch (err) {
		log('Error reading JSON file')
		console.log(err)
	}

	return contents
}

// var executeVariable = function(v, value) {
// 	var tempValue = value

// 	if(application.executions[v] != undefined) {
// 		var f = application.executions[v][1]

// 	if(application.commons[f] != undefined) 
// 		tempValue = application.commons[f](value)
// 	}

// 	return tempValue
// }

var onVariableChange = function(v,value) {
	// var ss = getSubscribedSockets(v)
		
	// for(var i = 0; i < ss.length; i++){
	// 	ss[i].emit('change', {
	// 		v: v,
	// 		value: value
	// 	})
	// }

	//TODO send only where required
	var o = {}
	o[v] = value
	variableForwarding(o)
	// io.sockets.emit('state', o)
}

var printSockets = function() {
	console.log(io)
}

var isValidUsername = function(username) {
	if(username == undefined || username == '') {
		return false
	}

	return true
}

module.exports = {
	printSockets: printSockets
}