/**
 * Created by josmendola on 27/01/16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema,
    objectId=Schema.ObjectId;



var roleSchema = mongoose.Schema({
    name:String,
    components:[{component:{type:objectId, ref:'Components'},read:Boolean, write:Boolean, push:Boolean,pull:Boolean}]
});


module.exports=mongoose.model('Role', roleSchema);
