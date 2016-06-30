/**
 * Created by josmendola on 21/06/16.
 */
var dbFunc=require('./dbfunc');


var updateGroupManager=function(groupID){
    
}

var funcOnConnect = function(deviceId,data,callback) {
    // console.log(data);
    dbFunc.getGroupsOfDeviceID(deviceId,function(err,groups){
        if(err){
            callback(err,null);
        }else if(groups!=null){
            callback(null,structureGroupsInfo(groups));
        }else{
            callback(null,null);
        }
    })
}



var structureGroupsInfo=function(groups){
    var gInfo=[]
    for(var i=0;i<groups.length;i++ ){
        var group=groups[i]
        gInfo.push({
            id:group._id,
            name:group.name,
            manager:group.groupManager.deviceID,
            devices:getDeviceID(group),
        })

    }
    return gInfo;
}

var getDeviceID=function(group){
    var devices={}
    if(group.groupManager!=null){
    devices[group.groupManager.deviceID]=group.groupManager.deviceID}
    var users=group.users;
    var guests=group.guests;
    for(var i=0;i<users.length;i++ ){
        var user=users[i];
        console.log(user.deviceID);
        if(users.deviceID!=null){
        devices[user.deviceID]=user.deviceID;}
    }
    for(var i=0;i<guests.length;i++ ){
        var guest=guests[i];
        if(guest!=null){
        devices[guest]=guests;}
    }
    return devices
}
var funcOnDisconnect = function(deviceId) {
    dbFunc.clearDeviceID(deviceId);
}
var liquid   = {
    deployment: require('../liquid/lib/deploymentServer.js'),
    state: require('../liquid/lib/stateServer.js')
    ({
        onConnect: funcOnConnect,
        onDisconnect: funcOnDisconnect
    }),
    signaling: require('../liquid/lib/signalingServer.js')
}