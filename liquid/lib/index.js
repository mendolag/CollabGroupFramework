var log = require('debug')("ljs");

log('Loading signalingServer')
require('./signalingServer')

log('Loading stateServer')
require('./stateServer')

log('Loading deploymentServer')
require('./deploymentServer');

log('Done')
// var http = require('./server')

// var path = require('path')
// var fs = require('fs');
// var child = require('child_process');


/*
 */
// var get_running_applications = function(callback) {
// 	var apps = []
// 	for(var a in applications) {
// 		apps.push(a)
// 	}
// 	callback(apps)
// }

/*
 */
// var run_application = function(id, callback) {
// 	var code = codes.no_error

// 	var childProcess = child.spawn('node', ['./constructor.js', name,_dir + '/'], {stdio:  ['pipe', 1, 2, 'ipc']})

// 	spawned.on('message', function(m) {
// 		switch(m.type) {
// 			default:
// 				log('Received message type unknown: ' + m.type)
// 				break;
// 		}
// 	})

// 	spawned.on('close', function(code) {
// 		log('Closed application: ' + name)
// 	})

// 	applications[name] = {
// 		id: name,
// 		process: childProcess
// 	}

// 	callback(code, name)
// }

// module.exports = function(config) {
// 	for(var key in config) {
// 		defaultConfig[key] = config[key]
// 	};



	// var am = new ApplicationManager(folder);

	// /* Lists all available applications
	//  */
	// var list = function() {

	// };

	// /* Runs an application
	//  * @params (number) the id of the application
	//  */
	// var run = function() {

	// };

	// /* Lists all running applications
	//  */
	// var running = function() {

	// };

	// /* Stops a running application
	//  * @params (number) the id of the running application
	//  */
	// var stop = function() {

	// };

// 	return {
// 		list: list,
// 		run: run,
// 		running: running,
// 		stop: stop
// 	};
// }

// log('Liquid started');

/*
 * Standard in for console commands
 */
// process.stdin.resume();
// process.stdin.setEncoding('utf8');
// process.stdin.on('data', function (line) { 
// 	var cmd = line.replace('\n', '').split(' ')

// 	switch(cmd[0]) {
// 		case "":
// 			//empty line
// 			break;
// 		case "help":

// 			break;

// 		case "list":
// 			AM.update_list(function(apps){
// 				var output = "--------------------------------\nList of applications:\n"

// 				for(var i = 0; i < apps.length; i++) {
// 					output += "  - " + apps[i] + "\n"
// 				}

// 				output += "--------------------------------"

// 				console.log(output)
// 			})
// 			break;

// 		case "run":
// 			AM.run_application(cmd[1], function(code, name){
// 				if(code != codes.no_error) {
// 					console.log('Application ' + name  + ' started')
// 				}
// 			})
// 			break;

// 		case "running":
// 			AM.get_running_applications(function(apps){
// 				var output = "--------------------------------\nList of running applications:\n"

// 				for(var i = 0; i < apps.length; i++) {
// 					output += "  - " + apps[i] + "\n"
// 				}

// 				output += "--------------------------------"

// 				console.log(output)
// 			})
// 			break;

// 		case "stop":
// 			AM.stop_application(cmd[1], function(code) {
// 				if(code != codes.no_error) {
// 					console.log('Application ' + name  + ' stopped')
// 				}
// 			})
// 			break;

// 		default:
// 			console.log("Invalid command")
// 			break;
// 	}
// })


/*
 * Automatically run an application on command line
 *	
 */
// if(process.argv[2]) {
// 	AM.run_application(process.argv[2], function(code, name){
// 		if(code != codes.no_error) {
// 			console.log('Application' + name  + ' automatically started')
// 		}
// 	})
// }