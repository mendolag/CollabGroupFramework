/**
 * Created by josmendola on 13/01/16.
 */
var User =require('./models/user');
var Role=require('./models/role');
var Component=require('./models/components');
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

exports.registerUser=function(req,res,email){
    var password=req.body.password;
    if(req.body.password2!=password){
        res.render('signupThird.ejs', {
            message: req.flash('signupMessage','password Missmatch')
        });//req.flash('signupMessage', 'E-mail do not match ');
        console.log('password Missmatch');
    }
    else {
        User.findOne({'email': email}, function (err, user) {
            //check if user has email
            if (user) {
                res.render('signupThird.ejs', req.flash('signupMessage', 'email already registered')
                );
                console.log("email already registered");
            } else {
                console.log("registration");
                //create new user
                var newUser = new User();

                //set the user's credentials
                newUser.email = email;
                newUser.password = newUser.generateHash(password);
                newUser.
                    role = req.body.role;
                // save the user
                newUser.save(function (err) {
                    if (err) {
                        throw err;
                        console.log(err);
                    }
                    res.render('profile.ejs', {
                        user : req.user})
                    req.flash('signupMessage', "registration Complete");
                    console.log("registration Complete");
                });
            }
        });
    }
}

exports.getUserBySess=function(sid,callback){
    User.findOne({sessionID:sid}).populate({path:'role'}).exec(function(err,user){
        if(err){
            callback(err,null);
        }if(user){
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

exports.addRole=function(res,req,callback){
    var reqRole=req.body.role;
    Role.findOne({'name':reqRole},function(err, role){
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

exports.addComponentToRole=function(RoleId,CompId,callback){
    Role.findById(RoleId,function(err,role){
        if(err){
            callback(err,null);
        }if(role){
            var found=false;
            for(var i=0; i<role.components.length ;i++){
                if(role.components[i]==CompId){
                    found=true;
                }
            }
            if(found){
                err="found"
                callback(err,null);
            }else{
                Role.update({_id: RoleId},{$pushAll: {components:[{component:CompId,perms:"0000"}]}},{upsert:true},function(err,role){
                    if(err){

                        callback(err,null);
                    }else{

                        callback(null,role);
                    }
                });
                
            }

        }
    })

};

//exports.addComponentToRole=function(RoleId,CompId,callback){
//    Role.update({_id: RoleId},{$pushAll: {components:CompId}},{upsert:true},function(err,role){
//        if(err){
//            callback(err,null);
//        }else{
//            callback(null,role);
//        }
//}




exports.getRoleId=function(roleName,callback){
    Role.findOne({'name':roleName},function(err,role){
        if(err){
            callback(err,null);
        } else{
            callback(null,role._id);
        }
    });
};

exports.getFullRole=function(roleID,callback){
    Role.findById(roleID).populate({path:'components'}).exec(function(err,role){
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


