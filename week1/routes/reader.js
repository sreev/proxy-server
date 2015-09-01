/**
 * Created by svaddi on 9/1/15.
 */
var express = require('express');
var router = express.Router();

var url = require('url');
var path = require('path');
var fs = require('fs');

/* GET file name */
router.get('/', execute);

function execute (req, res, next) {
    var filename = url.parse(req.url).query;
    //var filename = req.params['filename'];
    //var filename = req.params.filename;
    console.log('filename:' + filename);

    var fullpath = path.join(process.cwd(), filename);

    console.log('fullpath:' + fullpath);

    fs.readFile(fullpath, 'utf-8', function (err, data) {
        if (err) {
            console.log('error:' + err);
        }

        console.log('data:' + data);

        res.send('<pre>' + data + '</pre>');
    });
}

function readContent(err, data) {
    if (err) {
        console.log('error:' + err);
    }

    console.log('data:' + data);

    return data;
}

module.exports = router;
