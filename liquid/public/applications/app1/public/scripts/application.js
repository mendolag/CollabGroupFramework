var load = function() {
	Liquid.create({
		deploymentServers: [{
			host: deploymentServer.host,
			port: deploymentServer.port
		}],
		stateServer: {
			host: stateServer.host,
			port: stateServer.port
		},
		signalingServer: {
			host: signalingServer.host,
			port: signalingServer.port,
			path: signalingServer.path
		}
	}, function() {
		Liquid.createComponent('migrate', document.querySelector('body'), {'liquidUI': false}, function(id, component) {
			console.log(id)
			Liquid.loadComponent('playground', function(){
				Liquid.createComponent('playground', document.querySelector('body'), {'liquidUI': true}, function(id, component){
					console.log(id)
				})
			})
		})
	})
}