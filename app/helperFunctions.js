/**
 * Created by josmendola on 09/02/16.
 */
var DBfunc=require("./dbfunc");
exports.isAdmin=function (req, res, next){
    console.log(req.user);
    if(req.user) {
        console.log("auth");
        DBfunc.getRoleId("admin", function (err, roleId) {

            if (req.user.role.equals(roleId)) {
                console.log("admin logged in");
                return next();
            }

        });
    }else {
        DBfunc.getUserBySess(req.sessionID, function (err, user) {
            console.log("session ID" + req.sessionID);
            console.log("user session ID" + user);
            if(user){
            if(user.role.name.equals("admin")){
                console.log("admin");
                return next()
            }else{
                console.log("not admin auth");
                res.redirect('/');
            }

            }
            else{
                console.log("no user found for auth");
                res.redirect('/');
            }
        });
    }


}

exports.isLoggedIn=function (req, res, next){
    console.log(req.user)
    if (req.user){
        return next();
    }
    console.log("not logged in");
    res.redirect('/');
}

