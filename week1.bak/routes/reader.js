/**
 * Created by svaddi on 9/1/15.
 */
let express = require('express')
let router = express.Router()

let url = require('url')
let path = require('path')
let fs = require('fs')

/* GET file name */
router.get('/', execute)

function execute (req, res, next) {
    let filename = url.parse(req.url).query
    console.log('filename:' + filename)

    let fullpath = path.join(process.cwd(), filename)
    console.log('fullpath:' + fullpath)

    fs.readFile(fullpath, 'utf-8', function (err, data) {
        if (err) {
            console.log('error:' + err)
        }

        console.log('data:' + data)

        res.send('<pre>' + data + '</pre>')
    })
    //fs.createReadStream(fullpath).on('open', function(err, data) {
    //    data.pipe(res)
    //})
}

function readContent(err, data) {
    if (err) {
        console.log('error:' + err)
    }

    console.log('data:' + data)

    return data
}

module.exports = router
