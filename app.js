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
        next();
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
    req.session.errorAuth = false;
    if(req.session.user) res.redirect('/');
    else res.render('pages/login', {data : req.session});
});

app.get('/signup', function(req, res){
    req.session.errorUsername = false;
    if(req.session.user) res.redirect('/');
    else res.render('pages/signUp', {data : req.session});
});

app.get('/usersettings', checkSignIn, function(req, res){
    req.session.errorUsername = false;
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
    req.session.errorFlight = false;
    if(req.session.user){
        var getFlights = 'SELECT * FROM vuelo';
        database.connection.query(getFlights,function(err, rows, fields){
        if (err) throw err;
        var flights = rows;
        req.session.flights = flights;
        res.render('pages/buyFlights',{data : req.session});
        });
    }else res.redirect('/login');    
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
                req.session.errorAuth = true;
                res.render('pages/login', {data : req.session});
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
    database.connection.query(selectUsername, function(err, rows, fields) {
        console.log(rows);
        rows.filter(function(user){
            console.log(nameFree);
            console.log(user.usuario);
            if(user.usuario === req.body.username) nameFree = false;   
        });
        if(nameFree === true){
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
            req.session.errorUsername  = true;
            res.render('pages/signup', {
                data : req.session
            });
        }             
    });
});
                                        ///////////////POST COMPRAR VUELOS////////////////////////
app.post('/buyFlights',function(req, res){
    var numUpdateSeats = 0;
    var searchFlight = 'SELECT * FROM vuelo WHERE'+ 
                       ' fecha_vuelo = '+"'"+req.body.date+"'"+
                       ' AND destino = '+"'"+req.body.destination+"'"+
                       ' AND salida = '+"'"+req.body.origin+"'"+
                       ' AND num_asientos >= '+req.body.num;
    var selectIdUser = "SELECT id_usuario FROM usuarios WHERE usuario = '"+req.session.user+"'";
    console.log(selectIdUser);
    database.connection.query(searchFlight,function(err, rows, fields){
        if(err) throw err;
        var flightData = rows[0];
        if(!flightData){
            req.session.errorFlight = true;
            console.log(flightData);
            res.render('pages/buyflights', {data : req.session});
        }else{
            var avaliableSeats = (flightData.num_asientos)-(req.body.num);
            
            var updateSeats = "UPDATE `vuelo` SET `num_asientos` = '"+avaliableSeats+"' WHERE `vuelo`.`id_vuelo` = "+flightData.id_vuelo ;
            
            database.connection.query(selectIdUser,function(err,rows,fields){
                if (err) throw err;
                var idUser = rows[0];
                console.log(idUser);
                var insertSeatsBuy = "INSERT INTO `usuario_vuelo` (`id_usuario`, `id_vuelo`, `cantidad`) VALUES ('"+idUser.id_usuario+"', '"+flightData.id_vuelo+"','"+req.body.num+"')";
                var updateSeatsBuy = "UPDATE usuario_vuelo SET cantidad = '"+req.body.num+"' WHERE id_usuario = "+idUser.id_usuario+" AND id_vuelo ="+flightData.id_vuelo;
                //UPDATE `usuario_vuelo` SET `cantidad` = '5' WHERE `usuario_vuelo`.`id_usuario` = 12 AND `usuario_vuelo`.`id_vuelo` = 1
                var selectExistUsuarioVuelo = "SELECT * FROM usuario_vuelo WHERE id_vuelo = '"+flightData.id_vuelo+"' AND id_usuario = '"+idUser.id_usuario+"'";
                database.connection.query(selectExistUsuarioVuelo,function(err,rows,fields){
                    if (err) throw err;
                    var userFlight = rows[0];
                    if(userFlight){
                        var seatsReserved    = parseInt(userFlight.cantidad);
                        var newSeatsReserved = parseInt(req.body.num);
                        numUpdateSeats = newSeatsReserved + seatsReserved;
                        var updateSeatsBuy = "UPDATE usuario_vuelo SET cantidad = '"+numUpdateSeats+"' WHERE id_usuario = "+idUser.id_usuario+" AND id_vuelo ="+flightData.id_vuelo;
                        console.log('Lo que vas a sumar--->'+ req.body.num);
                        console.log(typeof req.body.num);
                        console.log('Total anterior--->'+userFlight.cantidad);
                        console.log(typeof userFlight.cantidad);
                        console.log('Suma--->'+seatsReserved);
                        console.log(typeof seatsReserved);
                        database.connection.query(updateSeatsBuy,function(err,rows,fields){
                        if (err) throw err;
                            database.connection.query(updateSeats,function(err, rows, fields){
                                if (err) throw err;
                            });
                        setTimeout(function(){
                            res.redirect('/buyflights');
                        },3000);
                        });
                    }else{
                        database.connection.query(insertSeatsBuy,function(err,rows,fields){
                        if (err) throw err;
                            database.connection.query(updateSeats,function(err, rows, fields){
                                if (err) throw err;
                            });
                        setTimeout(function(){
                            res.redirect('/buyflights');
                        },3000);
                        });
                    }
                });
            })   
        } 
    })
});

app.post('/userSettings',function(req,res){
    var queryUpdateUsername = "UPDATE `usuarios` SET  `usuario` = '"
                      +req.body.newUser
                      +"' WHERE `usuarios`.`usuario` = '"
                      +req.session.user+"'";
    var queryUpdatePass = "UPDATE `usuarios` SET  `contrasena` = '"
                      +req.body.newPass
                      +"' WHERE `usuarios`.`usuario` = '"
                      +req.session.user+"'";
    var queryUpdateEmail = "UPDATE `usuarios` SET  `correo` = '"
                      +req.body.newEmail
                      +"' WHERE `usuarios`.`usuario` = '"
                      +req.session.user+"'";
    var queryUpdateName = "UPDATE `usuarios` SET  `nombre` = '"
                      +req.body.newName
                      +"' WHERE `usuarios`.`usuario` = '"
                      +req.session.user+"'";
    
    if(req.body.newUser.length > 0){
        var selectUsername = 'SELECT usuario FROM usuarios';
        var nameFree       = true;
        database.connection.query(selectUsername, function(err, rows, fields) {
            console.log(rows);
            rows.filter(function(user){
                console.log(user.usuario);
                if(user.usuario === req.body.newUser) nameFree = false;
                console.log(nameFree);
            });
            if(nameFree){
                req.session.user = req.body.newUser;
                console.log(req.session);
                console.log(queryUpdateUsername);
                req.session.errorUsername = false;
                database.connection.query(queryUpdateUsername, function(err, rows, fields) {
                    if (err) throw err; 
                });
            }else{
                req.session.errorUsername = true;
            }
        });
    }

    
    if(req.body.newPass.length > 0){
        req.session.pass = req.body.newPass; 
        database.connection.query(queryUpdatePass, function(err, rows, fields) 
            {if (err) throw err;}
    )};
    
    if(req.body.newEmail.length > 0){
        req.session.email = req.body.newEmail;
        console.log(req.session);
        database.connection.query(queryUpdateEmail, function(err, rows, fields) 
            {if (err) throw err;}
    )};
    
    if(req.body.newName.length > 0){
        req.session.name = req.body.newName; 
        database.connection.query(queryUpdateName, function(err, rows, fields) 
            {if (err) throw err;}
    )};
    setTimeout(function(){
        res.render('pages/userSettings', {data : req.session});
    },3000)
    
});

app.use(function(req, res, next){
    res.status(404).render('pages/404', {data : req.session});
});

app.listen(8080);