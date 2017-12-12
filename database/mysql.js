var mysql = require('mysql');


var connection = mysql.createConnection({
    host              : 'localhost',
    user              : 'pgilp',
    password          : 'pablo',
    database          : 'aerolinea_proyecto',
    multipleStatements: true
});
 
connection.on('error', function(err) {
    console.log(err.code);
});
 
exports.connection = connection;

exports.connect = function(){
    connection.connect(function(err){
        if(!err) {
            console.log('Conexión establecida con éxito!!');
        } else {
            console.log("MySQL-> %s", err);
            return err;
        }
    });
};