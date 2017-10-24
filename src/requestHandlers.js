exports.getIndex = function(res){
    console.log('Manejador de solicitud "index" solicitado');
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write('Hola Index');
    res.end()
}

exports.getContact = function(res){
    console.log('Handler solicitado: /contact')
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write('Hola Contacto')
    res.end()
}