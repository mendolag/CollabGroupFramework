/**
 * Created by josmendola on 01/03/16.
 */
/**
 * Created by josmendola on 27/01/16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema,
    objectId=Schema.ObjectId;
var pcompSchema = mongoose.Schema({
    componentId:{type:objectId, ref:'Components'},
    permissions:{
        read:Boolean,
        write:Boolean,
        pull:Boolean,
        push:Boolean
    }
});


module.exports=mongoose.model('componentPerms', pcompSchema);