/**
 * Created by josmendola on 06/05/16.
 */



var GFramework=(function () {
    var __groupDetails={};
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
        __groupDetails=data.group;
        __groups[data.group._id]=data.group
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
    var _hasPermissions=function(device){
        //TODO: add permissions handler
        return true
    }

    var _requestActionFork=function(data){
        console.log('fork request (GroupFramework)');
        console.log(data)
        if(checkLiquid()){
            var deviceList=Liquid.getDevicesList();
            if(_hasPermissions(data.from.device)){
                for (var id in deviceList){
                    if(id!=data.from.device){
                        console.log('id to be forked '+id);
                        data.to.device=id
                        data.operation="fork"
                        Liquid.forkComponent(data.from,data.to,data)
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
            if(_hasPermissions(data.from.device)){
                for (var id in deviceList){
                    if(id!=data.from.device){
                        console.log('id to be forked '+id);
                        data.to.device=id
                        data.operation="clone"
                        Liquid.cloneComponent(data.from,data.to,data)
                    }
                }
            }

        }
        else{
            console.log('Liquid not loaded')
        }
    };

    var _requestGroupDevices=function(data){
        console.log("_requestGroupDevices")
        var devices=data.devices;
        var devicesInfo=data.devicesInfo;
        __groups[data.groupID]={name:data.name,groupID:data.groupID,manager:data.manager,devices:devices,devicesInfo:devicesInfo}
        Liquid.runEvent('pairedDevicesListUpdate',  [devices, devicesInfo]);
    }

    var _checkPrivileges=function(roleID,action){
        console.log("_checkPrivileges")
        for(var role in __roles){
            console.log("role")
            if(__roles[role]._id==roleID) {
                for (var comp in components) {
                    if (components[comp].name = action) {
                        switch (action) {
                            case 'fork':
                                return components[comp].push;
                                break;
                            case 'create':
                                return components[comp].pull;
                                break;
                        }

                    }
                }
            }
        }
    }

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

    return{
        getGroups:_getGroups,
        getGroupManager:_getGroupManager,
        getGroupID:_getGroupID,
        getQrCode:_getQrCode,
        incomingMessages:_incomingMessages,
        privileges:_privileges,
        getGroup:_getGroup,
        getGroupDevices:_getGroupDevices,
        getGroupDevicesInfo:_getGroupDevicesInfo
        // registerUserDeviceID:_registerUserDeviceID,
        // registerGuestDeviceID:_registerGuestDeviceID
    }
})();