var express = require('express');
var mysql = require('mysql');
var app = express();

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',//phi001_tee_880
    database: 'resa'
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get('/global.css', (req, res) => {
    res.sendFile(__dirname + "/public/global.css");
});

app.get('/bundle.js', (req, res) => {
    res.sendFile(__dirname + "/public/bundle.js");
});

app.get('/bundle.css', (req, res) => {
    res.sendFile(__dirname + "/public/bundle.css");
});

app.post('/GetData', (req, res) => {

    con.query('SELECT * FROM Lindvalen;', (err, result) => {
        if(err != null) console.log(err);
	con.query('SELECT * FROM People;', (err, result2) => {
            res.json({info: result[0],people: result2});
        });
    });

});

app.listen('80', (err) => {
    console.log("server started at port 80");
})
