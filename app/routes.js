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

    io.on('connection',function(socket){
        console.log("user connected");
    });

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
        DBfunc.registerUser(req,res,req.body.email);
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

    //Administar page rendering
    //app.get('/administrator',isAdmin,function(res,req){
    //    res.render('admin.ejs');
    //});
    app.get('/admin',HFunc.isAdmin,function(req,res){
        console.log(req.user);
        req.session.touch();
        console.log("SeSSion2:");
        console.log( req.session)
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

        })


    app.get('/getUserList',function(req,res){
        DBfunc.getAllUser(req,res);
    });


    app.get('/getRoleList',function(req,res){
        DBfunc.getAllRole(req,res);
    });

    app.get('/getComponentList',function(req,res){
        DBfunc.getAllComponent(req,res);
    });

    app.get("/manageuser/:id",function(req,res){
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



    app.get('/getRoleComponents/:id',function(req,res){
        var id=req.params.id;
        DBfunc.getFullRole(id,function(err,role){
            if(err){
                throw err;
            }
            if(role){
                var comps=role.components;
                console.log(comps);
                res.send(comps);
            }
        })
    });

    app.get('/addcomponent',function(req,res){
        res.render('addComponent.ejs');
    });

    app.get('/addrole',HFunc.isAdmin,function(req,res){
        res.render('addrole.ejs',{message:req.flash('roleMessage')});
    });

    app.post('/addrole',function(req,res){
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

    app.get('/remCompFromRole/:roleId/:compId',function(req,res){
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

    app.get('/addComp2Role/:roleId/:compId',function(req,res){
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



    app.get('/addComp2Role/:id',function(req,res){
        var rid=req.params.id;
        res.render("addCompToRole.ejs",{id:rid});
    })


    app.post('/addcomponent',function(req,res) {
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
                ;

            });
        });
    });

};
