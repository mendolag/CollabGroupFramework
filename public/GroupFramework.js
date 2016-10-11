/**
 * Created by josmendola on 06/05/16.
 */



var GFramework=(function () {
    var __groupsDetails={};
    var __qrCode=undefined;
    var __groupManager=undefined;
    var __roles={};
    var __user={};
    var __groups={}




    var checkLiquid=function(){
        isLiquid=(Liquid!=undefined)

        return isLiquid
    }

    var _resUser=function(data){
        console.log('res user')
        __user=data.user;
        console.log(__user)
    }

    var _resRoles=function(data){
        __roles=data.roles;
    }

    var _resGroupDetails=function(data){

        console.log("groupDetails")
        __groupsDetails[data.group._id]=data.group;

        console.log(data);
        __qrCode=data.qr;
    };
    var _resGroupManager=function(data){
        __groupManager=data.groupManager;
        Liquid.runEvent('groupManagerUpdate', [__groupManager]);
    };

    var _getUser=function(){
        return __user;
    }

    var _getRoles=function(){
        return __roles;
    }
    var _hasPermissions=function(device,groupID,compName,action){
        console.log(device)

        var groupGuests =__groupsDetails[groupID].guests
        var groupUsers=__groupsDetails[groupID].users

        for(var i=0;i<groupUsers.length; i++){

            if(groupUsers[i].deviceID===device){
                console.log("device Found")
                for(var j=0;j<__roles.length;j++){
                    if(__roles[j]._id==groupUsers[i].role){
                        console.log("role Found")
                        console.log(__roles[j])
                        var components=__roles[j].components;
                        for(var k=0;k<components.length;k++){
                            if(components[k].name==compName){
                                if(action){
                                    console.log('request Granted')
                                return components[k][action]}
                                else{
                                    console.log("can receive")
                                    return true
                                }
                            }
                        }
                    }
                }
            }
        }
        //TODO: add permissions handler
        if(!action){
        for(var i=0;i<groupGuests.length; i++){
            if(groupGuests[i]==device){
                console.log("broadcast to guest")
                return true
            }
        }}
        console.log('can not broadcast')
        return false
    }

    var _requestActionFork=function(data){
        console.log('fork request (GroupFramework)');
        console.log(data)
        if(checkLiquid()){
            var deviceList=Liquid.getDevicesList();
            if(_hasPermissions(data.from.device,data.groupID,data.from.type,'push')){
                for (var id in deviceList){
                    if(id!=data.from.device){
                        console.log('id to be forked '+id);
                        data.to.device=id
                        data.operation="fork"
                        if((Liquid.getDeviceId()==id)||(_hasPermissions(id,data.groupID,data.from.type))){
                        Liquid.forkComponent(data.from,data.to,data)}
                    }
                }
            }

        }
        else{
            console.log('Liquid not loaded')
        }
    };

    var _requestActionClone=function(data){
        console.log('clone request (GroupFramework)');
        console.log(data)
        if(checkLiquid()){
            var deviceList=Liquid.getDevicesList();
            if(_hasPermissions(data.from.device,data.groupID,data.from.type,'push')){
                for (var id in deviceList){
                    if(id!=data.from.device){
                        console.log('id to be forked '+id);
                        data.to.device=id
                        data.operation="clone"
                        if((Liquid.getDeviceId()==id)||(_hasPermissions(id,data.groupID,data.from.type))){
                        Liquid.cloneComponent(data.from,data.to,data)}
                    }
                }
            }

        }
        else{
            console.log('Liquid not loaded')
        }
    };
    
    var _activateDevice=function () {
        var deviceId=Liquid.getDeviceId()
        var user=_getUser()
        Liquid.customServerMessage('activateDevice',{user:user,deviceID:deviceId})
        console.log("GFsendMex")
    }

    _updateActiveDevice=function(data){
        console.log('updateDevice')
        console.log(data)
        Liquid.runEvent('activateDevice',[data])
    }

    var _requestGroupDevices=function(data){
        console.log("_requestGroupDevices")
        console.log(data)
        var devices=data.devices;
        var devicesInfo=data.devicesInfo;
        __groups[data.groupID]={name:data.name,groupID:data.groupID,manager:data.groupManager,devices:devices,devicesInfo:devicesInfo}
        Liquid.runEvent('pairedDevicesListUpdate',  [devices, devicesInfo]);
    }

    // var _checkPrivileges=function(roleID,action){
    //     console.log("_checkPrivileges")
    //     for(var role in __roles){
    //         if(__roles[role]._id==roleID) {
    //             for (var comp in components) {
    //                 if (components[comp].name = action) {
    //                     switch (action) {
    //                         case 'fork':
    //                             return components[comp].push;
    //                             break;
    //                         case 'create':
    //                             return components[comp].pull;
    //                             break;
    //                         case 'clone':
    //                             return components[comp].push;
    //                             break;
    //                         case 'migrate':
    //                             return components[comp].push;
    //                             break;
    //                     }
    //
    //                 }
    //             }
    //         }
    //     }
    // }

    var __privileges={
        'user':_getUser,
        'roles':_getRoles,
    }

    var __incomingMessages={
        'groupDetails':_resGroupDetails,
        'groupManager':_resGroupManager,
        'requestForkAll':_requestActionFork,
        'groupDevices':_requestGroupDevices,
        // 'requestMove':_requestActionMove,
        'requestCloneAll':_requestActionClone,
        'resUser':_resUser,
        'resRoles':_resRoles,
        'updateActiveDevice':_updateActiveDevice

    }

    var _getGroups=function(){
        console.log(__groups)
        return __groups
    }

    var _getGroup=function(groupID){
        console.log(groupID)
        console.log(__groups)
        return __groups[groupID]
    }
    
    var _getGroupDevices=function(groupID){
        var group=_getGroup(groupID)
        console.log(group)
        return group.devices
    }

    var _getGroupDevicesInfo=function(roleID){
        var group=_getGroup(roleID)
        return group.devicesInfo
    }



    var _ajaxRequest=function(url, method,data,callback){
        var req=new XMLHttpRequest();
        req.open(method,url,true);
        req.setRequestHeader('Content-Type', 'application/json');
        if(data){
            console.log("send data");
            console.log(data)
            req.send(JSON.stringify(
                data
            ));
        }
        else{
            req.send();
        }
    }



    var _getGroupID=function(){
        console.log(window.location);
        return window.location.search.substring(1);

    };
    var _getQrCode=function(){
        return __qrCode;
    }

    var _getGroupManager=function(){
        return __groupManager;
    }

    var _incomingMessages=function () {
        return __incomingMessages
    }
    var _privileges=function(){
        return __privileges
    }
    var _getUser=function(){
        return __user;
    }

    return{
        getUser:_getUser,
        getGroups:_getGroups,
        getGroupManager:_getGroupManager,
        getGroupID:_getGroupID,
        getQrCode:_getQrCode,
        incomingMessages:_incomingMessages,
        privileges:_privileges,
        getGroup:_getGroup,
        getGroupDevices:_getGroupDevices,
        getGroupDevicesInfo:_getGroupDevicesInfo,
        activateDevice:_activateDevice
        // registerUserDeviceID:_registerUserDeviceID,
        // registerGuestDeviceID:_registerGuestDeviceID
    }
})();