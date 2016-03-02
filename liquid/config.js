var config = {
	title: 'Liquid',
	folder: 'applications/app1',

	deploymentServer: {
		enable: true,
		port: 8888,
		route: '/liquid',
		host: 'http://localhost'
	},

	stateServer: {
		enable: true,
		port: 12304,
		host: 'http://localhost'
	},

	signalingServer: {
		enable: true,
		port: 12305,
		host: 'localhost',
		path: '/signaling'
	},

	components: ['text', 'keyboard', 'webcam', 'playground'],
	database:	"mongodb://localhost/liquid"
}

module.exports = config