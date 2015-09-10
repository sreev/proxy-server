let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
//let bluebird = require('bluebird')
//require('longjohn')

//bluebird.longStackTraces()

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
//const ROOT_DIR = path.resolve(process.cwd())
const ROOT_DIR = path.resolve(process.cwd() + '/' + process.argv.slice(2)[1])

let app = express()

if (NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.listen(PORT, () => console.log(`LISTENING @ http://127.0.0.1:${PORT}`))

//app.get('*', sendHeaders, (req, res) => {
//  if (res.body) {
//    res.json(res.body)
//    return
//  }
//    console.log('req' + req)
//
//  fs.createReadStream(req.filePath).pipe(res)
//})

app.head('*', sendHeaders, (req, res) => res.end())

app.delete('*', setFileMeta, (req, res, next) => {
  async () => {
    if (!req.stat) {
      return res.send(400, 'Invalid Path')
    }
    
    if (req.stat.isDirectory()) {
      await rimraf.promise(req.filePath)
    }
    else {
      await fs.promise.unlink(req.filePath)
    }

    res.end()
  }().catch(next)
})

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
    async() => {
        if (req.stat) {
            return res.send('405', 'File exists')
        }
        await mkdirp.promise(req.dirPath)

        if (!req.isDir) {
            req.pipe(fs.createWriteStream(req.filePath))
        }

        res.end()
    }().catch(next)
})

app.post('*', setFileMeta, setDirDetails, (req, res, next) => {
    async() => {

        if (!req.stat) {
            return res.send('405', 'File does not exists')
        }

        if (req.isDir) {
            return res.send('405', 'Path is a directory')
        }

        await fs.promise.truncate(req.filePath, 0)

        req.pipe(fs.createWriteStream(req.filePath))

        res.end()
    }().catch(next)
})

function setDirDetails(req, res, next) {
    let filePath = req.filePath
    let endsWithSlash = filePath.charAt(filePath.length-1) === path.sep
    let hasExt = path.extname(filePath) !== ''
    req.isDir = endsWithSlash || !hasExt
    req.dirPath = req.isDir ? filePath : path.dirname(filePath)

    next()
}

function setFileMeta(req, res, next) {
  req.filePath = path.resolve(path.join(ROOT_DIR, req.url))

  if (req.filePath.indexOf(ROOT_DIR) !== 0) {
    res.send(400, 'Invalid path')
    return
  }
  fs.promise.stat(req.filePath)
      .then(stat => req.stat = stat, () => req.stat = null)
      .nodeify(next)
}

function sendHeaders(req, res, next) {
  nodeify(async () => {
    if (req.stat.isDirectory()) {
    let files = await fs.promise.readdir(req.filePath)
    res.body = JSON.stringify(files)
    res.setHeader('Content-Length', res.body.length)
    res.setHeader('Content-Type', 'application/json')
    return
  }

  res.setHeader('Content-Length', stat.size)
  let contentType = mime.contentType(path.extname(req.filePath))
  res.setHeader('Content-Type', contentType)
}(), next)
}

let archiver = require('archiver')
app.get('*', function (req, res) {
    //console.log(req)
    //console.log(res)
    //console.log(endsWithSlash || !hasExt)
    //res.send('hello world')

    console.log(req.path)

    let endsWithSlash = req.path.charAt(req.path.length-1) === path.sep
    let hasExt = path.extname(req.path) !== ''

    if (endsWithSlash || !hasExt) {
        console.log('it is a directory')
        let zip = archiver('zip')

        let outputFileName = ROOT_DIR + req.path.substring(0, req.length - 2) + '.zip'

        let output = fs.createWriteStream(outputFileName)

        let files = fs.readdir(req.path)

        files.forEach(function (file) {
            let fileName = req.path + file
            zip.append(fs.createReadStream(fileName), {name: fileName})
        })

        zip.pipe(output)

        output.on('close', function() {
            console.log('zip created')

            res.set('Content-Type', 'application/zip')
            res.set('Content-Disposition', 'attachment; filename=' + outputFileName)

            fs.createReadStream(outputFileName).pipe(res)
        })

        zip.finalize()
    }
    else {
        fs.createReadStream(ROOT_DIR + req.path).pipe(res)
    }
})


/*
 let ZipStream = require('zip-stream')
 app.get('*', function (req, res) {
 //console.log(req)
 //console.log(res)
 //console.log(endsWithSlash || !hasExt)
 //res.send('hello world')

 console.log(req.path)

 let endsWithSlash = req.path.charAt(req.path.length-1) === path.sep
 let hasExt = path.extname(req.path) !== ''

 if (endsWithSlash || !hasExt) {
 console.log('it is a directory')

 let outputFileName = req.path.substring(0, req.length - 2) + '.zip'

 res.set('Content-Type', 'application/zip')
 res.set('Content-Disposition', 'attachment; filename=' + outputFileName)

 let zip = new ZipStream()

 zip.pipe(res)

 let files = fs.readdir(req.path)

 files.forEach(function (file) {
 let fileName = req.path + file
 zip.entry(fs.createReadStream(fileName), {name: fileName})
 })

 zip.finalize()
 }
 else {
 fs.createReadStream(ROOT_DIR + req.path).pipe(res)
 }
 })

 */

let nssocket = require('nssocket')
let jsonSocket = require('json-socket')
let jsonOverTcp = require('json-over-tcp')
