var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(server);
var socketioJwt = require('socketio-jwt');
var request = require('request');
var mongoose = require('mongoose');
var jwt = require("jsonwebtoken");
var Broadcast = require('./models/broadcast');
var User = require('./models/user');
var deezerURL = "http://api.deezer.com";
mongoose.connect('mongodb://127.0.0.1:27017/deecaster');
var JWT_TOKEN = "OIIubyu78&%F87hfa6gGUTF56*&&^%Fdq";
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var currentUser;

io.on('connection',socketioJwt.authorize({
    secret: JWT_TOKEN,
    timeout: 15000 // 15 seconds to send the authentication message
})).on('authenticated', function (socket) {
    var currentUser = socket.decoded_token;
    socket.on("track changed", function (request) {
        Broadcast.findById(request.broadcastId)
            .exec(function (err, bc) {
                if (err) console.log(err);
                bc.currentTrack = request.currentTrack;
                bc.nextTrack = request.nextTrack;
                bc.save(function (err) {
                    if (err) console.log(err);
                });
            });

        socket.broadcast.emit('track changed', request);
    });

    socket.on("user join broadcast", function (request) {
        Broadcast.findById(request.broadcastId)
            .exec(function (err, bc) {
                if (err) console.log(err);
                bc.listeners.push(request.listener._id);
                bc.save(function (err) {
                    if (err) console.log(err);
                });
            });
        socket.broadcast.emit('user join broadcast', request);
    });

    socket.on("user left broadcast", function (request) {
        Broadcast.findById(request.broadcastId)
            .exec(function (err, bc) {
                if (err) console.log(err);
                bc.listeners.splice(bc.listeners.indexOf(currentUser._id), 1);
                bc.save(function (err) {
                    if (err) console.log(err);
                });
            });
        socket.broadcast.emit('user left broadcast', request);
    });

    socket.on("sync player position", function (request) {
        socket.broadcast.emit('sync player position', request);
    });

    socket.on('disconnect', function () {
        if(currentUser){
            Broadcast.find({listeners: currentUser._id}, function (err, bcs) {
                if (err) res.send(err);
                if (bcs) {
                    bcs.forEach(function (bc) {
                        bc.listeners.splice(bc.listeners.indexOf(currentUser._id), 1);
                        bc.save(function (err) {
                            if (err) res.send(err);
                        });
                        socket.broadcast.emit('user left broadcast', {broadcastId: bc._id, listener: currentUser});
                    });
                }
            });
            Broadcast.find({_creator: currentUser._id}, function (err, bcs) {
                if (err) res.send(err);
                if (bcs) {
                    bcs.forEach(function (bc) {
                        bc.isActive = false;
                        bc.save(function (err) {
                            if (err) res.send(err);
                        });
                        socket.broadcast.emit('broadcaster left broadcast', {broadcastId: bc._id, user: currentUser});
                    })
                }
            });
        }

    });
});


var apiRouter = express.Router();

app.use(function (req, res, next) {
    if (req.url === "/api/user/login") {
        next();
    } else {
        var bearerToken;
        var bearerHeader = req.headers["authorization"];
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];
            req.token = bearerToken;
            currentUser = jwt.verify(bearerToken, JWT_TOKEN);
            next();
        } else {
            res.sendStatus(403);
        }
    }


});

apiRouter.get('/', function (req, res) {
    res.json({message: 'hooray! welcome to our api!'});
});
apiRouter.route('/user')
    .get(function (req, res) {
        User.findOne({token: req.token}, function (err, user) {
            if (err) return res.send(err);
            if (user) {
                currentUser = user;
                res.json(user);
            } else {
                res.status(403);
            }
        });
    });
apiRouter.route('/user/login')
    .post(function (req, res) {
        request(deezerURL + "/user/me?access_token=" + req.body.access_token, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var dzUser = JSON.parse(body);
                if (dzUser.error) {
                    res.status(403);
                } else {
                    if (dzUser.id === req.body.user_id) {
                        User.findOne({dzId: req.body.user_id}, function (err, muser) {
                            if (err) return res.send(err);
                            if (!muser) {
                                //new user - create user
                                User.create({
                                    name: dzUser.name,
                                    dzId: dzUser.id,
                                    email: dzUser.email
                                }, function (err, user) {
                                    if (err) res.send(err);
                                    user.token = jwt.sign(user, JWT_TOKEN);
                                    user.save(function (err, user1) {
                                        currentUser = user1;
                                        res.json(user1);
                                    });
                                });
                            } else {
                                res.json(muser);
                            }
                        });
                    }
                    else {
                        res.status(403);
                    }
                }
            }
        });
    });
apiRouter.route('/broadcasts')
    .get(function (req, res) {
        Broadcast.find({$or: [{'isActive': true}, {'_creator': currentUser._id}]})
            .populate('_creator', 'name')
            .exec(function (err, bcs) {
                if (err) res.send(err);
                res.json(bcs);
            });
    })
    .post(function (req, res) {
        var bc = new Broadcast();
        bc.name = req.body.name;
        bc.genre = req.body.genre;
        bc._creator = currentUser._id;
        bc.isActive = false;
        bc.save(function (err, bc) {
            if (err) res.send(err);
            res.json(bc);
        });

    });
apiRouter.route('/broadcasts/:id')
    .get(function (req, res) {
        Broadcast.findById(req.params.id)
            .populate('_creator listeners')
            .exec(function (err, bc) {
                if (err) res.send(err);
                res.json(bc);
            });
    })
    .put(function (req, res) {
        Broadcast.findById(req.params.id)
            .exec(function (err, bc) {

                if (err) res.send(err);

                bc.listeners = req.body.listeners.map(function (listener) {
                    return listener._id
                });
                bc.isActive = req.body.isActive;
                bc.save(function (err, bc) {
                    if (err) res.send(err);
                    console.log(bc)
                });
                res.json(req.body);
            });
    })
app.use('/api', apiRouter);

server.listen(3000, function () {
    console.log('listening on *:3000');
});
