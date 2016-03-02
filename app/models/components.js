/**
 * Created by josmendola on 27/01/16.
 */
var mongoose = require('mongoose');

var compSchema = mongoose.Schema({
    name:String,
    path:String
});


module.exports=mongoose.model('Components', compSchema);