let isLoggedIn = require('./middleware/isLoggedIn')
let multiparty = require('multiparty')
let fs = require('fs')
let then = require('express-then')
let Post = require('./models/post')
let DataUri = require('datauri')

module.exports = (app) => {
    let passport = app.passport

    app.get('/', (req, res) => {
        //res.render('index.ejs', {message: req.flash('error')})
        res.render('index.ejs')
    })

    app.get('/login', (req, res) => {
        console.log('get-login')
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/signup', (req, res) => {
        console.log('get-signup' + req)
        res.render('signup.ejs', {message: req.flash('error')})
    })

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/post/:postId?', then(async (req, res) => {
        let postId = req.params.postId
        if (!postId) {
            res.render('post.ejs', {
                post: {},
                verb: 'Create'
            })

            return
        }

        let post = await Post.promise.findById(postId)

        if (!post) res.send(404, 'Not Found')
        let dataUri = new DataUri
        let image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)

        console.log(image)

        res.render('post.ejs', {
            post: post,
            verb: 'Edit',
            image: "data:${post.image.contentType};base64,${image.base64}"
        })
    }))

    app.get('/post/:postId?', then(async (req, res) => {
        let postId = req.params.postId

        if (!postId) {
            console.log(req.body)

            let post = new Post()

            let [{title: [title], content: [content]}, {image: [file]}] = await new multiparty.Form().promise.parse(req)

            post.title = title
            post.content = content

            post.image.data = await fs.promise.readFile(file.path)
            post.image.contentType = file.headers['content-type']

            console.log(file, title, content, post.image)

            await post.save()

            res.redirect('/blog/' + encodeURI(req.user.blogTitle))

            return
        }

        let post = await Post.promise.findById(postId)

        if (!post) res.send(404, 'Not Found')

        post.title = title
        post.content = content

        await post.save()

        res.redner('/blog/' + encodeURI(req.user.blogTitle))

        console.log('TODO')
    }))
}
