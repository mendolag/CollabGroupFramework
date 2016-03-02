var Liquid = (function () {
	var __socket = undefined
	var __state = undefined
	var __commons = undefined
	var __locals = undefined

	var __initialised = false
	var __connected = false
	var __state = {}
	var __counter = 0
	var __token = 0
	var __windows = {}
	var __windowReferences = {}
	var __subscriptions = {}
	var __devices = undefined
	var __registeredClones = {}

	var __customEvents = {}
	var __listeners = {}

	var __draggable = false
	var __zindex = 0

	var __deviceId = undefined
	var __username = undefined
	var __components = undefined
	var __loadedComponents = []
	var __importedComponents = {}

	var __defaultComponents = [
		'/bower_components/webcomponentsjs/webcomponents.js',
		'/bower_components/polymer/polymer.html',
		'/components/liquidComponents/liquid-behavior/liquid-behavior.html',
		'/components/liquidComponents/liquid-page/liquid-page.html',
		'/components/liquidComponents/liquid-frame/liquid-frame.html',
		'/components/liquidComponents/liquid-dropdown/liquid-dropdown.html'
	]

	var __config = {}
	var __defaultConfig = {
		deploymentServers: ['http://localhost:8888'],
		stateServer: 'http://localhost:8888',
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
		for(var c in __defaultComponents) {
			var name = __defaultComponents[c]
			if(!__importedComponents[name]) {
				return false
			}
		}
		return true
	}

	var _loadDefault = function(callback) {
		var load = function(components) {
			var c = components.shift()
			if(c) {
				_ajaxRequest({relUrl: c, ext: 'html'}, function(){
					load(components)
				})
			} else {
				callback()
			}
		}

		load(__defaultComponents.slice())
	}

	var _loadComponent = function(componentName, callback) {
		var loadRequestedComponent = function() {
			_ajaxRequest({relUrl: '/appComponents/' + componentName + '.html', ext: 'html'}, function(){
				__loadedComponents.push(componentName)
				if(callback)
					callback()
			})
		}

		if(!_isLoadedDefault()) {
			_loadDefault(loadRequestedComponent)
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
		if(typeof(opts) == 'function') {
			callback = opts
			opts = {}
		}

		var id = _createUniqueId()
		var frameId = 'liquid_frame_' + id

		// var frame = document.createElement('liquid-page')
		var component = document.createElement('liquid-page-' + componentName)
		component.setAttribute('id', frameId)
		// frame.setAttribute('class', 'liquid_frame')
		component.windowId = id

		if(opts.liquidExperience) {
			var liquidExperience = document.createElement('liquid-frame')
			component.insertBefore(liquidExperience, component.firstChild);
		}
		element.appendChild(component)

		if(callback) 
			callback({
				id: frameId,
				component: component,
				componentURL: ''
			})

		// if(pair != undefined) {
		// 	frame.sharedId = pair.sharedId
		// 	liquid.registerCloneWindow(pair, id)
		// } else {
		// 	frame.sharedId = __deviceId + "_" + id
		// }

		// if(!__windows[componentName]) {
		// 	__windows[componentName] = []
		// }

		// __windows[componentName].push(id)
		// __windowReferences[id] = frame

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
        	console.log('ciao')
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
		return __components
	}

	var _getLoadedComponents = function() {
		return __loadedComponents
	}

	var _getDeviceId = function() {
		return __deviceId
	}

	var _getUsername = function() {
		return __username
	}

	var _configuration = function(opts) {
		for(var c in opts) {
			if(!__config[c]) {
				__config[c] = opts[c]
			}
		}
	}

	var _ajaxRequest = function(file, success, fail) {
		var serversList = (__config.deploymentServers || __defaultConfig.deploymentServers).slice()

		var checkAllServers = function(servers) {
			var server = servers.shift()

			if(server) {
				var req = new XMLHttpRequest();
				req.open('GET', server + '/echo', true)

				req.onreadystatechange = function() {
				  if (req.readyState == 4) {
				  	if(req.status == 200) {
				  		if(file.ext == 'script') {
				  			_requestScript(server, file, success)
				  		} else if (file.ext == 'html') {
				  			_requestHTML(server, file, success)
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

		_ajaxRequest({relUrl: '/socket.io/socket.io.js', ext: 'script'}, function(){
			var url = __config.stateServer || __defaultConfig.stateServer
			var opts = __config.stateServerOpts || __defaultConfig.stateServerOpts
			
			__socket = io(url, opts)

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
				_runEvent('reconnect')
			})

			__socket.on('connected', function(data) {
				__deviceId = data.id
				__user = data.id
				__state = data.state
				__locals = data.locals
				__variable_subscriptions = data.globals
				__webrtc = data.servers.webrtc
				__xmpp = data.servers.xmpp
				__wsliquid = data.servers.wsliquid
				__components = data.components
				__initialisations = data.initialisations
				__permissions = data.permissions

				__connected = true
				__initialised = true

				for(var s in __state) {
					__subscriptions[s] = {}
				}

				// connectPeer()
				_runEvent('connect', [__deviceId, __loadedComponents])
			})

			__socket.on('deviceList', function(data) {
				__devices = data.devices
				_runEvent('pairedDeviceUpdate', [__devices])
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
			if(callback)
				callback()
		}, function(){
			console.log('Failed to retrieve socket.io')
		})	
	}

	// state = {}
	// commons = exports.__load_commons()
	// locals = __load_locals()

	return {
		create: _create,
		isConnected: _isConnected,

		loadComponent: _loadComponent,
		createComponent: _createComponent,

		_getComponents: _getComponents,
		getLoadedComponents: _getLoadedComponents,
		getDeviceId: _getDeviceId,
		getUsername: _getUsername,

		addEventListener: _addEventListener,
		removeEventListener: _removeEventListener
	}
})();