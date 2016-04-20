/**
 * Created by josmendola on 09/01/16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema,
    objectId=Schema.ObjectId,
    passportLocalMongoose = require('passport-local-mongoose');

var bcrypt = require('bcrypt-nodejs');
//var Role=require('./role');


var userSchema = mongoose.Schema({
    username:String,
    password:String,
    role: {type:objectId, ref:'Role'},
    sessionID:String
    //groups:[{type:objectId, ref:'Group'}]
});

userSchema.plugin(passportLocalMongoose);
userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

module.exports=mongoose.model('User', userSchema)