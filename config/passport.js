/**
 * Created by josmendola on 09/01/16.
 */

var LocalStrategy =require('passport-local').Strategy;
var mongoose = require('mongoose');
var User =require('../app/models/user');
var Role =require('../app/models/role');
var DBFunc=require('../app/dbfunc');
module.exports=function(passport){
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done){
        User.findById(id, function(err,user){
            //user.sessionID=undefined;
            //user.save();
            done(err, user);
        });
    });

    //passport.serializeUser(User.serializeUser());
    //passport.deserializeUser(User.deserializeUser());

    //Local login

    passport.use('local-login',new LocalStrategy({
        usernameField:'email',
        passwordField:'password',
        passReqToCallback:true
    },
    function(req, email, password, done){
        User.findOne({'email':email},function(err, user){
            if(err) {
                return done(err);
            }
            if(!user){
                return done(null, false, req.flash('loginMessage', 'No user found'));
            }
            if(!user.validPassword(password)){
                return done(null, false, req.flash('loginMessage','Wrong password'));
            }



            //user.sessionID=req.sessionID;
            //user.save();
            //return done(null, user);

            req.login(user, function(err){
                if(err) {return done(err)}
                return  done(null, user);
            })

        });
    }
    ));

    //Function to signup
    passport.use('local-signup', new LocalStrategy({
        usernameField:'email',
        passwordField:'password',
        passReqToCallback:true
    },
    function(req, email, password, done){
        process.nextTick(function(){

            User.findOne({'email':email}, function(err, user){
                if(err){
                    return done(err);
                }
                if(req.body.password2!=password){
                    console.log('e-mail do not match');
                    return done(null, false, req.flash('signupMessage', 'E-mail do not match '));
                }
                //check if user has email
                if(user){
                    console.log('e-mail taken');
                    return done(null, false, req.flash('signupMessage','That email is already taken.'));
                }else {
                    //create new user
                    var newUser = new User();
                    newUser.email=email;
                    newUser.password=newUser.generateHash(password);

                    //User.populate("role","name -_id").find({'name':"admin"}).lean().exec(function (err,user) {
                    //    if(user){
                    //        console.log("admin Found: "+user);
                    //    }else{
                    //        console.log("admin not Found: ");
                    //    }
                    //})

                    //User.find().populate('role').exec(function(err, users){
                    //    var admins = users.map(function(user){
                    //        if(user.role.name = "admin"){
                    //            return user
                    //        }
                    //    })
                    //
                    //    console.log(admins.length)
                    //})

                    DBFunc.getRoleId("admin",function(err,adminRoleId){
                        if(err){throw err;}
                        if(adminRoleId){
                            DBFunc.getAdminById(adminRoleId,function(err,admin){
                                if (err){throw err}
                                if(admin){
                                    console.log("saving guest");
                                    DBFunc.getRoleId("guest",function(err,guestRoleId){
                                        newUser.role=guestRoleId;
                                        newUser.save(function(err){
                                            if(err){
                                                throw err;
                                            }
                                            return done(null, newUser, req.flash('signupMessage', 'Registration successful'))});
                                    });
                                }else{
                                    console.log("saving admin");
                                    newUser.role=adminRoleId;
                                    newUser.save(function(err){
                                        if(err){
                                            throw err;
                                        }
                                        newUser.populate('role');
                                        return done(null, newUser)});

                                }
                            })
                        }

                    })

                //});
                    // save the user

                }
            });
        });
    }));
};