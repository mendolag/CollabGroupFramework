/**
 * Created by josmendola on 21/06/16.
 */
var dbFunc=require('./dbfunc');


var updateGroupManager=function(groupID){
    
}

var funcOnConnect = function(deviceId,data) {
    console.log("ciao");
    console.log(data);
    //dbFunc.getGroupsOfDevice(deviceId,function(err,groups){})
    dbFunc.findGroupsOfUser(deviceId,function(err,groups){
        if(err){
            console.log(err);
            //callback(err,null);
        }else{
            console.log(groups);
            //callback(null,)
        }
    })
}
var funcOnDisconnect = function(deviceId) {

}
var liquid   = {
    deployment: require('../liquid/lib/deploymentServer.js'),
    state: require('../liquid/lib/stateServer.js')({
        onConnect: funcOnConnect,
        onDisconnect: funcOnDisconnect
    }),
    signaling: require('../liquid/lib/signalingServer.js')
}