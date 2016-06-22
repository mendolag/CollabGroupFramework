/**
 * Created by josmendola on 06/05/16.
 */

var FWConnector=(function () {


    var fwServer={
        host:'http://localhost',
        port:8080
    };

    var _init=function () {

    };

    var _setDeviceId=function (deviceId,callback) {

    };

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

        // req.onreadystatechange=function(){
        //     if(req.readyState==4){
        //         if(req.status==200){
        //             callback(null,true);
        //         }
        //     } else {
        //         callback(req.errmex,null);
        //     }
        // }
    }


    var _registerUserDeviceID=function(){
        console.log(this);
        var deviceId={deviceID:Liquid.getDeviceId()};
        console.log(deviceId);
        _ajaxRequest("/registerUserDevice","PUT",deviceId,function(err,res){
            if(err){
                console.log(err);
            }else{
                console.log(res);
            }
        })
    };


    var _registerGuestDeviceID=function(){
        var groupId=window.location.search.substring(1);
        console.log(groupId);
        var guestData={
            groupID:window.location.search.substring(1),
            deviceID:Liquid.getDeviceId()}
        _ajaxRequest("/registerGuestDevice","PUT",guestData,function(err,res){
            if(err){
                console.log(err);
            }else{
                console.log(res);
            }
        });
    };

    return{
        registerUserDeviceID:_registerUserDeviceID,
        registerGuestDeviceID:_registerGuestDeviceID
    }
})();