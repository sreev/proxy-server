let passport = require('passport')
let nodeifyit = require('nodeifyit')

let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy

let requireDir = require('require-dir')
let config = requireDir('../config', {recurse: true})

require('songbird')

function usePassportStrategy(OauthStrategy, config, field) {
  config.passReqToCallback = true
  passport.use(new OauthStrategy(config, nodeifyit(authCB, {spread: true})))

  async function authCB(req, token, secret, account) {
    let user = await User.promise.findOne({[field+'.id']: account.id})

    // Is user logged in? => Link to existing account
    if (req.user) {
      // Logged-in user and existing user tied to 3rd-party account are different
      if (user && user.id !== req.user.id) {
        return [false, {message: 'That account is linked to another user already.'}]
      }
      req.user.linkAccount(field, {account, token, secret})

      return req.user
    }

    // Login existing using via 3rd party auth
    if (user) return user

    // Otherwise, create a new user for the linked account
    return await new User().linkAccount(field, {account, token, secret})
  }
}

/*
function useExternalPassportStrategy(OauthStrategy, config, field) {
  config.passReqToCallback = true
  passport.use(new OauthStrategy(config, nodeifyit(authCB, {spread: true})))

  async function authCB(req, token, _ignored_, account) {
      // 1. Load user from store
      // 2. If req.user exists, we're authorizing (connecting an account)
      // 2a. Ensure it's not associated with another account
      // 2b. Link account
      // 3. If not, we're authenticating (logging in)
      // 3a. If user exists, we're logging in via the 3rd party account
      // 3b. Otherwise create a user associated with the 3rd party account
  }
}
*/

function configure(config) {
  passport.serializeUser(nodeifyit(async (user) => user._id))
  passport.deserializeUser(nodeifyit(async (id) => {
    return await User.promise.findById(id)
  }))

  console.log(config)
  // usage
  usePassportStrategy(FacebookStrategy, {
    clientID: config.auth.facebookAuth.consumerKey,
    clientSecret: config.auth.facebookAuth.consumerSecret,
    callbackURL: config.auth.facebookAuth.callbackUrl,
  }, 'facebook')

  usePassportStrategy(TwitterStrategy, {
    consumerKey: config.auth.twitterAuth.consumerKey,
    consumerSecret: config.auth.twitterAuth.consumerSecret,
    callbackURL: config.auth.twitterAuth.callbackUrl,
  }, 'twitter')

  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'linkedin')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'google')
  // passport.use('local-login', new LocalStrategy({...}, (req, email, password, callback) => {...}))
  // passport.use('local-signup', new LocalStrategy({...}, (req, email, password, callback) => {...}))

  return passport
}

module.exports = {passport, configure}
