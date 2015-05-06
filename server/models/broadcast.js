var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var BCSchema   = new Schema({
    _creator: { type: String, ref: 'User' },
    name: String,
    genre: String,
    isActive: Boolean,
    currentTrack: Schema.Types.Mixed,
    nextTrack: Schema.Types.Mixed,
    listeners: [{ type: String, ref: 'User' }]
});

module.exports = mongoose.model('Broadcast', BCSchema);