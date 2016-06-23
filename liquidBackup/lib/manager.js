/* 
 * 
 * @params (function)
 */
var get_running_applications = function(callback) {
	log('Listing running applications')
	var apps = []
	
	for(var a in applications) {
		apps.push(a)
	}

	callback(apps)
}

/*
 * Input: callback(apps)
 *
 * The function returns through a callback the names of all applications in the applications folder
 */
var update_list = function(callback) {
	log('Listing all applications')

	var files = fs.readdirSync(_dir)
	var dirs = []

	if(files.length == 0) {
		return callback([])
	}

	for(var index = 0; index < files.length; index++) {

		var checked = 0
		var file = files[index]			
		var path = _dir + '/' + file

		var stat = fs.statSync(path)
		if (stat.isDirectory()) {
            dirs.push(file); 
        } 
	}

	return callback(dirs)
}

/*
 * Input: 
 *		name: name of the application the user wants to run
 *		callback(code, name)
 *
 * The function runs a child process if possible. Through the callback it sends the error code (if any) and the name of the application
 */
var run_application = function(name, callback) {
	log('Opening application: ' + name)
	var code = codes.no_error



	if(true) {
		var spawned = child.spawn('node', ['./modules/applicationConstructor.js', name,_dir + '/'], {stdio:  ['pipe', 1, 2, 'ipc']})

		spawned.on('message', function(m) {
			switch(m.type) {
				default:
					log('Received message type unknown: ' + m.type)
					break;
			}
		})

		spawned.on('close', function(code) {
			log('Closed application: ' + name)
		})

		applications[name] = {
			id: name,
			process: spawned
		}
	}

	callback(code, name)
}

/*
 * Input: 
 *		name: stops the application with the corresponding name
 *		callback(code)
 *
 * Stops a child process application and return the corresponding error code
 */
var stop_application = function(name, callback) {

}

// Initialization
function ApplicationManager (directory) {
	_dir = directory
}


// Public class methods
ApplicationManager.prototype = {
	update_list: update_list,
	run_application: run_application,
	stop_application: stop_application,
	get_running_applications: get_running_applications
}


// Exports
module.exports = ApplicationManager