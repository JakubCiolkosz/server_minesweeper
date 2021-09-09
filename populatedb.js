#! /usr/bin/env node

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require('async')
var User = require('./models/user')

var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var users = []

function userCreate(username, password, played_games, wins, losses, winsTimeArray, avgWinTime, cb) {
  var user = new User({
    username: username,
    password: password,
    played_games: played_games,
    wins: wins,
    winsTimeArray: winsTimeArray, 
    avgWinTime: avgWinTime,
    losses: losses
  });
       
  user.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New user: ' + user);
    users.push(user)
    cb(null, user)
  }  );
}

function createUsers(cb) {
  async.series([
      function(callback) {
        userCreate('Test1','Test1', 10, 3, 7, [10,20,30], 20, callback); //username, gamesPlayed, wins, looses, winTime, avgWinTime, cb
      },
      function(callback) {
        userCreate('Kuba','japierdole1', 3, 2, 1, [21,37], 5, callback);
      },
      function(callback) {
        userCreate('Dawid','Dawid', 5, 5, 0, [21,15], 7, callback);
      },
      function(callback) {
        userCreate('Łukasz','Łukasz', 10, 6, 4, [13,37], 7, callback);
      },
      function(callback) {
        userCreate('Filip','Filip', 21, 3, 18, [42,1], 7, callback);
      }
      ],
      // optional callback
      cb);
}

createUsers();

/*async.series([
    createUsers,
    createBooks,
    createBookInstances
  ],
// Optional callback
  function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('BOOKInstances: '+bookinstances);
        
    }
    // All done, disconnect from database
    mongoose.connection.close();
});*/