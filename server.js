/**
 * Created by josmendola on 08/01/16.
 */
// server.js

var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var path     = require('path');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var http         = require('http').Server(app);
var io           = require('socket.io')(http);
var liquidListener=require('./app/liquidListener.js');
// Put this statement near the top of your module
var bodyParser = require('body-parser');



var configDB = require('./config/database.js');
//var bower=require('./bower_components');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
 require('./config/passport')(passport); // pass passport for configuration
var dbfunc = require('./app/dbfunc.js');
dbfunc.init();
// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser('MyKEY')); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'MyKEY', cookie : {
 expires: false,
 secure:false
}
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// Put these statements before you define any routes.
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//socket connection initialization


// http.listen(3000,function(){
//  console.log('socket open on port *3000')
// })
// routes ======================================================================
require('./app/routes.js')(app, passport,io); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
app.use(express.static(path.join(process.cwd(), 'public')))
app.use(express.static(path.join(process.cwd(), 'public', 'applications', 'app1', 'public')))
app.use('/static', express.static(path.join(process.cwd(), 'bower_components')));
app.use('/mycomp', express.static(path.join(process.cwd(), 'components')));
app.use('/style',express.static(path.join(process.cwd(), 'views/style')));
//app.use('/liquid',express.static(path.join(process.cwd(), 'liquid')))
//app.use('/bower_components', express.static(path.join(process.cwd(), 'bower_components')))
//app.use(xpress.static(path.join(process.cwd(), 'public', 'applications', 'app1', 'public')))
//app.use(express.static(bower, 'html'));
//app.use(express.static(components, 'html'));


//TODO: Andrea's hack
bowerFolder = path.join(__dirname, 'liquid.js/liquid', 'bower_components')
applicationFolder = path.join(__dirname, 'liquid.js/liquid', 'applications')
liquidComponentFolder = path.join(__dirname, 'liquid.js/liquid',  'liquidComponents')
dependencyComponentFolder = path.join(__dirname, 'liquid.js/liquid',  'components')

app.use(express.static(bowerFolder))
app.use(express.static(applicationFolder))
app.use(express.static(liquidComponentFolder))
app.use(express.static(dependencyComponentFolder))




console.log('The magic happens on port ' + port);