let http = require('http')
let fs = require('fs')
let through = require('through')
let request = require('request')
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'
let port = argv.port || argv.host === '127.0.0.1' ? 8000:80
//let destinationUrl = 'http://127.0.0.1:8000'
let destinationUrl = argv.url || scheme + argv.host + ':' + port
let logStream = argv.logfile ? fs.createWriteStream(argv.logfile) : process.stdout

http.createServer((req, res) => {
  //console.log('\nEcho request: \n' + JSON.stringify(req.headers))
  logStream.write('\nEcho request: \n' + JSON.stringify(req.headers))

  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }
  //req.pipe(process.stdout)
  through(req, logStream, {autoDestroy: false})
  req.pipe(res)
}).listen(8000)

//console.log('Listening at http://127.0.0.1:8000')
logStream.write('Listening at http://127.0.0.1:8000')

http.createServer((req, res) => {
  let url = destinationUrl
  if (req.headers['x-destination-url']) {
    url = req.headers['x-destination-url']
  }

  let options = {
    headers: req.headers,
    //url: destinationUrl
    url : url + req.url
  }

  //console.log('\nProxy request: \n' + JSON.stringify(req.headers))
  logStream.write('\nProxy request: \n' + JSON.stringify(req.headers))
  //req.pipe(process.stdout)
  through(req, logStream, {autoDestroy: false})

  //console.log(JSON.stringify(destinationResponse.headers))
  let destinationResponse = req.pipe(request(options))
  logStream.write(JSON.stringify(destinationResponse.headers))

  destinationResponse.pipe(res)
  //destinationResponse.pipe(process.stdout)
  through(destinationResponse, logStream, {autoDestroy: false})
}).listen(8001)
