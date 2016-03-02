var debug = require('debug')
var log = debug("lf:databaseManager")

var mongoose = require('mongoose')

var connect = function(url){
	try {
		mongoose.connect(url)
	} catch(err) {
		log("Database failed to connect")
	}
}

module.exports = {
	connect: connect
}