var express = require('express');
var router  = express.Router();
var bodyParser = require('body-parser');
var multer = require('multer');
var session = require('express-session');
var database = require('./database/mysql');

database.connect();

var upload = multer();
var app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(upload.array());
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));

function checkSignIn(req, res, next){
    console.log(req.session.user);
    if(req.session.user){
        next();     //Si existe la sesión carga la página
    } else {
        var err = new Error("No estás registrado!");
        console.log(err);
        next();
    }
}

app.get('/', function (req, res) {
    console.log(req.session);
    res.render('pages/index', {
        data : req.session
    });
});

app.get('/login', function (req, res) {
    if(req.session.user) res.redirect('/');
    else res.render('pages/login', {data : req.session});
});

app.get('/signup', function(req, res){
    if(req.session.user) res.redirect('/');
    else res.render('pages/signUp', {data : req.session});
});

app.get('/usersettings', checkSignIn, function(req, res){
    if(req.session.user) res.render('pages/userSettings', {data : req.session});
    else res.redirect('/login');
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect('/login');
});

app.get('/contact', checkSignIn, function(req, res){
    if(req.session.user) res.render('pages/contact',{data : req.session});
    else res.redirect('/login');
});

app.get('/buyflights', checkSignIn, function(req, res){
    if(req.session.user) res.render('pages/buyFlights',{data : req.session});
    else res.redirect('/login');
});

app.get('/changeflights', checkSignIn, function(req, res){
    if(req.session.user) res.render('pages/changeFlights',{data : req.session});
    else res.redirect('/login');
});


app.post('/login', function (req, res) {
    var selectUserPass = 'SELECT * FROM usuarios WHERE usuario LIKE \''+req.body.username+'\' AND contrasena LIKE \''+req.body.pass+'\'';
    var user ={
        usuario    : req.body.username,
        contrasena : req.body.pass
    }
    console.log(selectUserPass);
    database.connection.query(selectUserPass, function(err, rows, fields) {
        if(err){
            throw err;  
        } else{
            var userLogin = rows;
            if(!userLogin[0]){
                res.send('No existe dicho usuario');
            }else if(userLogin[0].usuario === user.usuario){
                console.log(rows);
                req.session.user  = userLogin[0].usuario;
                req.session.pass  = userLogin[0].contrasena;
                req.session.email = userLogin[0].correo;
                req.session.name  = userLogin[0].nombre;
                req.session.date  = userLogin[0].fecha_nac;
                res.redirect('/');
                res.end();
            }
        }        
    });
});

app.post('/signup', function(req, res){
    var newUser = {
        id_usuario : null,
        usuario    : req.body.username,
        contrasena : req.body.pass,
        correo     : req.body.email,
        nombre     : req.body.name,
        fecha_nac  : req.body.date
    }
    var selectUsername = 'SELECT usuario FROM usuarios';
    var insertUser     = 'INSERT INTO `usuarios` SET ?';
    var nameFree       = true;
    console.log(insertUser);
    database.connection.query(selectUsername, function(err, rows, fields) {
        console.log(rows);
        rows.filter(function(user){
            console.log(nameFree);
            console.log(user.usuario);
            if(user.usuario === req.body.username) nameFree = false;   
        });
        if(nameFree){
            var query = database.connection.query(insertUser, newUser,function(err, rows){
                if(err) throw err;
            });
            req.session.user  = newUser.usuario;
            req.session.pass  = newUser.contrasena;
            req.session.email = newUser.correo;
            req.session.name  = newUser.nombre;
            req.session.date  = newUser.fecha_nac;
            res.render('pages/index', {
                data : req.session
            });
        }else{
            res.send('Nombre de usuario ya existente');  
        } 
    });
});

app.post('/userSettings',function(req,res){
    
});

app.use(function(req, res, next){
    res.status(404).render('pages/404', {data : req.session});
});

app.listen(8080);