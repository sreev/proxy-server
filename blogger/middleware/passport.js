let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../models/user')
let util = require('util')

module.exports = (app) => {
    let passport = app.passport

    passport.serializeUser(nodeifyit(async (user) => user._id))
    passport.deserializeUser(nodeifyit(async (id) => {
        return await User.promise.findById(id)
    }))

    passport.use(new LocalStrategy({
        usernameField: 'username',
        failureFlash: true
    }, nodeifyit(async (username, password) => {
            let user

            if (username.indexOf('@')) {
                let email = username.toLowerCase()
                user = await User.promise.findOne({email})
            }
            else {
                let regexp = new RegExp(username, 'i')
                user = await User.promise.findOne({
                    username: {$regex: regexp}
                })
            }

            if (!user || username !== user.username) {
                return [false, {message: 'Invalid username'}]
            }

            if (!await user.validatePassword(password)) {
                return [false, {message: 'Invalid password'}]
            }

            return user
        }, {spread: true})
    ))

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        failureFlash: true,
        passReqToCallback: true
    }, nodeifyit(async (req, email, password) => {
            email = (email || '').toLowerCase()

            if (await User.promise.findOne({email})) {
                return [false, {message: 'That email is already taken.'}]
            }

            let {username, title, description} = req.body
            console.log(req.body)

            let regexp = new RegExp(username, 'i')
            let query = {username: {$regexp: regexp}}

            console.log(query)

            try {
                if (await User.promise.findOne(query)) {
                    return [false, {message: 'That username is already taken.'}]
                }
            }
            catch(e) {
                console.log(e)
            }

            let user = new User()
            user.email = email
            user.username = username
            user.blogTitle = title
            user.blogDescription = description
            //user.password = await user.generateHash(password)
            user.password = password

            //return await user.save()
            try {
                return await user.save()
            }
            catch(e) {
                console.log(util.inspect(e))
                return [false, {message: e.message}]
            }
        }, {spread: true})
    ))
}
