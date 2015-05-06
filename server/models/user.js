var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var userSchema   = new Schema({
    name: String,
    dzId: Number,
    email: String,
    token: String
});

module.exports = mongoose.model('User', userSchema);