/**
 * Created by josmendola on 27/01/16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema,
    objectId=Schema.ObjectId;



var roleSchema = mongoose.Schema({
    name:String,
    components:[{type:objectId, ref:'Components',perms:Number}]
});


module.exports=mongoose.model('Role', roleSchema);
