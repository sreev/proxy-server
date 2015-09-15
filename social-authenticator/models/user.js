let mongoose = require('mongoose')
let bcrypt = require('bcrypt')
let nodeifyit = require('nodeifyit')

require('songbird')

let UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  blogTitle: String,
  blogDescription: String,

  facebook: {
    id: String,
    token: String,
    email: String,
    name: String
  }
})

UserSchema.methods.generateHash = async function(password) {
  return await bcrypt.promise.hash(password, 8)
}

UserSchema.methods.validatePassword = async function(password) {
  return await bcrypt.promise.compare(password, this.password)
}

userSchema.methods.linkAccount = function(type, values) {
  // linkAccount('facebook', ...) => linkFacebookAccount(values)
  return this['link'+_.capitalize(type)+'Account'](values)
}

userSchema.methods.linkLocalAccount = function({email, password}) {
  throw new Error('Not Implemented.')
}

userSchema.methods.linkFacebookAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

userSchema.methods.linkTwitterAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

userSchema.methods.linkGoogleAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

userSchema.methods.linkLinkedinAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

userSchema.methods.unlinkAccount = function(type) {
  throw new Error('Not Implemented.')
}

/*
UserSchema.path('password').validate((pw) => {
  console.log('password validate')
  return pw.length >= 4 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)
})

UserSchema.pre('save', function (callback) {
  console.log('this.isModified ', this)

  nodeifyit(async () => {
    if (!this.isModified('password')) return callback()

    this.password = await this.generateHash(this.password)
  }(), callback)
})
*/

module.exports = mongoose.model('User', userSchema)
