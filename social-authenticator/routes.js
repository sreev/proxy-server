let _ = require('lodash')
let then = require('express-then')
let isLoggedIn = require('./middlewares/isLoggedIn')
//let posts = require('../data/posts')
let Twitter = require('twitter')
let networks = {
    twitter: {
        network: {
            icon: 'facebook',
            name: 'facebook',
            class: 'btn-primary'
        }
    }
}

module.exports = (app) => {
    let passport = app.passport
    let twitterConfig = app.config.auth.twitter

    //

    app.get('/', (req, res) => res.render('index.ejs'))

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

    app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {message: req.flash('error') })
    })

    //
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/unlink/:type', isLoggedIn, then(async (req, res, next) => {
        let validTypes = Object.keys(scopes).concat(['local'])

        if (!_.contains(validTypes, req.params.type)) return next()

        await req.user.unlinkAccount(req.params.type)

        let stillLoggedIn = _.any(validTypes, type => {
            if (type == 'local') return req.user[type].email

            return req.user[type] && req.user[type].id
        })

        if (stillLoggedIn) {
            return res.redirect('/profile')
        }

        await req.user.remove()

        req.logout()

        res.redirect('/')
    }))

    app.get('/timeline', isLoggedIn, then(async (req, res) => {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let [tweets] = await twitterClient.promise.get('statuses/home_timeline')

        tweets = tweets.map(tweet => {
            return {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
            }
        })

        res.redirect('timeline.ejs', {
            posts: tweets
        })
    }))

    app.get('/reply/:id', isLoggedIn, (req, res) => {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let status = req.query.reply
        let in_reply_to_status_id = req.query.id_str

        if (status.length > 140) {
            req.flash('error', 'Status is over 140 characters!')
        }

        if (!status) {
            req.flash('error', 'Status cannot be empty!!')
        }

        await twitterClient.promise.get('statuses/home_timeline', {status, in_reply_to_status_id})

        res.redirect('/reply')
    })

    app.get('/share/:id', isLoggedIn, (req, res) => {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let share = req.query.share
        let id = req.query.id_str

        if (status.length > 140) {
            req.flash('error', 'Status is over 140 characters!')
        }

        if (!status) {
            req.flash('error', 'Status cannot be empty!!')
        }

        await twitterClient.promise.post('statuses/retweet/:id', {id, share})

        res.redirect('/share')
    })

    app.get('/compose', isLoggedIn, (req, res) => res.render('compose.ejs'))

    app.post('/compose', isLoggedIn, then(async (req, res) => {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let status = req.query.text

        if (status.length > 140) {
            req.flash('error', 'Status is over 140 characters!')
        }

        if (!status) {
            req.flash('error', 'Status cannot be empty!!')
        }

        await twitterClient.promise.post('statuses/update', {status})

        res.redirect('/timeline')
    }))

    app.post('/like/:id', isLoggedIn, then(async (req, res) => {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let id = req.params.id
        await twitterClient.promise.post('favorites/create', {id})

        res.end()
    }))

    app.post('/unlike/:id', isLoggedIn, then(async (req, res) => {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let id = req.params.id
        await twitterClient.promise.post('favorites/destroy', {id})

        res.end()
    }))

    return passport
}

// facebook passport strategy