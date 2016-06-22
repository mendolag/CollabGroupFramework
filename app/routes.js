/**
 * Created by josmendola on 08/01/16.
 */
var DBfunc=require("./dbfunc");
var multer=require("multer");
var HFunc=require("./helperFunctions");
var User=require("./models/user");


var storage =   multer.diskStorage({

    destination: function (req, file, callback) {
        //console.log("dest");
        callback(null, './app/AddedComponents');
    },
    filename: function (req, file, callback) {
        //console.log(file);
        //console.log("filename");
        callback(null, file.originalname);
    }
});

var upload = multer({ storage : storage}).single('component');
User.serializeUser();

module.exports=function(app,passport,io){

    // io.on('connection',function(socket){
    //     console.log("user connected");
    // });

    app.get('/socket.io/*',function(req, res){
        res.redirect("127.0.0.1:3000"+ req.url);
    })

    //Home page
    app.get('/', function(req, res){
        res.render('index.ejs');
    });
    //Login form
    app.get('/login', function(req, res){
        //console.log(req.params)
        res.render('login.ejs', {message:req.flash('loginMessage')});
    });

    //Process login form

    app.post('/login', passport.authenticate('local-login',{
        successRedirect:'/profile',
        failureRedirect:'/login',
        failureFlash:true
    }));


    //Signup page
    app.get('/signup', function(req, res){
        res.render('signup.ejs', {message:req.flash('signupMessage')});
    });

    //Process to signup
    app.post('/signup', passport.authenticate('local-signup',{
        successRedirect:'/profile',
        failureRedirect:'/signup',
        failureFlash:true
    }));

    app.get('/profile', HFunc.isLoggedIn, function(req, res){
        //console.log(req.user._id);
        req.session.touch();
        //console.log("SeSSion1:");
        //console.log( req.session)
        DBfunc.getFullUser(req.user._id,function(err,user){
            if(err){
                throw err
            }
            if(user){
                //console.log(user.role);

                res.render('profile.ejs',{
                    user : user,
                    role: user.role.name,
                    message: req.flash('loginMessage')||req.flash('signupMessage')
                });
            }else{
                res.redirect("/");
            }
        });

        //passport.serializeUser(user);
        //DBfunc.getRole(user.role,function(err,r){
        //    if(err){
        //        throw err;
        //    }
        //    res.render('profile.ejs',{
        //        user : req.user,
        //        role: r.name,
        //        message: req.flash('loginMessage')||req.flash('signupMessage')
        //    });
        //})
    });



    app.get('/signupThird', HFunc.isAdmin,function(req,res){
        res.render('signupThird.ejs',{message:req.flash('signupMessage')});
    });

    app.post('/signupThird',function(req,res){
        DBfunc.registerUser(req,res,req.body.username);
    });

    //app.post('/signupThird',passport.authenticate('local-signupThird',{
    //    successRedirect:'/profile',
    //    failureRedirect:'/signupThird',
    //    failureFlash:true
    //})
    //);

    app.get('/logout',function(req, res){
        req.logout();
        res.redirect('/');
    });

    //Administer page rendering
    //app.get('/administrator',isAdmin,function(res,req){
    //    res.render('admin.ejs');
    //});
    app.get('/admin',HFunc.isAdmin,function(req,res){
        req.session.touch();
        passport.serializeUser(req.user._id,function(err,user){
            res.render('admin.ejs',{sucmex:req.flash('succes'),errmex:req.flash('error'),user:user});
        });
        res.render('admin.ejs',{sucmex:req.flash('succes'),errmex:req.flash('error'),user:req.user});
        //DBfunc.getFullUser(req.user._id,function(err,user){
        //    if(err){
        //        throw err;
        //    }else{
        //        passport.deserializeUser(req.user._id,function(err,user){
        //            res.render('admin.ejs',{sucmex:req.flash('succes'),errmex:req.flash('error'),user:user});
        //        });
        //
        //    }

    });










    /*
     Element getters
     */


    app.get('/getUserList',HFunc.isAdmin,function(req,res){
        DBfunc.getAllUser(req,res);
    });


    app.get('/getRoleList',HFunc.isAdmin,function(req,res){
        DBfunc.getAllRole(req,res);
    });

    app.get('/getComponentList',HFunc.isAdmin,function(req,res){
        DBfunc.getAllComponent(req,res);
    });

    app.get('/getGroupList',HFunc.isAdmin,function(req,res){
        DBfunc.getAllGroups(function(err,groups){
            if(err){throw err}
            else{
                res.send(groups);
            }
        });
    });

    app.get('/getUsersInGroup/:id',HFunc.isAdmin,function(req,res){
        console.log("getUSERS");
        var id=req.params.id;
        DBfunc.getGroupUsers(id, function(err,users){
            if(err){
                throw err;
            }else{
                console.log("get");
                console.log(users);
                res.send(users);
            }
        })
    })

    app.get('/getUserNotInGroup/:id',HFunc.isAdmin,function (req,res){

        var id=req.params.id;
        console.log("ID:" +id);
        DBfunc.getAllUserNotInGroup(id,function(err,users){
            if (err){
                throw err;
            }else{
                res.send(users);
            }
        });

    });

    app.get('/getRoleComponents/:id',HFunc.isAdmin,function(req,res){
        var id=req.params.id;
        DBfunc.getFullRole(id,function(err,role){
            if(err){
                throw err;
            }
            if(role){
                var comps=role.components;
                res.send(comps);
            }
        })
    });




    /*
     Element manager
     */

    app.get("/manageuser/:id",HFunc.isAdmin,function(req,res){
        var id=req.params.id;
        console.log("MANAGEUSER");
        DBfunc.getFullUser(id,function(err,user){
            if(err){
                throw err
            }else if(user){
                console.log("USERFOUND");
            }else{
                console.log("USERnotFOUND")
            }

        });

    })

    app.get('/managegroup/:id',HFunc.isAdmin,function(req,res){
        var id=req.params.id;
        DBfunc.getFullGroup(id,function(err,group){
            if(err){
                throw err;
            }else if(group){
                res.render('groupManager.ejs',{group:group})
            }else{
                console.log("Not found")
            }

        })


    })

    app.get("/managerole/:id",HFunc.isAdmin,function(req,res){
        //console.log(req)
        //res.header('Access-Control-Allow-Credentials', true);
        var id=req.params.id;
        //var next=HFunc.isAdmin(req,res);
        //console.log(id);
        DBfunc.getFullRole(id,function(err,role){
            if(role){
                res.render('roleManager.ejs',{role:role});}
            else{
                console.log("ma perche?");
            }
        })
    });


    app.post("/managerole/:id",HFunc.isAdmin,function(req,res){
        //var roleid=req.params.id;
        var componentid=req.body._id;
        var perms={read:req.body.read,write:req.body.write,push:req.body.push,pull:req.body.pull}
        console.log(req.body);
        console.log(componentid)
        DBfunc.updateComponentPerm(componentid,perms);

    });





    /*
     Element removers
     */

    app.get('/remCompFromRole/:roleId/:compId',HFunc.isAdmin,function(req,res){
        var role= req.params.roleId;
        var comp=req.params.compId;
        DBfunc.removeCompFromRole(role,comp,function(err,removed){
            if(err){
                res.redirect("/managerole/"+role);
            }else{
                res.redirect("/managerole/"+role);
            }
        })


    });

    app.get('/remUserFromGroup/:groupId/:userId',HFunc.isAdmin,function(req,res){
        var groupId=req.params.groupId;
        var userId=req.params.userId;
        DBfunc.removeUserFromGroup(groupId,userId,function (err,group) {
            if(err){
                throw err;
            }else{
                res.redirect('/manageGroup/'+groupId);
            }
        })


    })



    /*
     Element Adders
     */

    app.get('/addrole',HFunc.isAdmin,function(req,res){
        res.render('addrole.ejs',{message:req.flash('roleMessage')});
    });

    app.post('/addrole',HFunc.isAdmin,function(req,res){
        DBfunc.addRole(res,req,function(err,saved){
            if (err){
                throw err;
            }else if(saved){
                res.render('admin.ejs',{sucmex:req.flash('success', 'role saved'),errmex:req.flash('error')});
            }else{
                res.redirect('addrole.ejs',{sucmex:req.flash('success'),errmex:req.flash('error', 'role exists')});
            }
        });

    });


    app.get('/addcomponent',HFunc.isAdmin,function(req,res){
        res.render('addComponent.ejs');
    });

    app.get('/addComp2Role/:roleId/:compId',HFunc.isAdmin,function(req,res){
        var roleId=req.params.roleId;
        var compId=req.params.compId;
        DBfunc.addComponentToRole(roleId,compId,function(err,role){
            if(err){
                console.log(err);
                res.redirect("/managerole/"+roleId);
            }else if(role){
                res.redirect("/managerole/"+roleId);
            }else{
                console.log("o");
            }
        })
    })

    app.get('/addComp2Role/:id',HFunc.isAdmin,function(req,res){
        var rid=req.params.id;
        res.render("addCompToRole.ejs",{id:rid});
    })

    app.post('/addcomponent',HFunc.isAdmin,function(req,res) {
        upload(req, res, function (err) {
            if (err) {
                return res.end("Error uploading file.");
            }
            var item = res.req;
            DBfunc.addComponent(item.file.originalname, item.route.path, function (err, saved) {
                if (err) {
                    throw err
                }
                if (saved) {
                    upload(req, res, function (err) {
                        if (err) {
                            DBfunc.deleteComponent();
                            res.redirect("");

                        } else {
                            res.redirect("/admin");
                        }
                    })
                }

            });
        });
    });


    app.get('/addgroup',HFunc.isAdmin,function(req,res){
        res.render('addgroup.ejs',{message:req.flash('groupMessage')});
    });

    app.post('/addgroup',HFunc.isAdmin,function(req,res){
        var groupName=req.body.group;
        DBfunc.addGroup(groupName,function(err,saved){
            if (err){
                throw err;
            }else if (saved){
                console.log('saved');
                res.render('admin.ejs',{sucmex:req.flash('success', 'role saved'),errmex:req.flash('error')})
            }else{
                console.log('not saved');
                res.render('addgroup.ejs',{message:req.flash('failed Goup registration')});
            }
        })
    });

    app.get('/addUserToGroup/:id',HFunc.isAdmin,function (req,res) {
        var gid=req.params.id;
        console.log("ADDUSER");
        console.log(req);
        res.render('addUserToGroup.ejs',{id:gid});
    });

    app.get('/addUser2Group/:gId/:uId',HFunc.isAdmin,function(req,res){
        var gid=req.params.gId;
        var uid=req.params.uId;
        DBfunc.addUserToGroup(gid,uid,function (err,group) {
            if(err){
                throw err;}
            else {
                res.redirect('/managegroup/'+gid);
            }

        })
    });
    
    app.get('/addGroupManager/:gID',HFunc.isAdmin,function(req,res){
        var gID=req.params.gID;
        res.render('addGroupManager',{id:gID});
    })

    app.get('/addGroupManager/:gID/:uID',HFunc.isAdmin,function (req,res) {
        var gID=req.params.gID;
        var uID=req.params.uID;
        DBfunc.addGroupManager(gID,uID,function(err,group){
            if(err){
                res.statusCode=500;
                res.send();
            }else{
                res.redirect('/managegroup/'+gID);
            }

        })

    })
    
    
    
    /*
     * FWConnector API route
     */

    app.put('/registerUserDevice',HFunc.isLoggedIn,function (req,res) {
        var user=req.user;
        var deviceId=req.body.deviceID;
        console.log(req.body);
        DBfunc.updateUserDeviceId(user._id,deviceId,function(err,updated){
            if(err){
                res.statusCode=500;
                res.statusMessage=err;
                res.send();
            }else if(updated){
                res.statusCode=201;
                res.statusMessage="Device id updated";
                res.send();
            }else{
                res.statusCode=500;
                res.statusMessage="Database error";
                res.send();
            }
        });
    });


    app.get('/guest',function(req,res){
        res.render('guest.ejs');
        
    });

    app.put('/registerGuestDevice',function(req,res){
        console.log("registerGuestToGroup");
        var guest=req.body;
        console.log(guest);
        DBfunc.addGuestToGroup(guest.groupID,guest.deviceID,function(err,success){
            if(err){
                res.statusCode=500;
                res.statusMessage=err;
                console.log(err);
                res.send();
            }else if(success){
                res.statusCode=201;
                console.log(success);
                res.statusMessage="Guest registered to group"
                res.send();
            }else{
                res.statusCode=500;
                res.statusMessage="Unkown error";
                console.log(err);
            }
        })

    })







};


