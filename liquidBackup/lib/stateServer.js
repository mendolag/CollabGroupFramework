var log = require('debug')("ljs:stateServer");
var logPeer = require('debug')('ljs:signalingServer')
var config = require('../config');
var codes = require('./codes');
var path = require('path')
var fs = require('fs')
var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server);
var p2p = require('socket.io-p2p-server').Server;
/*
 * Giuseppe's imports
 */
var dbFuncs=require('../../app/dbfunc');

// var mongoose = require('mongoose')
// mongoose.connect(config.database.url)

var publicFolder = undefined
var applicationFolder = undefined

var _devices=[];
var liquidListener=null;

var _links={pairedDevices:[], pairedComponents:[], pairedVariables:[]}

var application = {
  id_progression: 0,
  socket_subscriptions: {},
  devices: {},
  sockets: {},
  usernames: {},
  devicesInfo: {}
}

// var loadCommons = function() {
//   application.commons = {}
//   var commons = require(applicationFolder + '/scripts/commons.js').__load_commons()
//   for(var c in commons) {
//     application.commons[c] = commons[c]
//   }

//   application.commons._set = function(v, value) {
//     application.state[v] = value

//     var name = v + "_processing"
//     var f = application.commons[name]
//     if(typeof(application.commons[name]) == 'function') {
//         application.commons[name](value)
//       }
//     onVariableChange(v, value)
//   }

//   application.commons._get = function(v) {
//     return application.state[v]
//   }
// }

var initialiseState = function() {
  application.state = {}
  for(var v in application.globals) {
    application.state[v] = application.variables_initialisation[v]
  }
}

/*
 * Input: 
 *    v: the name of the variable
 *
 * Returns an array of all the sockets that need to be updated
 */
function getSubscribedSockets(v) {
  var socket_array = []

  var subscriptions = application.sharing[v]

  for(var i = 0; i < subscriptions.length; i++) {
    var ss = application.socket_subscriptions[subscriptions[i]]
    for(var j = 0; j < ss.length; j++) {
      var s = ss[j]
      socket_array.push(s)
    }
  }

  return socket_array
}

/*
 * Input: 
 *    group: the name of the subscription groupC
 *
 * Returns a JSON with the executions specifications needed to the subscription group
 */
function executionJSON(group) {
  var data = {}

  var variables = application.group_sharing[group]
  for(var variable in variables) {
    if(application.group_sharing[group][variable] == true) {
      data[variable] = application.executions[variable]
    }
  }

  return data
}

/*
 * Returns a unique ID
 */
function createID() {
  var date = new Date()
  return date.getTime()
}

/*
 * Validation of the config file
 */
function initialiseApplication() {
  application.title = config.deploymentServer.title
  application.port = config.deploymentServer.port

  //TODO AUTOMATIC DETECT
  application.components = []
  application.globals = {}
  application.globals_subscriptions = {}
  application.locals = {}
  application.locals_subscriptions = {}

  application.components = config.components

  application.variable_forwarding = 'socket'
  application.wsliquid = config.stateServer
}

function variableForwarding(state) {
  if(application.variable_forwarding == 'webrtc') {
    webRTCServer.variableForwarding(state)
  } else if(application.variable_forwarding == 'socket') {
    io.sockets.emit('state', state)
  } else {
    console.log('Internal error, variable forwarding')
  }
}

var onVariableChange = function(v,value) {
  var o = {}
  o[v] = value
  variableForwarding(o)
}


var isValidUsername = function(username) {
  if(username == undefined || username == '') {
    return false
  }
  return true
}


/*
 * Giuseppe's functions
 */

var generateGuestLink=function(groupID){
  var url= config.groupFramework.host+":"+config.groupFramework.port+"/guest/?"+groupID
  return url;
}

var getDeviceInfo=function(devices,devicesInfo){
  var groupDevicesInfo={}
  for (var id in devices){
    groupDevicesInfo[id]=devicesInfo[id]
  }
  console.log(groupDevicesInfo);
  return groupDevicesInfo;
}

var advertiseGroup=function(group,socket,io, application,deviceID,groupDetail){
  console.log("advertiseGroup");
  if(deviceID==group.manager){
    console.log("groupManager emit")
    socket.emit('groupDetails',{group:groupDetail,qr:generateGuestLink(group.id)})
    io.to(group.id).emit('groupManager', {groupManager: group.manager})
  }
  var deviceInfo=getDeviceInfo(group.devices,application.devicesInfo)
  console.log(group.devices)
  console.log(deviceInfo);
  console.log(application.components);
  socket.join(group.id)
  // socket.emit('groupManager',)
  io.to(group.id).emit('componentsList', {components: application.components})
  io.to(group.id).emit('deviceList', {
    devices: group.devices,
    devicesInfo: getDeviceInfo(group.devices,application.devicesInfo),
    groupManager:group.manager
  })
}

var structureGroupsInfo=function(groups){
  var gInfo=[]
  for(var i=0;i<groups.length;i++ ){
    console.log()
    var group=groups[i]
    console.log(group);
    var groupManagerID=""
    groupManagerID=group.groupManager.deviceID;
    gInfo.push({
      id:group._id,
      name:group.name,
      manager:groupManagerID,
      devices:getDeviceID(group,groupManagerID),
    })

  }
  return gInfo;
}

var getDeviceID=function(group,groupManager){
  console.log("getDeviceID");
  var devices={}
  if(groupManager!=null){
    devices[groupManager]=groupManager}
  var users=group.users;
  var guests=group.guests;
  for(var i=0;i<users.length;i++ ){
    var user=users[i];
    if(user.deviceID!=null){
      devices[user.deviceID]=user.deviceID;
    }
  }
  for(var i=0;i<guests.length;i++ ){
    var guest=guests[i];
    if(guest!=null){
      devices[guest]=guest;}
  }
  return devices
}

var advertiseAllGroups=function(deviceID,socket,io,application){
  console.log("advertiseAllGroups");
  dbFuncs.getGroupsOfDeviceID(deviceID,function(err,groups) {
    if (err) {
      console.log(err);
      return false;
    }
    if (groups != null) {
      var structGroups =  structureGroupsInfo(groups);
      for (var i = 0; i < structGroups.length; i++) {
        advertiseGroup(structGroups[i], socket, io, application,deviceID,groups[i]);
      }
      return true;
    }else{
      return false;
    }
  })
}

/*
 * Giuseppe's functions
 */


var openSocketServer = function() {
  var port = config.stateServer.port
  server.listen(port);

  var rooms = {}
  var clients = {}

  var cache = {}

  // app.get('/', function(req, res) {
  //   var rs = {}

  //   for(var r in rooms) {
  //     rs[r] = {
  //       usersCounter: rooms[r].usersCounter
  //     }
  //   }

  //   res.json(rs)
  // })

  io.on('connection', function(socket){

    var __id = socket.id
    var __device_id = undefined

    socket.emit('handshake' , {})

    socket.on('handshake', function(message){
      var type = message.type

      switch(type) {
        case 'new':
          console.log("new connection");
          __device_id = createID()
          application.sockets[__id] = socket
          application.devices[__device_id] = __id
          application.usernames[__device_id] = __device_id
          application.devicesInfo[__device_id] = message.device
          // Giuseppe's add
          var userID=message.username;
          var groupID=message.groupID
           console.log(message);
              if(userID!=undefined){
          dbFuncs.updateUserDeviceId(userID,__device_id,function (err,user) {
            if(err){
              console.log(err);
              throw err;
            }else{
              socket.emit('connected', {
                id: __device_id,
              })
              advertiseAllGroups(__device_id,socket,io,application);
            }
          })
        }else if(groupID!=undefined){
          dbFuncs.addGuestToGroup(groupID,__device_id,function (err,group) {
            if(err){
              console.log(err);
              //throw err;
            }else if(group!=null){
              console.log("addGuestToGroup")
              console.log(group);
              socket.emit('connected', {
                id: __device_id})
                advertiseAllGroups(__device_id,socket,io,application);}
            else{
                console.log("no group found with that id");
              }
          })
        }else{
                console.log("No connections for you")
              }

          // application.sockets[__id] = socket
          // application.devices[__device_id] = __id
          // application.usernames[__device_id] = __device_id
          // application.devicesInfo[__device_id] = message.device


          // io.sockets.emit('deviceList', {
          //   devices: application.usernames,
          //   devicesInfo: application.devicesInfo
          // })
          log('Connected: ' + __device_id)
          break;
        case 'reconnect':
          // Giuseppe's add
          var userID=message.username;
          var groupID=message.groupID
          
          if(userID!=undefined) {
            dbFuncs.updateUserDeviceId(userID, message.id, function (err, user) {
              if (err) {
                console.log(err);
                throw err;
              } else {
                socket.emit('reconnected', {
                  id: __device_id,
                })
                advertiseAllGroups(__device_id, socket, io, application,user._id);
              }
            })
          }else if(groupID!=undefined){
            console.log("Guest reconnect")
            console.log(groupID)
            console.log(__device_id);
            dbFuncs.addGuestToGroup(groupID,message.id,function (err,group) {
              if (err) {
                console.log(err);
                //throw err;
              } else if (group != null) {
                console.log("addGuestToGroup")
                console.log(group);
                socket.emit('reconnected', {
                  id: __device_id
                })
                advertiseAllGroups(__device_id, socket, io, application);
              }
            })

          }else{
              console.log("Reconnect of user without group")
            }
          __device_id = message.id

          var name = __device_id //message.username

          if(!isValidUsername(name)) {
            name = __device_id
          }

          application.sockets[__id] = socket
          application.devices[__device_id] = __id
          application.usernames[__device_id] =  name
          application.devicesInfo[__device_id] = message.device



          console.log('Reconnected: ' + __device_id)
          // socket.emit('reconnected', {})
          break;
        default:
          console.log('Error on handshake: Message type: ' + message.type)
          break;
      }

      //advertiseAllGroups(__device_id,socket,io,application);
      // dbFuncs.getGroupsOfDeviceID(__device_id,function(err,groups) {
      //   if(err){
      //     console.log(err);
      //   }
      //   if(groups!=null){
      //   var structGroups = structureGroupsInfo(groups);
      //   console.log("structGroups");
      //   console.log(structGroups)
      //   for (var i = 0; i < structGroups.length; i++) {
      //     advertiseGroup(structGroups[i], socket, io, application);
      //   }

      // if(liquidListener){
      //   liquidListener.onConnect(__device_id,{
      //     components: application.components,
      //     devices: application.usernames,
      //     devicesInfo: application.devicesInfo
      //   },function(err,groups){
      //     if(err){
      //       console.log(err)
      //     }else if(groups!=null){
      //       console.log("groups");
      //       console.log(groups);
      //       for(var i=0;i<groups;i++){
      //         advertiseGroup(groups[i],socket,io,application);
      //       }


      //}else{
      //console.log("no groups")
      // io.sockets.emit('componentsList', {components: application.components})
      // io.sockets.emit('deviceList', {
      //   devices: {__device_id:__device_id},
      //   devicesInfo: application.devicesInfo
      // })
      //}
      //});
      // }else {
      //   console.log("should not be called")
      //   io.sockets.emit('componentsList', {components: application.components})
      //   io.sockets.emit('deviceList', {
      //     devices: application.usernames,
      //     devicesInfo: application.devicesInfo
      //   })
      // }


    })

    socket.on('username', function(data) {
      var name = data.name

      if(isValidUsername(name)) {
        application.usernames[__device_id] = name
        io.sockets.emit('deviceList', {
          devices: application.usernames,
          devicesInfo: application.devicesInfo
        })
      } else {
        //TODO: low priority
      }
    })

    socket.on('state', function(data) {
      for(var v in data) {
        var value = data[v]

        application.state[v] = value

        var name = v + "_processing"
        application.commons[name]
        if(typeof(application.commons[name]) == 'function') {
          application.commons[name](value)
        }

        //TODO send only if necessary
        var o = {}
        o[v] = value
        variableForwarding(o)
      }
    })

    socket.on('local', function(data) {
      var local = data.local
      var type = data.type
      var device = data.device
      var windowId = data.windowId
      var token = data.token
      var from = data.from
      var pair = data.pair

      application.sockets[application.devices[device]].emit('local', {
        local: local,
        type: type,
        device: device,
        windowId: windowId,
        token: token,
        from: from,
        pair: pair
      })
    })

    socket.on('newWindow', function(data){
      var device = data.device
      var page = data.page
      var locals = data.locals
      var pair = data.pair
      var from = data.from

      var s = application.sockets[application.devices[device]].emit('newWindow',{
        page: page,
        locals: locals,
        pair: pair,
        from: from
      })
    })

    socket.on('disconnect', function() {
      delete application.sockets[__id]
      delete application.devices[__device_id]
      delete application.usernames[__device_id]
      delete application.devicesInfo[__device_id]
      dbFuncs.clearDeviceID(__device_id);
      //liquidListener.onDisconnect(__device_id);
      io.sockets.emit('deviceList', {
        devices: application.usernames,
        devicesInfo: application.devicesInfo
      })
    })

    socket.on('error', function(err) {
      log('Error ' + err)
    })
  });




}

// io.on('connection', function(socket) {
//   log('New cliend connected')
//   var room = undefined
//   var page = undefined
//   clients[socket.id] = socket

//   socket.on('joinRoom', function(data) {
//     room = findOrCreateRoom(data.name)
//     page = data.page

//     socket.join(page)
//     for(var i in data.globals) {
//       var value = data.globals[i]
//       if(cache[i] === undefined) {
//         cache[i] = value
//       }

//       socket.emit('globalChange', {v: i, value: cache[i]})
//     }

//     socket.join(room.name)

//     room.usersCounter++
//     room.usersSockets.push(socket)

//     p2p(socket, null, room);

//     socket.emit('joinRoom', {id: socket.id})
//   })

//   socket.on('globalChange', function(data) {
//     var v = data.variable
//     var value = data.value

//     if(cache[v] != value) {
//       cache[v] = value
//       io.to(page).emit('globalChange', {v: v, value: value})
//     }
//   })

//   socket.on('disconnect', function() {
//     userLeft(room, socket)
//   })

//   socket.on('error', function(err) {
//     log('Error ' + err)
//   })

//   socket.emit('handshake')
// });

var findOrCreateRoom = function(name) {
  var room = findRoom(name)

  if(room === undefined) {
    return createRoom(name)
  } else {
    return room
  }
}

var findRoom = function(name) {
  if(rooms[name] === undefined) {
    return undefined
  }

  return rooms[name]
}

var createRoom = function(name) {
  var room = {
    name: name,
    usersCounter: 0,
    usersSockets: []
  }

  return addRoom(room)
}

var addRoom = function(r) {
  rooms[r.name] = r
  return rooms[r.name]
}

var removeRoom = function(r) {
  delete rooms[r.name]
}

var userLeft = function(r, socket) {
  if(r === undefined) {
    return
  }

  io.to(r.name).emit('disconnected-liquid')
  r.usersCounter--
  r.usersSockets.splice(r.usersSockets.indexOf(socket), 1)
  if(r.usersCounter == 0) {
    removeRoom(r)
  }
}


var  getSocketByDeviceId = function(deviceId) {
  if(!application.devices[deviceId])
    return undefined

  var socketId = application.devices[deviceId]
  return application.sockets[socketId]
}

/*
 computeCompoundAPIAnswer(answer, callback)
 computes collective single or multiple responses to pack them into a single one
 in a spectific object schema returned by a callback.
 responesSchema:
 {devices:[device:{id:int,
 components:[{id:int, type:String,
 variables:[{name:String, type:String, permissions:String}]}]}],
 components: [String],
 links: {
 pairedDevices: [{from:Number, to:Number}],
 pairedComponents:[?],
 pairedVariables:[?]
 }
 */
var computeCompoundAPIAnswer = function(answer, callback) {
  var devices=[]
  var pairedDevices=[]
  for(var i in answer){

    var comp=answer[i].components
    var components=[];
    for (var keyC in comp){

      var variables=[];
      var vars=comp[keyC].variables
      for(var keyV in vars){
        var variable={name:keyV,
          scope:vars[keyV].scope,
        }
        variables.push(variable);
      }

      var component={id:comp[keyC].component.componentRef,
        type:comp[keyC].component.type,
        variables:variables}
      components.push(component);
    }


    var device={id:answer[i].devices.device,components:components}

    devices.push(device);
    for(var peer in answer[i].peersTable){

      var p2p={from:answer[i].devices.device, to:Number(answer[i].peersTable[peer])}
      pairedDevices.push(p2p);
    }

  }

  var response={
    devices:devices,
    components:config.components,
    links:{pairedDevices:pairedDevices,pairedComponents:null,pairedVariables:null}
  }

  if(callback) {
    callback(null,response)
  }
}

var sendAPIRequest = function(deviceList, message, callback) {
  var counter = 0
  var length = deviceList.length
  var answers = []
  for(var i = 0; i < length; i++) {
    var device = getSocketByDeviceId(deviceList[i])
    if(device) {
      message.device = deviceList[i]
      device.emit('liquidRestApi', message, function(err, data){
        counter++
        if(err) {
          callback(err,null);
        }

        answers.push(data)

        if(counter == length) {
          computeCompoundAPIAnswer(answers, callback)
        }

      })
    }
  }
}

/*
 * Starts listening on application.port and specify routes when only user and device is given
 */
var openServerRoutesUD=function(){
  app.get('/api/:user/:device',function(req,res){
    var user  =req.params.user;
    var device=req.params.device;

    var ApiRequest={
      user : user,
      device: device
    }
    var deviceList=[];

    if (device == '*'){
      for(var i in application.devices){
        deviceList.push(i);
      }
    }else{
      deviceList.push(device);
    }

    sendAPIRequest(deviceList,ApiRequest,function(err,data){
      if (err){
        res.send('error');
      }

      if(false) {
        res.render('graph.jade', {
          title: 'Device: ' + device,
          data: data
        })
      } else {
        res.json(data)
      }
    })
  })
}
/*
 * Starts listening on application.port and specify routes
 */
var openServerRoutes = function() {
  app.get('/api/:user/:device/:componentType/:component/:variable', function(req, res) {
    var show = req.query.show
    var user = req.params.user
    var device = req.params.device

    var APIRequest = {
      user: user,
      device: device,
      component: req.params.component,
      componentType: req.params.componentType,
      variable: req.params.variable
    }

    var deviceList = []

    if(device == '*') {
      for(var i in application.devices) {
        deviceList.push(i)
      }
    } else {
      deviceList.push(device)
    }

    sendAPIRequest(deviceList, APIRequest, function(err, data) {
      if(err) {
        res.send('error')
      }
      if(show) {
        res.render('graph.jade', {
          title: 'Device: ' + device,
          data: data
        })
      } else {
        res.json(data)
      }
    })
  })

  // app.get('/', function(req, res){
  //   var show = req.query.show
  //   var device = req.query.device
  //   var component = req.query.component
  //   var resource = req.query.variable

  //   var APIRequest = {
  //     device: device,
  //     component: component,
  //     variable: resource
  //   }

  //   if(device && application.devices[device]) {
  //     var socket = getSocketByDeviceId(device)

  //     socket.emit('liquidRestApi', APIRequest, function(err, data) {
  //       if(err)
  //         res.send('error')

  //       var response = {
  //         devices: data.devices,
  //         components: data.components,
  //         resources: data.resources
  //         /*
  //           devices
  //           components
  //           paired
  //         */
  //       }
  //       if(show)
  //         res.render('graph.jade', {
  //           title: 'Device: ' + device, 
  //           data: response
  //         })
  //       else 
  //         res.json(response)
  //     })
  //   } else {
  //     var length = Object.keys(application.devices).length
  //     var counter = 0
  //     var devices = []
  //     var components = []
  //     var resources = []

  //     for(var i in application.devices) {
  //       var socket = getSocketByDeviceId(i)

  //       APIRequest.device = i

  //       socket.emit('liquidRestApi', APIRequest, function(err, data) {
  //         counter++

  //         if(err)
  //           res.send('error')

  //         for(var i in data.devices) {
  //           devices.push(data.devices[i])
  //         }

  //         for(var i in data.components) {
  //           components.push(data.components[i])
  //         }

  //         for(var i in data.resources) {
  //           resources.push(data.resources[i])
  //         }

  //         if(counter == length) {
  //           var response = {
  //             devices: devices,
  //             components: components,
  //             resources: resources
  //           }

  //           if(show)
  //             res.render('graph.jade', {
  //               title: 'Summary', 
  //               data: response
  //             })
  //           else 
  //             res.json(response)
  //         }
  //       })
  //     }
  //   }
  // })

  app.get('/__globalState', function(req, res){
    res.json(application.state)
  })
}

var openServer = function() {
  publicFolder = path.join(__dirname, '..', 'public')
  applicationFolder = path.join(__dirname, '..', 'public', config.folder)

  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, '..', 'views'))
  app.use(express.static(publicFolder))
  app.use(express.static(applicationFolder))
  initialiseApplication()
  initialiseState()
  openSocketServer()
  openServerRoutes()
  openServerRoutesUD()
}

if(config.stateServer.enable) {
  openServer()
  log('State server started on port ' + config.stateServer.port)
} else {
  log('State server not enabled')
}

module.exports=function(options){
  if(options){
    liquidListener=options
  }
  return{

  }
}