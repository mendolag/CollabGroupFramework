//sdasd
var Liquid = (function () {
	// Devices
	var __peer = undefined
	var __peersTable = {}
	var __socket = undefined

	// Connection
	var __initialised = false
	var __connected = false
	var __deviceId = getSessionDeviceId();

	// Components
	var __componentsAvailable = {}
	var __componentsReference = {}
	var __componentsSummary = {}

	var __state = undefined
	var __commons = undefined
	var __locals = undefined

	var __state = {}
	var __counter = 0
	var __token = 0
	var __windows = {}
	var __windowReferences = {}
	var __subscriptions = {}
	var __devices = {}
	var __registeredClones = {}

	var __username = undefined


	var __loadedComponents = []
	var __importedComponents = {}

	// Events
	var __customEvents = {}
	var __listeners = {}

	// UI
	var __loading = false
	var __lastTouchedElement = undefined

	var __y = undefined

	var __defaultDeploymentComponents = [
		// {relUrl: '/bower_components/webcomponentsjs/webcomponents-lite.min.js', ext: 'script'},
		// {relUrl: '/bower_components/polymer/polymer.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-behavior/liquid-behavior.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-ui/liquid-ui.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-component-migrate/liquid-component-migrate.html', ext: 'html'}
	]

	var __defaultStatefulComponents= [
		{relUrl: '/socket.io/socket.io.js', ext: 'script'},
		{relUrl: '/components/peerjs/peerjs.js', ext: 'script'},
		{relUrl: '/bower_components/es6-promise-polyfill/promise.js', ext: 'script'},
		{relUrl: '/bower_components/yjs/y.js', ext: 'script'},
		{relUrl: '/bower_components/y-map/y-map.js', ext: 'script'},
		{relUrl: '/bower_components/y-array/y-array.js', ext: 'script'},
		{relUrl: '/bower_components/y-memory/y-memory.js', ext: 'script'},
		{relUrl: '/components/y-liquid/y-liquid-new.js', ext: 'script'},
	]

	var __config = {}
	var __defaultConfig = {
		deploymentServers: [{
			host: 'http://localhost',
			port: 8888
		}],
		stateServer: {
			host: 'http://localhost',
			port: 12304
		},
		signalingServer: {
			host: 'localhost',
			port: 12305,
			path: ''
		},
		multiDeviceDisable: false
	}

	var variable = function(v, value) {
		var o = {}	
		o[v] = value
		socket.emit('state', o)
	}

	var localClose = function(windowId, pair, clones){
		if(pair != undefined) {
			socket.emit('local', {
				type: 'pairClose',
				device: pair.device,
				token: pair.token,
				windowId: pair.windowId,
				from: __deviceId
			})
		}

		for(var i = 0; i < clones.length; i++) {
			socket.emit('local', {
				type: 'cloneClose',
				device: clones[i].device,
				token: clones[i].token,
				from: __deviceId
			})
		}
	}

	var localMove = function(windowId, clones, from) {
		for(var i = 0; i < clones.length; i++) {
			socket.emit('local', {
				type: 'cloneMove',
				device: clones[i].device,
				token: clones[i].token,
				from: from,
				pair: {
					user: __user,
					token: clones[i].token,
					device: __deviceId,
					windowId: windowId
				}
			})
		}
	}

	var localNotify = function(windowId, pair) {
		socket.emit('local', {
			type: 'notifyClone',
			device: pair.device,
			token: pair.token,
			windowId: pair.windowId,
			from: __deviceId
		})
	}

	var moveWindow = function(windowId, device, page){
		if(device != __deviceId) {
			var locals = liquid.closeWindow(windowId)
			
			var from = __deviceId
			liquid.notifyNewWindow(device, page, locals, undefined, from)
		}
	}

	var cloneWindow = function(sharedId, windowId, device, page, token) {
		var liquid_page = __windowReferences[windowId]

		var storage = liquid_page.getStorage()
		var pair = {
			user: __user,
			device: __deviceId,
			windowId: windowId,
			sharedId: sharedId,
			token: token,
			username: __user
		}

		var from = __deviceId

		liquid.notifyNewWindow(device, page, {storage: storage, clones: undefined}, pair, from)
	}

	var closeWindow = function(windowId) {
		var div = document.getElementById('draggableArea')
		var liquid_page = __windowReferences[windowId]

		var locals = liquid_page.getShared()
		var pair = liquid_page.getPair()

		locals.pair = pair

		liquid.localClose(windowId, pair, locals.clones)

		div.removeChild(liquid_page)
		delete __windowReferences[windowId]

		for(var s in __subscriptions) {
			delete __subscriptions[s][windowId]
		}

		return locals
	}

	var _isLoadedDefault = function() {
		for(var c in __defaultDeploymentComponents) {
			var name = __defaultDeploymentComponents[c].relUrl
			if(!_isLoadedComponent(name)) {
				return false
			}
		}
		return true
	}

	var _isLoadedComponent = function(name) {
		return !(__importedComponents[name] === undefined)
	}

	var _loadDefaultComponents = function(defaultComponents, callback) {
		var load = function(components) {
			var c = components.shift()
			if(c) {
				_ajaxRequest(c, function(){
					load(components)
				})
			} else {
				callback()
			}
		}

		load(defaultComponents.slice())
	}

	var _loadComponent = function(componentName, callback) {
		var loadRequestedComponent = function() {
			if(!__loadedComponents[componentName]){
				_ajaxRequest({relUrl: '/appComponents/' + componentName + '.html', ext: 'html'}, function(){
					__loadedComponents.push(componentName)
					if(callback)
						callback()
				})
			} else {
				//if already loaded
				if(callback)
						callback()
			}
		}

		if(!_isLoadedDefault()) {
			_loadDefaultComponents(__defaultDeploymentComponents, loadRequestedComponent)
		} else {
			loadRequestedComponent()
		}
	
		// if(__components.indexOf(componentName) != -1) {
		// 	var head = document.querySelector('head')
		// 	var link = document.createElement('link');
		// 	link.href = '/appComponents/' + componentName + '.html';
		// 	link.rel = 'import';
		// 	head.appendChild(link)
		// }
	}

	var _createComponent = function(componentName, element, opts, callback) {
		var create = function() {
			if(typeof(opts) == 'function') {
				callback = opts
				opts = {}
			}

			var uniqueComponentId = _createUniqueId()

			__y.share.liquidStorage.set(uniqueComponentId, Y.Map).then(function(componetY){
				var  componentUrl = {
					device: __deviceId,
					componentRef: uniqueComponentId,
					type: componentName
				}

				var component = document.createElement('liquid-component-' + componentName)
				component.__liquidComponentUrl = componentUrl
				component.__componentY = componetY

				__componentsReference[uniqueComponentId] = component
				__componentsSummary[uniqueComponentId] = componentUrl

				if(opts && opts.liquidUI) {
					var liquidUI = document.createElement('liquid-ui')
					liquidUI.liquidComponentUrl = componentUrl
					component.insertBefore(liquidUI, component.firstChild);
				}

				element.appendChild(component)

				if(callback) {
					callback(componentUrl, component)
				}
			})

			// if(pair != undefined) {
			// 	frame.sharedId = pair.sharedId
			// 	liquid.registerCloneWindow(pair, id)
			// } else {
			// 	frame.sharedId = __deviceId + "_" + id
			// }

			// if(!__componentsList[componentName]) {
			// 	__componentsList[componentName] = []
			// }

			// __componentsList[componentName].push(id)

			// for(var i = 0; i < __variable_subscriptions[componentName].length; i++) {
			// 	__subscriptions[__variable_subscriptions[componentName][i]][id] = frame
			// }

			// for(var i = 0; i < __variable_subscriptions[componentName].length; i++) {
			// 	var v = __variable_subscriptions[componentName][i]
			// 	var value = __state[v]
			// 	frame.postVariable(v,value)
			// }

			// if(locals == undefined) {
			// 	if(__locals[componentName] != undefined) {
			// 		// for(var i = 0; i < __locals[componentName].length; i++) {
			// 		// 	var varName = __locals[componentName][i]
			// 		// 	var varInit = __initialisations[varName]
			// 		// 	frame.registerLocalVariable(varName, varInit, __permissions[varName])
			// 		// }
			// 	}
			// } else {
			// 	if(locals.storage != undefined) {
			// 		var storage = locals.storage
			// 		for(var n in storage) {
			// 			frame.registerSharedVariable(n, storage[n], __permissions[n])
			// 		}
			// 	}

			// 	if(locals.clones != undefined) {
			// 		var clones = locals.clones
			// 		frame.postClones(clones)
			// 		liquid.localMove(id, clones, from)
			// 	}

			// 	if(locals.pair != undefined) {
			// 		frame.postPair(locals.pair)
			// 		liquid.registerCloneWindow(locals.pair, id)
			// 		liquid.localNotify(id, locals.pair)
			// 	}
			// }
		}

		if(!_isLoadedDefault()) {
			_loadDefaultComponents(__defaultDeploymentComponents, create)
		} else {
			create()
		}
	}

	var _closeComponent = function(componentURL) {
		var component = __componentsReference[componentURL.componentRef]

		if(component) {
			var parent = component.parentNode;
			parent.removeChild(component);
		}
		// var div = document.getElementById('draggableArea')
		// var liquid_page = __windowReferences[windowId]

		// var locals = liquid_page.getShared()
		// var pair = liquid_page.getPair()

		// locals.pair = pair

		// liquid.localClose(windowId, pair, locals.clones)

		// div.removeChild(liquid_page)
		// delete __windowReferences[windowId]

		// for(var s in __subscriptions) {
		// 	delete __subscriptions[s][windowId]
		// }

		// return locals
	}

	var _deleteComponent = function(fromURL, toURL, message) {
		if(!message) {
			message = {
		    from: fromURL,
		    to: toURL,
		    target: {
		      device: toURL.device
		    },
		    operation: 'delete',
		    data: {
		    	liquidStorage: _getComponent(fromURL).getLiquidVariablesValue()
		    }
	  	}
		}

		Liquid.sendMessage(toURL, message)
	}

	var _migrateComponent = function(fromURL, toURL, message) {
		if(!message) {
			message = {
		    from: fromURL,
		    to: toURL,
		    target: {
		      device: toURL.device
		    },
		    operation: 'migrate',
		    data: {
		    	liquidStorage: _getComponent(fromURL).getLiquidVariablesValue()
		    }
	  	}
		}

	  Liquid.sendMessage(toURL, message)
	}

	var _forkComponent = function(fromURL, toURL, message) {
		if(!message) {
			message = {
		    from: fromURL,
		    to: toURL,
		    target: {
		      device: toURL.device
		    },
		    operation: 'fork',
		    data: {
		    	liquidStorage: _getComponent(fromURL).getLiquidVariablesValue()
		    }
	  	}
		}

	  Liquid.sendMessage(toURL, message)
	} 

	var _cloneComponent = function(fromURL, toURL, message) {
		if(!message) {
			message = {
		    from: fromURL,
		    to: toURL,
		    target: {
		      device: toURL.device
		    },
		    operation: 'clone',
		    data: {
		    	liquidUI: true, //TODO check when false
		    	liquidStorage: _getComponent(fromURL).getLiquidVariablesValue()
		    }
	  	}
		}

	  Liquid.sendMessage(toURL, message)
	}

	var notifyNewWindow = function(device, page, locals, pair, from) {
		socket.emit('newWindow', {
			device: device,
			page: page,
			locals: locals,
			pair: pair,
			from: from
		})
	}

	var registerCloneWindow = function(pair, windowId) {
		var device = pair.device
		var token = pair.token

		if(__registeredClones[device] == undefined) {
			__registeredClones[device] = {}
		}

		__registeredClones[device][token] = windowId
	}

	var updateRegisterCloneWindow = function(from, pair) {
		var token = pair.token
		var windowId = __registeredClones[from][token]

		liquid.registerCloneWindow(pair, windowId)
	}

	var _createUniqueId = function () {
		__counter = __counter + 1
		return __counter
	}

	var createUniqueToken = function() {
		__token = __token + 1
		return __counter
	}

	var localStorageChange = function(v) {
		for(var i in __windowReferences) {
			__windowReferences[i].localStorageChange(v)
		}
	}

	var sessionStorageChange = function(v) {
		for(var i in __windowReferences) {
			__windowReferences[i].sessionStorageChange(v)
		}
	}

	var executeVariable = function(v, value) {
		if(__executions[v] != undefined) {
			var f = __executions[v][2]

			if(__locals[f] != undefined) 
				__locals[f](value)
		}
	}

	var onVariableChange = function(v,value) {
		socket.emit('change', {
			v: v,
			value: value
		})
	}

	var _set = function(v, value) {
		var tempValue = value

		if(__executions[v] != undefined) {
			var f = __executions[v][0]

			if(__locals[f] != undefined) 
				tempValue = __locals[f](value)
		}

		__state[v] = tempValue
		onVariableChange(v, tempValue)
	}

	var _get = function(v) {
		return __state[v]
	}

	var updatePages = function(pages) {
		var dropdown = document.querySelector("#pagesList")

		var list = [{
			value: 0,
			text: "Components"
		}]

		for(var p in pages) {
			list.push({
				value: pages[p],
				text: pages[p]
			})
		}

		dropdown.items = list
	}

	var addWindowButton = function(){
		var device = document.querySelector('#deviceList')
		var page = document.querySelector('#pagesList')

		device = device.getSelected()
		page = page.getSelected()

		if(device != 0 && page != 0) 
			liquid.notifyNewWindow(parseInt(device), page)
	}

	// var activeDraggableButton = function() {
	// 	draggable = !draggable

	// 	if(draggable) {
	// 		$('#draggableButton').css('color', '#f66')
	// 		addDraggableListener()
	// 	} else {
	// 		$('#draggableButton').css('color', 'white')
	// 		removeDraggableListener()
	// 	}
	// }

	// var addDraggableListener = function() {
	// 	$('#draggableArea').on('mousedown', 'liquid-page', function(e) {
	// 		$(this).addClass('draggable').parents().on('mousemove', function(e) {
	// 			$('.draggable').offset({
	// 				top: e.pageY - $('.draggable').outerHeight() / 2,
	// 				left: e.pageX - $('.draggable').outerWidth() / 2
	// 			}).on('mouseup', function() {
	// 				$(this).removeClass('draggable');
	// 			});
	// 		});
		
	// 		e.preventDefault();
	// 	}).on('mouseup', function() {
	// 		$('.draggable').removeClass('draggable');
	// 	});
	// }

	// var removeDraggableListener = function() {
	// 	$('#draggableArea').unbind('mousedown')
	// }

	var connectButton = function() {
		if(__initialised && !__connected) {
			socket = io()
		}
	}

	var usernameChange = function () {
		var name = document.querySelector('#username').value
		if(name == '') {
			name = __deviceId
		}

		__user = name
		socket.emit('username', {name: name})
	}

	var _create = function(opts, callback) {
		_configuration(opts)
		_connectStateServer(callback)
	}

	var _isConnected = function() {
		return __connected
	}

	var _addEventListener = function(type, listener) {
		if (typeof __listeners[type] == "undefined"){
			__listeners[type] = [];
		}

		if(typeof listener == 'function') {
			__listeners[type].push(listener);
		}
	}

	var _removeEventListener = function(type, listener) {
		if (__listeners[type]){
      for (var p in __listeners[type]){
        if (__listeners[type][p] === listener){
          __listeners[type].splice(p, 1);
          break;
        }
      }
    }
	}

	var _runEvent = function(type, params) {
		var listeners = __listeners[type]
		if(listeners) {
			for(var l in listeners){
				listeners[l].apply(this, params)
			}
		}
	}

	var _getComponents = function() {
		return __componentsSummary
	}

	var _getComponent = function(componentURL) {
			return __componentsReference[componentURL.componentRef]
	}

	var _getLoadedComponents = function() {
		return __loadedComponents
	}

	var _getLoadableComponents = function() {
		return __componentsAvailable
	}

	var _getDeviceId = function() {
		return __deviceId
	}

	var _getUsername = function() {
		return __username
	}

	var _getConnectionState = function() {
		return __connected
	}

	var _getDevicesList = function() {
		return __devices
	}

	var _configuration = function(opts) {
		for(var c in opts) {
			if(!__config[c]) {
				__config[c] = opts[c]
			}
		}
	}

	var _ajaxRequest = function(file, success, fail) {
		__loading = true
		_runEvent('loadingChange', [__loading])
		var serversList = (__config.deploymentServers || __defaultConfig.deploymentServers).slice()

		var checkAllServers = function(servers) {
			var server = servers.shift()

			if(server) {
				var req = new XMLHttpRequest();
				var url = server.host + ':' + server.port
				req.open('GET', url + '/echo', true)

				req.onreadystatechange = function() {
				  if (req.readyState == 4) {
				  	if(req.status == 200) {
				  		if(file.ext == 'script') {
				  			_requestScript(url, file, success)
				  		} else if (file.ext == 'html') {
				  			_requestHTML(url, file, success)
				  		}
				  	} else {
				  		checkAllServers(servers)
				  	}
			  	}
				}
				req.send()
			} else {
				if(fail){
					fail()
				}
			}
		}

		checkAllServers(serversList)
	}

	var _requestScript = function(server, file, callback) {
		var complete = function() {
			__importedComponents[file.relUrl] = true
			__loading = false
			_runEvent('loadingChange', [__loading])

			if(callback) {
				callback()
			}
		}

  	var url = server + file.relUrl
    var script = document.createElement('script');
		script.src = url
		script.onload = complete
		document.querySelector('head').appendChild(script);
	}

	var _requestHTML = function(server, file, callback) {
			var complete = function() {
				__importedComponents[file.relUrl] = true
				__loading = false
				_runEvent('loadingChange', [__loading])

				if(callback) {
					callback()
				}
			}

			var url = server + file.relUrl
			var link = document.createElement('link');
			link.href = url
			link.rel = 'import';
			link.onload = complete
			document.querySelector('head').appendChild(link)
	}

	var _connectStateServer = function(callback) {
		if(__config.multiDeviceDisable || __defaultConfig.multiDeviceDisable)
			return 

		_loadDefaultComponents(__defaultStatefulComponents, function() {
			_configureSocket()

			if(callback) {
				callback()
			}
		})	
	}


	/*
	 getSessionDeviceId
	 if deviceid is saved in session state then return it else return undefined.
	 */



	function getSessionDeviceId(){
		var devId = window.sessionStorage.getItem("LJSDEVID");
		if(devId) {
			__initialised = true
			return devId;
		} else {
			return undefined;
		}
	}

	/*
	 writeSessionDeviceId(id)
	 args: id:int(DeviceId)
	 writes device id in the session storage
	 */
	var writeSessionDeviceId= function (id) {
		window.sessionStorage.setItem("LJSDEVID",id);
	}

	var _configureSocket = function() {
		var stateConf = __config.stateServer || __defaultConfig.stateServer
		var opts = __config.stateServerOpts || __defaultConfig.stateServerOpts
		
		__socket = io(stateConf.host + ':' + stateConf.port, opts)

		__socket.on('disconnect', function() {
			__connected = false
			_runEvent('disconnect')
		})

		__socket.on('handshake', function() {
			if(__initialised) {
				__socket.emit('handshake', {
					type: 'reconnect',
					id: __deviceId,
					username: __username
			})
			} else {
				__socket.emit('handshake', {type: 'new'})
			}
		})

		__socket.on('reconnected', function() {
			__connected = true

			_configurePeer()
			_runEvent('reconnect')
		})

		__socket.on('connected', function(data) {
			__deviceId = data.id
			__user = data.id

			__connected = true
			__initialised = true
			writeSessionDeviceId(__deviceId);
			for(var s in __state) {
				__subscriptions[s] = {}
			}

			_configurePeer()
			_runEvent('connect', [__deviceId, __loadedComponents])
		})

		__socket.on('componentsList', function(data) {
			__componentsAvailable = data.components
			_runEvent('loadableComponentsListUpdate', [__componentsAvailable])
		})

		__socket.on('deviceList', function(data) {
			__devices = data.devices
			_runEvent('pairedDevicesListUpdate', [__devices])
		})

		__socket.on('state', function(data){
			for(var v in data) {
				var value = data[v]

				__state[v] = value

				for(var w in __subscriptions[v]) {
					__subscriptions[v][w].postVariable(v,value)
				}
			}
		})

		__socket.on('liquidRestApi', function(data, fn){
			var user = data.user
			var device = data.device
			var component = data.component
			var componentType = data.componentType
			var variable = data.variable
			var peersTable=[]

			
			for(var peer in __peersTable){
				if(__peersTable[peer].peer){
					peersTable.push(__peersTable[peer].peer);
				}
			}
			var componentsList=[];
			for(var c in __componentsSummary){
				componentsList.push({component:__componentsSummary[c],
				variables:_getComponent(__componentsSummary[c]).__liquidVariablesList})
			}

			console.log();
			if(device && component && variable) {
				//TODO
			} else if(device && component) {
				//TODO
			} else if(device) {
				fn(false, {
					devices: {
						device: __deviceId,
					},
					components:componentsList,
					peersTable:peersTable
				})
			} else {
				fn(true, undefined)
			}
		})

		__socket.on('local', function(data) {
			var local = data.local
			var type = data.type
			var windowId = data.windowId
			var token = data.token
			var from = data.from
			var device = data.device
			var pair = data.pair

			var frame = undefined
			
			switch(type) {
				case 'read':
					windowId = __registeredClones[from][token]
					frame = __windowReferences[windowId]
					for(var v in local) {
						frame.postShared(v, local[v], {
							device: from,
							token: token,
							read: true
						})
					}
					break;
				case 'write':
					frame = __windowReferences[windowId]
					for(var v in local) {
						frame.postShared(v, local[v], {
							device: from,
							token: token,
							read: false
						})
					}
					break;
				case 'pairClose':
					frame = __windowReferences[windowId]
					frame.closeCloneWindow(from, token)
					break;
				case 'cloneClose':
					windowId = __registeredClones[from][token]
					frame = __windowReferences[windowId]
					if(frame != undefined) 
						frame.closePairWindow(from, token)
					break;
				case 'cloneMove': 
					windowId = __registeredClones[from][token]
					frame = __windowReferences[windowId]
					frame.postPair(pair)
					liquid.updateRegisterCloneWindow(from, pair)
					break;
				case 'notifyClone':
					frame = __windowReferences[windowId]
					frame.postClone(from, token)
					break;
				default:
					break;
			}
		})

		__socket.on('newWindow', function(data){
			var page = data.page
			var locals = data.locals
			var pair = data.pair
			var from = data.from

			var frameId = liquid.addWindow(page, locals, pair, from)
			document.querySelector('#' + frameId).click(function(){
				this.zIndex(zindex++)
			})
		})
	}

	var _configurePeer = function() {
		if(__peer) {
			__peer.destroy()
		}

		if(!__peer || __peer.disconnected) {
			var signConf = __config.signalingServer || __defaultConfig.signalingServer
			var opts = __config.signalingServerOpts || __defaultConfig.signalingServerOpts

			__peer = new Peer(__deviceId, {
				host: signConf.host, 
	      port: signConf.port, 
	      path: signConf.path
			});

			__peer.on('open', _peerOpen)
			__peer.on('connection', _peerNewConnection)
			__peer.on('close', _peerClose)
			__peer.on('disconnected', _peerDisconnect)
			__peer.on('error', _peerError)
		}

		_configureY()
	}

	var _configureY = function() {
		new Y({
	    db: {
	      name: 'memory'
	    },
	    connector: {
	      name: 'liquid',
	      device: __deviceId,
	    },
	    share: {
	      liquidStorage: 'Map'
	    },
	    types:['Map', 'Array']
	  }).then(function (y) {
	    __y = y
	  })
	}

	var _connectDevice = function(device, success) {
		if(__peer && !__peersTable[device]) {
			var conn = __peer.connect(device, {
				metadata: {
					from: __deviceId,
					to: device
				}
			})

			conn.on('open', function() {
				__peersTable[device] = conn

				if(success) {
					success()
				}
			})
			conn.on('data', _peerConnectionData.bind(conn))
			conn.on('close', _peerConnectionClose.bind(conn))
			conn.on('error', _peerConnectionError.bind(conn))
		}
	}

	var _broadcastMessageToTable = function(tableURL, message) {

	}

	var _sendMessage = function(liquidURL, message) {
		var deviceIdTo = liquidURL.device

		if(deviceIdTo) {
			if(deviceIdTo == __deviceId) {
				_incomingMessage(message)
			} else {
				if(__peersTable[deviceIdTo]) {
					if(__peersTable[deviceIdTo].open == true) {
						// if peer exists and is connected
						__peersTable[deviceIdTo].send(message)
					} else {
						// if peer exists but it isn't connected -> relay on socket
						// TODO
						// __socket
					}
				} else {
					// if peer wasn't created
					_connectDevice(deviceIdTo, function() {
						__peersTable[deviceIdTo].send(message)
					})
				}
			}
		} else {
			console.log('Liquid - sendMessage: liquidURL is invalid')
		}
	}

	var _incomingMessage = function(message) {
		switch(message.operation) {
			case 'migrate':
				_incomingMigrateComponent(message)
				break;
			case 'migrationComplete':
				_incomingMigrateComponentComplete(message)
				break;
			case 'fork':
				_incomingForkComponent(message)
				break;
			case 'cloned':
				_incomingCloneComponent(message)
				break;
			case 'delete':
				_incomingDeleteComponent(message)
				break;
			default:
				break;
		}
	}

	var _peerOpen = function(id) {
		console.log('Peer: opened connection with server: ' + id)
	}

	var _peerNewConnection = function(conn) {
		conn.on('data', _peerConnectionData.bind(conn))
		conn.on('close', _peerConnectionClose.bind(conn))
		conn.on('error', _peerConnectionError.bind(conn))

		__peersTable[conn.metadata.from] = conn
	}

	var _peerClose = function() {
		console.log('Peer: closed connection with server')
	}	

	var _peerDisconnect = function() {
		console.log('Peer: disconnected')
	}

	var _peerError = function(err) {
		console.log('Peer: error: ' + JSON.stringify(err))
	}

	//this = peerConnection (conn), set with .bind()
	var _peerConnectionData = function(data) {
		_incomingMessage(data)
	}

	var _peerConnectionClose = function() {

	}

	var _peerConnectionError = function(err) {
		console.log('Peer: error: ' + JSON.stringify(err))
	}

	var _setLastTouch = function(element) {
		__lastTouchedElement = element
	}

	var _getLastTouch = function() {
		var temp = __lastTouchedElement
		return temp
	}

	var _incomingMigrateComponent = function(message) {
		var fromUrl = message.from
		var target = message.target
		var element = target.element

		if(!target.element) {
			element = document.querySelector('body')
		}

		if(target.componentRef) {
			// container
		}

		_loadComponent(fromUrl.type,function(){
			_createComponent(fromUrl.type, element, {liquidUI: message.data.liquidUI}, function(componentURL, component) {
				component._populateStorage(message.data.liquidStorage)
				_sendMessage(fromUrl, {
					operation: "migrationComplete",
					from: componentURL,
					to: fromUrl
				})
			})
		})
	}

	var _incomingForkComponent = function(message) {
		var fromUrl = message.from
		var target = message.target
		var element = target.element

		if(!target.element) {
			element = document.querySelector('body')
		}

		if(target.componentRef) {
			// container
		}

		_loadComponent(fromUrl.type,function(){
			_createComponent(fromUrl.type, element, {liquidUI: message.data.liquidUI}, function(componentURL, component) {
				component._populateStorage(message.data.liquidStorage)
			})
		})
	} 

	var _incomingCloneComponent = function() {

	}

	var _incomingDeleteComponent = function(message) {
		_closeComponent(message.from)
	}

	var _incomingMigrateComponentComplete = function(message) {
		_closeComponent(message.to)
	} 

	// var _registerVariable = function(componentURL, variable) {
	// 	if(componentURL.device == __deviceId) {

	// 	} else {
	// 		//propagate to correct device
	// 	}
	// }

	// state = {}
	// commons = exports.__load_commons()
	// locals = __load_locals

	var getPim = function() {
		return __y
	}

	return {
		create: _create,
		isConnected: _isConnected,

		// Devices API
		connectDevice: _connectDevice,
		sendMessage: _sendMessage,

		// Components API
		loadComponent: _loadComponent,
		createComponent: _createComponent,
		deleteComponent: _deleteComponent,
		migrateComponent: _migrateComponent,
		forkComponent: _forkComponent,
		cloneComponent: _cloneComponent,

		getLoadedComponents: _getLoadedComponents,
		getLoadableComponents: _getLoadableComponents,

		getComponents: _getComponents,
		getComponent: _getComponent,
		getDeviceId: _getDeviceId,
		getDevicesList: _getDevicesList,
		getUsername: _getUsername,
		getConnectionState: _getConnectionState,

		addEventListener: _addEventListener,
		removeEventListener: _removeEventListener,

		setLastTouch: _setLastTouch,
		getLastTouch: _getLastTouch,

		getPim: getPim
	}
})();