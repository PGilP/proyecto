exports.route = function(handle, pathname, res){
    console.log('Solicitud sobre ruta: ' + pathname);
    if(typeof handle[pathname] === 'function'){
        return handle[pathname](res)
    }else{
        console.log("No se encontro manipulador para " + pathname);
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.write('<meta charset="utf-8">');
        res.write('<p>404 No Encontrado</p>')
        res.end();
    }
}