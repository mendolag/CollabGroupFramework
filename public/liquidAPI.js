var Liquid = (function () {
	var __database = undefined
	var __databaseName = "LiquidDatabase"
	var __remoteDatabase = false

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
	var __devicesInfo = {}
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

	var __defaultLiquidComponents = [
		// {relUrl: '/bower_components/webcomponentsjs/webcomponents-lite.min.js', ext: 'script'},
		// {relUrl: '/bower_components/polymer/polymer.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-behavior/newliquid-behavior.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-ui-behavior/liquid-ui-behavior.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-ui/liquid-ui.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-component-migrate/liquid-component-migrate.html', ext: 'html'},
		{relUrl: '/components/liquidComponents/liquid-container/liquid-container.html', ext: 'html'}
	]

	var __defaultDependencies = [
		{relUrl: "/bower_components/mobile-detect/mobile-detect.js", ext: 'script'},
		{relUrl: "/bower_components/eventEmitter/EventEmitter.min.js", ext: 'script'},
		{relUrl: "/bower_components/observe-js/src/observe.js", ext: 'script'},
		{relUrl: "/bower_components/object.observe/dist/object-observe.js", "ext": 'script'},
		{relUrl: "/bower_components/array.observe/array-observe.js", "ext": 'script'},
		{relUrl: '/socket.io/socket.io.js', ext: 'script'},
		{relUrl: '/components/peerjs/peerjs.js', ext: 'script'},
		{relUrl: '/bower_components/es6-promise-polyfill/promise.js', ext: 'script'},
		{relUrl: '/bower_components/yjs/y.js', ext: 'script'},
		{relUrl: '/bower_components/y-map/y-map.js', ext: 'script'},
		{relUrl: '/bower_components/y-array/y-array.js', ext: 'script'},
		{relUrl: '/bower_components/y-text/y-text.js', ext: 'script'},
		{relUrl: '/bower_components/y-memory/y-memory.js', ext: 'script'},
		{relUrl: '/components/y-liquid/y-liquid-new.js', ext: 'script'},
		{relUrl: '/bower_components/pouchdb/dist/pouchdb.min.js', ext: 'script'},
		{relUrl: '/bower_components/pouchdb-find/dist/pouchdb.find.min.js', ext: 'script'}
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
			host: 'http://localhost',
			port: 12305,
			path: ''
		},
		multiDeviceDisable: false
	}

	var _checkDevice = function() {
		var md = new MobileDetect(window.navigator.userAgent)
		if (md.phone()) {
      return md.tablet() ? 'Phone/Tablet' : 'Phone';
    } else if (md.tablet()) {
      return 'Tablet';
    } else if (md.is('Bot') || md.is('MobileBot')) {
      return 'Bot';
    } else if (md.is('TV') || md.is('Console')) {
      return 'TV/Console';
    } else { 
    	if(md.mobile() == 'UnknownPhone') {
    		return 'Phone'
    	} else {
    		return 'Desktop'
    	}
    }
	}

	var _isLoadedDefaultLiquid = function() {
		return new Promise(function(resolve, reject) {
			var isAllLoaded = true 

			for(var c in __defaultLiquidComponents) {
				var name = __defaultLiquidComponents[c].relUrl
				if(__importedComponents[name] === undefined) {
					isAllLoaded = false
				}
			} 
			
			if(isAllLoaded) {
				resolve()
			} else {
				reject(new Error('Default components are not loaded'))
			}
		})
	}

	var _loadDefaultLiquidComponents = function() {
		return new Promise(function(resolve, reject) {
			var load = function(components) {
				var c = components.shift()
				if(c) {
					_ajaxRequest(c)
						.then(function(){ 
							load(components) 
						}).catch(reject)
				} else {
					resolve()
				}
			}

			load(__defaultLiquidComponents.slice())
		})
	}

	var _loadDefaultDependencies = function() {
		return new Promise(function(resolve, reject) {
			var load = function(components) {
				var c = components.shift()
				if(c) {
					_ajaxRequest(c)
						.then(function(){ 
							load(components) 
						}).catch(reject)
				} else {
					resolve()
				}
			}

			load(__defaultDependencies.slice())
		})
	}

	var _loadComponent = function(componentName) {
		return new Promise(function(resolve, reject) {
			var loadRequestedComponent = function() {
				_isLoadedComponent()
					.catch(function(){
						var component = {relUrl: '/appComponents/' + componentName + '.html', ext: 'html'}
						_ajaxRequest(component).then(function(){
							__loadedComponents.push(componentName)
							resolve()
						})
					})
			}

			_isLoadedDefaultLiquid()
				.catch(_loadDefaultLiquidComponents)
				.then(loadRequestedComponent)
		})
	}

	var _isLoadedComponent = function(componentName) {
		return new Promise(function(resolve, reject){
			if(__loadedComponents[componentName]) {
				resolve()
			} else {
				reject(new Error('Not loaded component'))
			}
		})
	}

	//_registerComponent(component)
	// args: Object component
	// adds component to two arrays in order to register them.
	// var _registerComponent = function(component){
	// 	var uniqueComponentId = component.__liquidComponentUrl.componentRef

	// 	__componentsReference[uniqueComponentId] = component;
	// 	__componentsSummary[uniqueComponentId] = component.__liquidComponentUrl;
	// }


	//_addLiquidUI(component,opts)
	// args:Object component, Object opts
	// wraps component with a liquiUI
	// var _addLiquidUI = function(component, opts){
	// 	if(opts && opts.liquidui) {
	// 		var liquidui = document.createElement('liquid-ui')
	// 		liquidui.liquidComponentUrl = component.__liquidComponentUrl
	// 		liquidui.liquidComponentType = component.__liquidComponentUrl.type
	// 		component.insertBefore(liquidui, component.firstChild);
	// 		component.liquidui = true
	// 	}

	// }

	//_registerHTMLTag(component,opts)
	// args:Object component, Object opts
	// External API function used when we want to register a liquid html tag.
	// var _registerHTMLTag = function(component,opts){
	// 	var newIdentifier = _createUniqueId();
	// 	var reference = __componentsReference[newIdentifier];
	// 	var summary =__componentsSummary[newIdentifier];

	// 	if (!(reference || summary)){
	// 		var compName= component.tagName.toLowerCase().replace('liquid-component-','');

	// 		var componentUrl = {
	// 			device: __deviceId,
	// 			componentRef: newIdentifier,
	// 			type: compName
	// 		}

	// 		component.__liquidComponentUrl = componentUrl;
	// 	}
	// }

	var _createComponent = function(componentName, element, opts) {
		return new Promise(function(resolve, reject) {			
			var createComponent = function() {
				var newIdentifier = _createUniqueId();
				var component = document.createElement('liquid-component-' + componentName);

				var componentUrl = {
					device: __deviceId,
					componentRef: newIdentifier,
					type: componentName
				}

				component.__liquidComponentUrl = componentUrl;
				__componentsReference[newIdentifier] = component;
				__componentsSummary[newIdentifier] = component.__liquidComponentUrl;

				if(opts && opts.liquidui) {
					component.liquidui = opts.liquidui
				}

				if(element && Polymer.dom(element)) {
					Polymer.dom(element).appendChild(component)
				} else {
					element.appendChild(component);
				}

				resolve(component)
			}

			_isLoadedDefaultLiquid()
				.catch(_loadDefaultLiquidComponents)
				.then(createComponent)
		})
	}

	var _loadAndCreateComponent = function(componentName, element,opts) {
		return new Promise(function(resolve, reject) {
			_loadComponent(componentName)
				.then(function(){
					_createComponent(componentName, element, opts)
						.then(resolve)
						.catch(reject)
			}).catch(reject)
		})
	}

	var _createMessage = function(options) {
		message = {}

		for(var i in options) {
			message[i] = options[i]
		}

		console.log(message)

		return message
	}

	var _createCloneMessage = function(fromURL, toURL, type) {
		var fromComponent = _getComponent(fromURL)
		var childComponents = undefined

		if(fromComponent && fromComponent._isContainerComponent()) {
			fromComponent._getLiquidChildComponents()
		}

		message = _createMessage(fromURL, toURL, type, {
			target: {
				device: toURL.device
			},
			data: {
				liquidui: '',
				isContainer: fromComponent._isContainerComponent(),
				liquidStorage: fromComponent.getLiquidVariablesValue(),
				liquidChildComponents: childComponents 
			}
		})
	}

	var _closeComponent = function(componentURL) {
		var component = __componentsReference[componentURL.componentRef]

		if(component) {
			var parent = component.parentNode;
			parent.removeChild(component);
		}

		//TODO Delete from Liquid component references


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

	var _deleteComponent = function(fromURL, toURL, type, message) {
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

		_sendMessage(toURL, message)
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

		_sendMessage(toURL, message)
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

		_sendMessage(toURL, message)
	}

	var _cloneComponent = function(fromURL, toURL, message) {
		if(!message) {
			message = _createCloneMessage(fromURL, toURL, 'clone')
		}

		_sendMessage(toURL, message)
	}

	var _cloneAndHideComponent = function(fromURL, toURL, message) {
		if(!message) {
			message = _createCloneMessage(fromURL, toURL, 'cloneHide')
		}

		_sendMessage(toURL, message)
	}

	var _pairComponent = function(fromURL, toURL) {
		var variables = _getComponent(toURL).getLiquidVariablesList()

		for(var i in variables) {
			var fromVariableURL = {
				device: fromURL.device,
				componentRef: fromURL.componentRef,
				type: fromURL.type,
				variable: i
			}

			var toVariableURL = {
				device: toURL.device,
				componentRef: toURL.componentRef,
				type: toURL.type,
				variable: i
			}

			_pairVariable(toVariableURL, fromVariableURL)
		}
	}

	var _pairVariable = function(fromURL, toURL, liquidOptions) {
		var messageFrom = {
			from: fromURL,
			to: toURL,
			operation: 'pairFromVariable',
			options: liquidOptions
		}

		var messageTo = {
			from: fromURL,
			to: toURL,
			operation: 'pairToVariable',
			options: liquidOptions
		}

		_sendMessage(fromURL, messageFrom)
		_sendMessage(toURL, messageTo)
	}

	// var notifyNewWindow = function(device, page, locals, pair, from) {
	// 	socket.emit('newWindow', {
	// 		device: device,
	// 		page: page,
	// 		locals: locals,
	// 		pair: pair,
	// 		from: from
	// 	})
	// }

	// var registerCloneWindow = function(pair, windowId) {
	// 	var device = pair.device
	// 	var token = pair.token

	// 	if(__registeredClones[device] == undefined) {
	// 		__registeredClones[device] = {}
	// 	}

	// 	__registeredClones[device][token] = windowId
	// }

	// var updateRegisterCloneWindow = function(from, pair) {
	// 	var token = pair.token
	// 	var windowId = __registeredClones[from][token]

	// 	liquid.registerCloneWindow(pair, windowId)
	// }

	var _createUniqueId = function () {
		__counter = __counter + 1
		return __counter
	}

	// var createUniqueToken = function() {
	// 	__token = __token + 1
	// 	return __counter
	// }

	// var localStorageChange = function(v) {
	// 	for(var i in __windowReferences) {
	// 		__windowReferences[i].localStorageChange(v)
	// 	}
	// }

	// var sessionStorageChange = function(v) {
	// 	for(var i in __windowReferences) {
	// 		__windowReferences[i].sessionStorageChange(v)
	// 	}
	// }

	// var executeVariable = function(v, value) {
	// 	if(__executions[v] != undefined) {
	// 		var f = __executions[v][2]

	// 		if(__locals[f] != undefined)
	// 			__locals[f](value)
	// 	}
	// }

	// var onVariableChange = function(v,value) {
	// 	socket.emit('change', {
	// 		v: v,
	// 		value: value
	// 	})
	// }

	// var _set = function(v, value) {
	// 	var tempValue = value

	// 	if(__executions[v] != undefined) {
	// 		var f = __executions[v][0]

	// 		if(__locals[f] != undefined)
	// 			tempValue = __locals[f](value)
	// 	}

	// 	__state[v] = tempValue
	// 	onVariableChange(v, tempValue)
	// }

	// var _get = function(v) {
	// 	return __state[v]
	// }

	var usernameChange = function () {
		var name = document.querySelector('#username').value
		if(name == '') {
			name = __deviceId
		}

		__user = name
		socket.emit('username', {name: name})
	}

	var _create = function(opts) {
		return new Promise(function(resolve, reject) {
			_configure(opts)
				.then(_connectStateServer)
				.then(_loadDatabase)
				.then(_preloadComponents)
				.then(resolve)
				.catch(reject)
		})
	}

	var _configure = function(opts) {
		return new Promise(function(resolve, reject) {
			for(var c in opts) {
				if(!__config[c]) {
					__config[c] = opts[c]
				}
			}
			resolve()
		})
	}

	var _preloadComponents = function(){
		return new Promise(function(resolve, reject) {
			var nodes = document.querySelectorAll('*')
			for(var i in nodes){
				if(nodes[i].localName && nodes[i].localName.indexOf('liquid-component') != -1 ) {
					_loadComponent(nodes[i].tagName.toLowerCase().replace('liquid-component-',''),function(){});
				}
			}

			resolve()
		})
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

	var _getDevicesInfoList = function() {
		return __devicesInfo
	}

	var _ajaxRequest = function(file) {
		return new Promise(function(resolve, reject) {
			__loading = true
			_runEvent('loadingChange', [__loading])

			var serversList = (__config.deploymentServers || __defaultConfig.deploymentServers).slice()

			if(!serversList) {
				reject(new Error('Impossible to read configurations'))
			}

			var checkNextServer = function(servers) {
				var server = servers.shift()
				if(server) {
					var req = new XMLHttpRequest();
					var url = server.host + ':' + server.port
					req.open('GET', url + '/echo', true)

					req.onreadystatechange = function() {
						if (req.readyState == 4) {
							if(req.status == 200) {
								if(file.ext == 'script') {
									_requestScript(url, file)
										.then(resolve)
								} else if (file.ext == 'html') {
									_requestHTML(url, file)
										.then(resolve)
								}
							} else {
								checkNextServer(servers)
							}
						}
					}
					req.send()
				} else {
					reject(new Error('Servers are not available'))
				}
			}

			checkNextServer(serversList)
		})
	}

	var _requestScript = function(server, file) {
		return new Promise(function(resolve, reject) {
			var complete = function() {
				__importedComponents[file.relUrl] = true
				__loading = false
				_runEvent('loadingChange', [__loading])
				resolve()
			}

			var url = server + file.relUrl
			var script = document.createElement('script');
			script.src = url
			script.onload = complete
			document.querySelector('head').appendChild(script);
		})
	}

	var _requestHTML = function(server, file) {
		return new Promise(function(resolve, reject) {
			var complete = function() {
				__importedComponents[file.relUrl] = true
				__loading = false
				_runEvent('loadingChange', [__loading])
				resolve()
			}

			var url = server + file.relUrl
			var link = document.createElement('link');
			link.href = url
			link.rel = 'import';
			link.onload = complete
			document.querySelector('head').appendChild(link)
		})
	}

	var _loadAsset = function(file, ext) {
		return new Promise(function(resolve, reject) {
			_ajaxRequest({
				relUrl: '/appComponents/ui/liquid-ui-' + file + '.html',
				ext: ext
			})
				.then(resolve)
				.catch(reject)
		})
	}

	var _connectStateServer = function() {
		return new Promise(function(resolve, reject) {
			if(__config.multiDeviceDisable || __defaultConfig.multiDeviceDisable) {
				reject(new Error('Config unreadable'))
			}

			_loadDefaultDependencies(__defaultDependencies).then(function() {
				_configureSocket()
					.then(resolve)
					.catch(reject)
			})
		})
	}


	/*
	 getSessionDeviceId
	 if deviceid is saved in session state then return it else return undefined.
	 */



	function getSessionDeviceId(){
		var devId = window.sessionStorage.getItem("liquidjs_id");
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
		window.sessionStorage.setItem("liquidjs_id", id);
	}

	var _configureSocket = function() {
		return new Promise(function(resolve, reject) {
			var stateConf = __config.stateServer || __defaultConfig.stateServer
			var opts = __config.stateServerOpts || __defaultConfig.stateServerOpts

			if(!stateConf) {
				reject(new Error('Impossible to read stateServer configurations'))
			}

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
						username: __username,
						device: _checkDevice()
					})
				} else {
					__socket.emit('handshake', {
						type: 'new',
						device: _checkDevice()	
					})
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
				__devicesInfo = data.devicesInfo
				_runEvent('pairedDevicesListUpdate', [__devices, __devicesInfo])
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

			resolve()
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
			// Myself
			if(deviceIdTo == __deviceId) {
				_incomingMessage(message)
			} else {
				// If already connected
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
			case 'yMessage':
				_incomingYMessage(message)
				break;
			case 'migrate':
				_incomingMigrateComponent(message)
				break;
			case 'migrationComplete':
				_incomingMigrateComponentComplete(message)
				break;
			case 'fork':
				_incomingForkComponent(message)
				break;
			case 'clone':
				_incomingCloneComponent(message, 'clone')
				break;
			case 'cloneCreated':
				_incomingCloneCreated(message)
				break;
			case 'cloneHide':
				_incomingCloneComponent(message, 'cloneHide')
				break;
			case 'cloneHideCreated':
				_incomingCloneHideCreated(message)
				break;
			case 'delete':
				_incomingDeleteComponent(message)
				break;
			case 'pairFromVariable':
				_incomingPairFromVariable(message)
				break;
			case 'pairToVariable':
				_incomingPairToVariable(message)
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

	var _setLastTouch = function(liquidURL, liquidui, liquidStorage) {
		__lastTouchedElement = {
			liquidURL: liquidURL,
			liquidui: liquidui,
			liquidStorage: liquidStorage
		}
	}

	var _getLastTouch = function() {
		return __lastTouchedElement
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

		_loadAndCreateComponent(fromUrl.type, element, {liquidui: message.data.liquidui})
			.then(function(component) {
				component._populateStorage(message.data.liquidStorage/*, message.data.liquidPairings*/)
				_sendMessage(fromUrl, {
					operation: "migrationComplete",
					from: component.__liquidComponentUrl,
					to: fromUrl
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

		_loadAndCreateComponent(fromUrl.type, element, {liquidui: message.data.liquidui})
			.then(function(component) {
				component._populateStorage(message.data.liquidStorage)
			})
	}

	var _incomingCloneComponent = function(message, type) {
		var fromUrl = message.from
		var target = message.target
		var element = target.element

		if(!target.element) {
			element = document.querySelector('body')
		}

		_loadAndCreateComponent(fromUrl.type, element, {liquidui: message.data.liquidui})
			.then(function(component) {
				component._populateStorage(message.data.liquidStorage)
				var defaultChilds = component._getLiquidChildComponents().default.slice() // copy array

				while(defaultChilds.length > 0) {
					var currentURL = defaultChilds.shift()
					for(var i = 0; i < message.data.liquidChildComponents.default.length; i++) {
						if(!message.data.liquidChildComponents.default[i].copyURL &&
							message.data.liquidChildComponents.default[i].type == currentURL.type) {
								message.data.liquidChildComponents.default[i].copyURL = currentURL
						}
					}
				}

				var toAdd = message.data.liquidChildComponents.added
				var added = 0

				for(var i = 0; i < toAdd.length; i++) {
					var closure = function(pos) {
						_loadAndCreateComponent(toAdd[pos].type, component.$[toAdd[pos].data.element], {liquidui: toAdd[pos].data.liquidui})
							.then(function(component){
								added++

								message.data.liquidChildComponents.added[pos].copyURL = addedComponentURL

								if(added == toAdd.length) {
									_sendMessage(fromUrl, {
										operation: type + "Created",
										from: component.__liquidComponentUrl,
										to: fromUrl,
										data: message.data
									})
								}
							})
					}(i)
				}

				if(toAdd.length == 0) {
					_sendMessage(fromUrl, {
						operation: type + "Created",
						from: component.__liquidComponentUrl,
						to: fromUrl,
						data: message.data
					})
				}
			})
	}

	var _incomingCloneCreated = function(message) {
		var fromURL = message.from
		var toURL = message.to

		_pairComponent(fromURL, toURL)

		var containerChilds = message.data.liquidChildComponents
		for(var i = 0; i < containerChilds.added.length; i++) {
			var originalURL = {
				device: containerChilds.added[i].device,
				componentRef: containerChilds.added[i].componentRef,
				type: containerChilds.added[i].type
			}

			var clonedURL = {
				device: containerChilds.added[i].copyURL.device,
				componentRef: containerChilds.added[i].copyURL.componentRef,
				type: containerChilds.added[i].copyURL.type
			}

			_pairComponent(clonedURL, originalURL)
		}

		for(var i = 0; i < containerChilds.default.length; i++) {
			var originalURL = {
				device: containerChilds.default[i].device,
				componentRef: containerChilds.default[i].componentRef,
				type: containerChilds.default[i].type
			}

			var clonedURL = {
				device: containerChilds.default[i].copyURL.device,
				componentRef: containerChilds.default[i].copyURL.componentRef,
				type: containerChilds.default[i].copyURL.type
			}

			_pairComponent(clonedURL, originalURL)
		}
	}

	var _incomingCloneHideCreated = function(message) {
		_incomingCloneCreated(message)
		_getComponent(message.to).style.display = 'none'
	}

	var _incomingDeleteComponent = function(message) {
		_closeComponent(message.from)
	}

	var _incomingMigrateComponentComplete = function(message) {
		_closeComponent(message.to)
	}

	var _incomingPairFromVariable = function(message) {
		var messageFrom = message.from
		var messageTo = message.to

		_getComponent(messageFrom).pairVariableOutgoing(messageFrom, messageTo)
	}

	var _incomingPairToVariable = function(message) {
		var messageFrom = message.from
		var messageTo = message.to

		_getComponent(messageTo).pairVariableIncoming(messageFrom, messageTo)
	}

	var _incomingYMessage = function(message) {
		var messageTo = message.to

		_getComponent(messageTo).receiveYMessage(message)
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

	var _getDeviceSnapshot = function() {
		var snapshot = {
			components: {}
		}
		for(var i in __componentsReference) {
			snapshot.components[i] = __componentsReference[i]._getComponentSnapshot()
		}

		return snapshot
	}

	var _createDefaultDatabaseObject = function(type) {
		return {
      _id: type,
      snapshots: {}
    }
	}

	var _loadDatabase = function() {
		return new Promise(function(resolve, reject) {
			__database = new PouchDB(__databaseName)
			if(__database){
				__database.createIndex({
				  index: {
				    fields: ['type', 'label']
				  }
				}).then(function (result) {
				  if(result.result == 'created') {
				  	resolve()
				  } else if(result.result == 'exists') {
				  	resolve()
				  }
				}).catch(function (err) {
				  reject(err)
				})
			} else {
				reject(new Error('LocalDB is not loaded'))
			}
		})
	}

	var _saveDeviceState = function(label) {
		return new Promise(function(resolve, reject) {
			var tempId = Date.now().toString()

			if(!label)
				label = tempId

			var snapshot = _getDeviceSnapshot()

			var newDocument = {
				_id: tempId,
				type: 'deviceState',
				label: label,
				snapshot: snapshot
			}
		
			__database.put(newDocument)
				.then(function(doc) {
			 		resolve(doc)
				})
				.catch(reject)
		})
	}

	var _loadDeviceState = function(label) {
		return new Promise(function(resolve, reject) {
			_getDeviceState(label)
				.then(function(result) {
					var promisesList = []

					if(result[0]) {
						for(var i in result[0].snapshot.components) {
							if(result[0].snapshot.components[i].type != 'migrate') {
								(function(index) {
									var savedComp = result[0].snapshot.components[index]
									var createAndPopulate = _loadAndCreateComponent(savedComp.type, document.querySelector('body'), savedComp.options).then(function(component){
									component._populateStorage(savedComp.variables)
									promisesList.push(createAndPopulate)
								})})(i)
							}
						}

						Promise.all(promisesList).then(resolve)
					} else {
						reject(new Error('Label does not exist'))
					}
				})
				.catch(reject)
		})
	}

	var _getDeviceState = function(label) {
		return new Promise(function(resolve, reject) {
			__database.find({
			  selector: {
			    type: 'deviceState',
			    label: label
			  }
			})
				.then(function(result) {
					resolve(result.docs)
				})
				.catch(reject)
		})
	}

	var _getAllDeviceState = function() {
		return new Promise(function(resolve, reject) {
			__database.find({
			  selector: {
			    type: 'deviceState'
			  }
			})
				.then(function(result) {
					resolve(result.docs)
				})
				.catch(reject)
		})
	}

	var _saveComponentState = function(label, componentURL) {
		return new Promise(function(resolve, reject) {

		})
	}

	var _loadComponentState = function(label) {

	}

	var _getComponentState = function(label) {

	}

	var _getAllComponentState = function() {

	}

	var _saveVariableState = function(label) {

	}

	var _loadVariableState = function(label) {
		
	}

	var _getVariableState = function(label) {

	}

	var _getAllVariableState = function() {

	}

	return {
		create: _create,
		isConnected: _isConnected,

		// Device API
		loadAsset: _loadAsset,

		// Devices API
		connectDevice: _connectDevice,
		sendMessage: _sendMessage,

		// Components API
		loadComponent: _loadComponent,
		createComponent: _createComponent,
		loadAndCreateComponent: _loadAndCreateComponent,
		closeComponent: _closeComponent,
		deleteComponent: _deleteComponent,
		migrateComponent: _migrateComponent,
		forkComponent: _forkComponent,
		cloneComponent: _cloneComponent,
		cloneAndHideComponent: _cloneAndHideComponent,
		pairComponent: _pairComponent,

		// Variable API
		pairVariable: _pairVariable,

		// Persistence API
		saveDeviceState: _saveDeviceState,
		loadDeviceState: _loadDeviceState,
		getAllDeviceState: _getAllDeviceState,
		getDeviceState: _getDeviceState,
		saveComponentState: _saveComponentState,
		loadComponentState: _loadComponentState,
		getAllComponentState: _getAllComponentState,
		getComponentState: _getComponentState,
		saveVariableState: _saveVariableState,
		loadVariableState: _loadVariableState,
		getAllVariableState: _getAllVariableState,
		getVariableState: _getVariableState,

		getLoadedComponents: _getLoadedComponents,
		getLoadableComponents: _getLoadableComponents,

		getComponents: _getComponents,
		getComponent: _getComponent,
		getDeviceId: _getDeviceId,
		getDevicesList: _getDevicesList,
		getDevicesInfoList: _getDevicesInfoList,
		getUsername: _getUsername,
		getConnectionState: _getConnectionState,

		addEventListener: _addEventListener,
		removeEventListener: _removeEventListener,

		setLastTouch: _setLastTouch,
		getLastTouch: _getLastTouch
	}
})();