
var User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");

exports.stats_get = (req, res) => {
    if(!req.query.token) return res.status(401).send('token wymagany');

    User.findOne({_id: req.query.id}, function(err,obj) {
        bcrypt.compare(req.query.token, obj.token).then(function(result){
        if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });
        if (obj === null) return res.status(400).send({ error: 'Złe dane'});
        if (!result) return res.status(403).send('Zły token');
        });
        res.status(200).send({avgWinTime: obj.avgWinTime, wins: obj.wins, losses: obj.losses});
    });
};

exports.stats_post = [ (req, res) =>{

        if (req.body.token === '') return res.status(401).send('Wymagany token') 
        User.findOne({_id: req.body.id},(err, obj) =>{
            bcrypt.compare(req.body.token, obj.token).then(function(result){
                if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });
                if (obj === null) return res.status(400).send({ error: 'Złe dane'});
                if (!result) return res.status(403).send('Niepoprawny token')
                
                if(req.body.won){
                    ++obj.wins;
                    obj.winsTimeArray.push(req.body.time);
                    const sum = obj.winsTimeArray.reduce(
                        (previousValue, currentValue) => previousValue + currentValue
                    );

                    obj.avgWinTime = Math.floor(sum / obj.winsTimeArray.length);
                    ++obj.played_games;
                } else {
                    ++obj.losses;
                    ++obj.played_games;
                }
                obj.save(err => {   
                    if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });
                    res.status(201).send('Sukces');  
                });
            });

        });    
}];

exports.register = [ (req, res) =>{
    User.countDocuments({username: req.body.username},(err, count)=>{
    if (!/\d/.test(req.body.password) && req.body.password.length < 8) 
        return res.status(400).send({errors: ['Hasło musi mieć co najmniej 8 znaków, w tym 1 cyfrę']});

        if (count) return res.status(400).send({errors: ['Błędne hasło lub nazwa użytkownika']})
        if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });

        bcrypt.hash(req.body.password, 10 , function(err, hash) {
            if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });
            var user = new User({
                username: req.body.username,
                password: hash,
                played_games: 0,
                wins: 0,
                winsTimeArray: [],
                avgWinTime: 0,
                losses: 0
            })

            user.save();
            console.log('Dodano nowego użytkownika');
            res.status(201).send({_id: user.id});

        });
    });
}];

exports.login = (req,res) => {
    if (!req.body.username || !req.body.password) return res.status(400).send({errors: ['Zła nazwa użytkowanika lub hasło.']});

        User.findOne({username: req.body.username},(err,obj)=>{
        if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });
        if (obj === null) return res.status(400).send({ error: 'Złe dane'})

            bcrypt.compare(req.body.password, obj.password).then(function(result) {
                if (obj === null || !result) return res.status(400).send({errors: ['Zła nazwa użytkowanika lub hasło.']});

                var token = Math.random().toString(36).substr(2);
                bcrypt.hash(token, 10, function(err, hash) {
                obj.token = hash;
                    obj.save( err => {
                        if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });
                    res.status(201).send();
                    });
                res.status(200).send({id: obj.id, token:token, username: obj.username});
                });
                
                setTimeout(() => {
                    obj.token = null;
                    obj.save(err => {   
                        if (err) return res.status(500).send({ errors: ['Błąd podczas łączenia z bazą danych: ' + err] });
                        res.status(200);  
                    });
                },600000);
            });    
        });
}

exports.email = (req,res) => {
    if (!req.params.id) return res.status(400).send({errors: ['Złe dane']});

    User.findOne({_id:req.params.id}, (err, obj) => {
        if (err) return console.log(err);
        if (!obj) return res.status(400).send({errors: ['Złe dane']});

        const token = Math.random().toString(36).substr(2);
        obj.deleteToken = token;

        async function main() {
            let testAccount = await nodemailer.createTestAccount();

            let transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

            let info = await transporter.sendMail({
                from: '"MinesweeperFRS" <Filip_to_koks@example.com>', 
                to: "you@example.com", 
                subject: "Usuwanie konta minesweeper",
                text: `Aby usunąć konto wejdź w link http://localhost:8080/jsExercismCourse/deleteUser?token=${token}`, 
                html: `<p> Wejdź <a href="http://localhost:8080/jsExercismCourse/deleteUser?token=${token}">w ten link</a> aby usunąć konto.</p>`,
            });

            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
        main().catch(console.error);
            
        obj.save();
        res.status(204).send('Wiadomość została wysłana');
            
    });
}

exports.delete_user = (req,res) => {
    if (!req.params.id) return res.status(400).send({errors: ['Złe dane']});
    
    User.findOne({ _id:req.params.id }, (err, obj) => {
        if (err) return res.status(500).send(err);

        if (!req.query.token || !req.query.deleteToken) return res.status(400).send({errors: ['Złe dane']});
        if ( obj.token !== req.query.token || obj.deleteToken !== req.query.deleteToken) return res.status(400);
        
        User.deleteOne({ _id: req.params.id }, (err) => {
            if (err) return res.status(500).send(err);
            res.status(204).send('Konto usunięto pomyślnie');
        });
    
    })
}