/**
 * Created by josmendola on 27/01/16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema,
    objectId=Schema.ObjectId;

var groupSchema = mongoose.Schema({
    name:String,
    users:[{type:objectId, ref:'User'}]
});


module.exports=mongoose.model('Group', groupSchema);