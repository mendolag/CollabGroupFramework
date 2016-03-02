var debug = require('debug')
var log = debug("lf:topology")

var idCreator = 0
var topo = {
	nodes: {},
	links: {}
}

module.exports = function(application) {

	var getNewConnection = function(device_id, cb) {
		var id = undefined

		for(var n in topo.nodes) {

			if(topo.nodes[n].links.length < 2 && topo.nodes[n].id != device_id) {
				id = topo.nodes[n].id
			}
		}
		if(id != undefined) {
			application.sockets[application.devices[device_id]].emit('peer', {
				type: "connect",
				links: [{
					from: device_id,
					to: id
				}]
			})
		}
	}

	var getTopology = function() {
		return topo
	}

	var addNode = function(id) {
		topo.nodes[id] = {
			id: id,
			links: []
		}
	}

	var removeNode = function(id) {
		var links = topo.nodes[id].links

		for(var i = 0; i < links.length; i++) {
			var l = links[i]

			if(l == undefined) {
				var from = topo.links[l].from 
				var to = topo.links[l].to

				var n = undefined
				if(from == id) {
					n = to
				} else {
					n = from
				}

				var otherNodeLinks = topo.nodes[n].links
				var index = undefined
				for(var j = 0; j < otherNodeLinks.length; j++) {
					if(l == otherNodeLinks[j]) {
						index = j
					}
				}
				topo.nodes[n].links.splice(index,1)
			}
				
			delete topo.links[l]
		}

		delete topo.nodes[id]

		recomputeLinks()
	}

	var addLink = function(idFrom, idTo) {
		if(topo.nodes[idTo] == undefined || topo.nodes[idFrom] == undefined)
			return

		var id = getNewLinkId()
		topo.links[id] = {
			from: idFrom,
			to: idTo
		}

		topo.nodes[idTo].links.push(id)
		topo.nodes[idFrom].links.push(id)

	}

	var removeLink = function(idFrom, idTo) {
		if(topo.nodes[idFrom] == undefined || topo.nodes[idTo] == undefined)
			return

		var linksFrom = topo.nodes[idFrom].links
		var linksTo = topo.nodes[idTo].links

		for(var i = 0; linksFrom.length; i++) {
			var idLink = linksFrom[i]
			var l = topo.links[idLink]

			if(l.from == idFrom && l.to == idTo) {
				delete topo.links[idLink]
				topo.nodes[idFrom].links.splice(i, 1)

				for(var j = 0; j < linksTo.length; j++) {
					if(linksTo[i] == idLink) {
						topo.nodes[idTo].links.splice(j,1)
					}

					return
				}
			}
		}
	}

	var postData = function(data) {
		var entity = data.entity
		var type = data.type

		if(entity == 'peer') {
			switch(type) {
				default:
					break;
			}
		} else if (entity == 'link'){
			switch(type) {
				default:
					break;
			}
		} else {
			console.log('Entity error')
		}
	}

	var isBalanced = function() {
		return true
	}

	var recomputeLinks = function() {

	}

	var getNewLinkId = function() {
		idCreator++
		return idCreator
	}

	var variableForwarding = function(state) {
		// io.sockets.emit('state', state)
	}


	// Initialization
	var Topology = function() {}

	// Public class methods
	Topology.prototype = {
		getNewConnection: getNewConnection,
		getTopology: getTopology,
		postData: postData,

		addNode: addNode,
		removeNode: removeNode,

		addLink: addLink,
		removeLink: removeLink,

		isBalanced: isBalanced,
		recomputeLinks: recomputeLinks,

		variableForwarding: variableForwarding
	}

	return Topology
}

// Exports
// module.exports = Topology