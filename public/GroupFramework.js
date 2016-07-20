/**
 * Created by josmendola on 06/05/16.
 */



var GFramework=(function () {
    var __groupDetails={};
    var __qrCode=undefined;
    var __groupManager=undefined;
    var __roles=undefined;
    var __user=undefined;




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
        console.log(__groupDetails);
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
        // 'requestMove':_requestActionMove,
        'requestCloneAll':_requestActionClone,
        'resUser':_resUser,
        'resRoles':_resRoles,

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
        getGroupManager:_getGroupManager,
        getGroupID:_getGroupID,
        getQrCode:_getQrCode,
        incomingMessages:_incomingMessages,
        privileges:_privileges
        // registerUserDeviceID:_registerUserDeviceID,
        // registerGuestDeviceID:_registerGuestDeviceID
    }
})();