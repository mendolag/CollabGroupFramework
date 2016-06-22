/**
 * Created by josmendola on 27/01/16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema,
    objectId=Schema.ObjectId;

var groupSchema = mongoose.Schema({
    groupManager:{type:objectId,ref:'User'},
    name:String,
    users:[{type:objectId, ref:'User'}],
    guests:[String]
});


module.exports=mongoose.model('Group', groupSchema);