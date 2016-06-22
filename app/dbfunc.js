/**
 * Created by josmendola on 13/01/16.
 */
var User =require('./models/user');
var Role=require('./models/role');
var Component=require('./models/components');
var Group=require('./models/group')
var mongoose=require('mongoose');
var ObjectId = mongoose.Types.ObjectId;


exports.init=function(req,res) {

    Role.findOne({'name': "admin"}, function (err, role) {
        //check if user has email
        if (role) {
            console.log("role admin found");
        } else {
            console.log("init admin role");
            var role = new Role();
            role.name = "admin";
            role.save(function (err) {
                if (err) {
                    throw err;
                    console.log(err);
                }
                console.log("init admin Complete");
            });
        }
    });
    Role.findOne({'name': "guest"}, function (err, role) {
        //check if user has email
        if (role) {
            console.log("role guest found");
        } else {
            console.log("init admin role");
            var role = new Role();
            role.name = "guest";
            role.save(function (err) {
                if (err) {
                    throw err;
                    console.log(err);
                }
                console.log("init guest Complete");
            });
        }
    });
};
//--------------------------------------------
//USER MANAGEMENT
//--------------------------------------------
exports.getAllUser=function(req,res){
    User.find({}, function (error, user) {
        if(error){
            console.log(error);
        } else {
            //correct json object
            res.send(user);
        }
    });
}


exports.getFullUser=function(id,callback){
    User.findOne({_id:id}).populate({path:'role'}).exec(function(err,user){
        if(err){
            callback(err,null);
        }else if(user){
            callback(null,user);
        }else{
            callback(null,null);
        }
    })
}

exports.registerUser=function(req,res,username){
    var password=req.body.password;
    var self=this;
    if(req.body.password2!=password){
        res.render('signupThird.ejs', {
            message: req.flash('signupMessage','password Missmatch')
        });//req.flash('signupMessage', 'E-mail do not match ');
        console.log('password Missmatch');
    }
    else {
        User.findOne({'username': username}, function (err, user) {
            //check if user has email
            if (user) {
                res.render('signupThird.ejs', req.flash('signupMessage', 'username already registered')
                );
                console.log("username already registered");
            } else {
                console.log("registration");
                //create new user
                var newUser = new User();
                newUser.username = username;
                newUser.password = newUser.generateHash(password);
                //set the user's credentials
                var role="guest"
                if(req.body.role!=undefined){
                    role=req.body.role;
                }
                self.getRoleId(role,function(err,roleId) {
                    newUser.role = roleId;
                    // save the user
                    newUser.save(function (err) {
                        if (err) {
                            throw err;
                            console.log(err);
                        }
                        self.getRole(req.user.role,function (err,role) {
                            res.render('profile.ejs', {
                                user: req.user,role:role.name,message:"registration Complete"
                            })
                        })

                        //req.flash('message', "registration Complete");
                        console.log("registration Complete");
                    });
                });
            }
        });
    }
}



exports.updateUserDeviceId=function(userID,deviceID,callback){
    User.findByIdAndUpdate(userID,{$set:{deviceID:deviceID}},{upsert:true},function(err,user){
        if(err){
            console.log(err);
            callback(err,null);
        }else{
            callback(null,user);
        }
    })
}




var deviceInArray=function(groupID,deviceID,callback){
    Group.findById(groupID,function(err,group){
        if(err){
            callback(err,null);
        }else if(group){
            var guests=group.guests;
            if(guests.indexOf(deviceID) != -1){
                callback(null,true);
            }else{
                callback(null,false);
            }
        }else{
            callback("No group with this ID",null);
        }
    })
};

exports.addGuestToGroup=function(groupID,deviceID,callback){
    deviceInArray(groupID,deviceID,function(err, contains){
        if(err){
            callback(err,null);
        }else if(contains){
            callback(null,"device already registered");
        }else{
            Group.findByIdAndUpdate(groupID,{$push:{guests:deviceID}},{upsert:true},function(err,group){
                if(err){
                    callback(err,null);
                }else if(group){
                    callback(null,group);
                }else{
                    callback("Guest not registered to group",null);
                }
            });
        }
    })

}

exports.getUserBySess=function(sid,callback){
    User.findOne({sessionID:sid}).populate({path:'role'}).exec(function(err,user){
        if(err){
            callback(err,null);
        }else if(user){
            callback(err,user);
        }else{
            callback(null,null);
        }
    })
}

exports.addSession=function(user,sid){
    User.findOne({name:user},function(err,user){
        user.sessionId=sid;
        user.save();
    })
}


exports.removeSession=function(sid){
    User.findOne({sessionId:sid}, function (err,user) {
        user.sessionId=undefined;
        user.save();
    })
}

//--------------------------------------------
//ROLE MANAGEMENT
//--------------------------------------------



exports.getAllRole=function(req,res){
    Role.find({}, function (error, role) {
        if(error){
            console.log(error);
        } else {
            //correct json object
            res.send(role);
        }
    });
}


//to be developed
exports.updateComponentPerm=function( compId,perms){

    console.log(compId)
    console.log(perms)
    Role.update({'components._id':compId},{$set:{'components.$.read':perms.read, 'components.$.write':perms.write, 'components.$.push':perms.push,'components.$.pull':perms.pull}},function(err,role){
        if(err){
            console.log(err);
        }else if (role){
            console.log(role);
        }


    });
}


/*
 function for adding a new role in the db
 */
exports.addRole=function(res,req,callback){
    var reqRole=req.body.role;
    Role.update({'name':reqRole},function(err, role){
        if(err){
            callback(err,null);
        }
        if (role){
            callback(null,false);
        }
        else{
            var newRole= new Role();
            newRole.name=reqRole;
            newRole.components=[];
            newRole.save(function(err){
                if(err){
                    callback(err,null);
                }else{
                    callback(null,true);
                }
            });
        }
    })
};

/*
 removeCompFromRole(RoleId,CompId,callback)

 */

exports.removeCompFromRole=function(RoleId,CompId,callback){
    Role.update({_id:RoleId},{ $pull:  { components: {_id:CompId} }},{upsert:true},function(err,role){
        if(err){
            console.log(err)
            callback(err,false);
        }else{
            callback(null,true);
        }
    })
}

//exports.addComponentToRole=function(RoleId,CompId,callback){
//    Role.findById(RoleId,function(err,role){
//        if(err){
//            callback(err,null);
//        }if(role){
//            var found=false;
//            for(var i=0; i<role.components.length ;i++){
//                if(role.components[i]==CompId){
//                    found=true;
//                }
//            }
//            if(found){
//                err="found"
//                callback(err,null);
//            }else{
//                Role.update({_id: RoleId},{$pushAll: {components:[{component:CompId,perms:"0000"}]}},{upsert:true},function(err,role){
//                    if(err){
//
//                        callback(err,null);
//                    }else{
//
//                        callback(null,role);
//                    }
//                });
//
//            }
//
//        }
//    })
//
//};

exports.addComponentToRole=function(RoleId,CompId,callback){
    Role.update({_id: RoleId},{$pushAll: {components:[{component:CompId,read:false,write:false,push:false,pull:false}]}},{upsert:true},function(err,role){
        if(err){
            callback(err,null);
        }else{
            console.log(role);
            callback(null,role);
        }
    })
}




exports.getRoleId=function(roleName,callback){
    Role.findOne({'name':roleName},function(err,role){
        if(err){
            callback(err,null);
        } else if(role){
            callback(null,role._id);
        }else{callback(null,null)}
    });
};

var getRoleOrGuest =function(roleName,callback){
    this.getRoleId(roleName,function(err,roleID){
        if(err||(roleID==null)){
            this.getRoleId("guest",function(err,guestID){
                if(err){
                    callback(err,null);
                }else{
                    callback(null,guestID);
                }
            })
        }else{
            callback(null,roleID);
        }
    })
}

exports.getFullRole=function(roleID,callback){

    Role.findById(roleID).populate({path:'components.component'}).exec(function(err,role){
        if(err){
            callback(err,null);
        }else{
            callback(null,role);
        }
    });
}





exports.getRole=function(roleID,callback){
    Role.findById(roleID,function(err,role){
        if(err){
            callback(err,null);
        }else{
            callback(null,role);
        }
    });
};



exports.getAdminById=function(id,callback){
    User.findOne({'role': new ObjectId(id)},function(err,user){
        if(err){
            callback(err,null);
        }else{
            callback(null,user);
        }
    });

}

//--------------------------------------------
//COMPONENT MANAGEMENT
//--------------------------------------------

exports.addComponent=function(name,path,callback){
    Component.findOne({name:name},function(err,comp){
        if (err){
            callback(err,null);
        }else if(comp){
            callback(err,false);
        }else{
            var c=new Component();
            c.name=name;
            c.path=path;
            c.save(function(err){
                if(err){
                    callback(err,null);
                }else{
                    callback(err,true);
                }
            });
        }
    });

};


exports.deleteComponent=function(searchBy,searchTerm){
    Component.findOne({searchBy:searchTerm}).remove().exec();
}

exports.getAllComponent=function(req,res){
    Component.find({}, function (error, comp) {
        if(error){
            console.log(error);
        } else {
            //correct json object
            res.send(comp);
        }
    });
}

//componentPerms

var getFullCompPerms = function (id,callback) {
    permComponent.findOne({_id:id}).populate({path:component}).execute(function(err,obj){
        if(err){
            callback(err,null);
        }if(obj){
            callback(null,obj);
        }else{
            console.log("no object found");
            callback(null,null);
        }
    })
}

//---------------------------------------------------------------
//Group managment
//---------------------------------------------------------------
exports.addGroup= function (name,callback){
    Group.findOne({'name':name},function(err, group){
        if(err){
            callback(err,null);
        }
        if (group){
            callback(null,false);
        }
        else{
            var newGroup= new Group();
            newGroup.name=name;
            newGroup.users=[];
            newGroup.save(function(err){
                if(err){
                    callback(err,null);
                }else{
                    callback(null,true);
                }
            });
        }
    })
}

exports.addGroupManager=function(groupID,userID,callback){
    Group.findByIdAndUpdate(groupID,{groupManager:new ObjectId(userID)},function(err,group){
        if(err){
            callback(err,null);
        }else{
            callback(null,group);
        }
    })
}



exports.addUserToGroup=function(groupID,userID,callback){

    Group.update({'_id':groupID},{$pushAll:{users:[{_id:new ObjectId(userID)}]}},function(err,group){
        if (err){
            callback(err,null);
        }else{
            callback(null,group);
        }
    })
};


exports.removeUserFromGroup=function(groupID,userID,callback){
    Group.update({'_id':groupID},{ $pull:  { 'users': userID }},{upsert:true},function(err,group){
        if(err){
            callback(err,null);
        }else{
            console.log("REMOVE USER FROM GROUP");
            console.log(group.name);
            callback(null,group);

        }
    });
}

exports.getGroup=function(gname,callback){
    Group.findOne({'name':gname},function(err,group){
        if(err){
            callback(err,null);
        }else{
            callback(null,group);
        }
    })
}



exports.getFullGroup=function(groupID,callback){
    Group.findById(groupID).populate({path:'users'}).exec(function(err,group){
        if(err){
            callback(err,null);
        }else{
            callback(null,group);
        }
    });
}

exports.getGroupUsers=function(groupID,callback){
    this.getFullGroup(groupID,function(err,group){
        if(err){
            callback(err,null);
        }else{
            callback(null,group.users);
        }
    })
}

exports.getAllUserNotInGroup=function(groupID,callback){
    Group.findById(groupID,function(err,group){
        if (err){callback(err,null)}
        else if(group){
        User.find({_id:{$nin:group.users}},function(err,users){
            if (err){
                callback(err,null);
            }else{
                callback(null,users);
            }
        })
        }
    })
}


exports.getAllGroups= function(callback) {
    Group.find({},function(err,groups){
        if(err){
            callback(err,null);
        }else{
            callback(null,groups);
        }
    })
};

exports.getGroupOfUser=function(id,callback){
    Group.find({'users':id},function(err, groups){
        if (err){callback(err,null)}
        else{callback(null,groups)}
    })
};



exports.findGroupsOfUser=function(deviceID,callback){
    console.log("pipim")
    Group.find().populate({path:'groupManager'}).populate({path:'users'}).exec(function(err,group){
        if(err){
            console.log(err);
        }else{
            console.log(group);
        }
    })
}


var getUserByDeviceID=function(deviceID,callback){
    User.findOne({deviceID:deviceID},function(err,user){
        if(err){
            callback(err,null);
        }else if(user){
            callback(null,user);
        }else{
            callback(null,null);
        }
    })
};

var findGroupOfGuest=function(deviceID,callback){
    Group.find({guests:deviceID},function(err,groups){
        if(err){
            callback(err,null);
        }else if(groups.length>0){
            callback(null,groups);
        }else{
            callback(null,null);
        }
    });
};

exports.getGroupsOfDeviceID=function(deviceID,callback){
    getUserByDeviceID(deviceID,function(err,user){
        if(err){
            callback(err,null);
        }else if(user){
            this.getGroupOfUser(user._id,function(err,groups){
                if(err){
                    callback(err,null);
                }else if(group.length>0){
                    callback(null,groups);
                }
            });
        }else{
            findGroupOfGuest(deviceID,function(err,groups){
                if(err){
                    callback(err,null);
                }else {
                    callback(null,groups);
                }
            })
        }
    })
}

