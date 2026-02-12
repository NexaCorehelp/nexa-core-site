const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'nexion', 'views'));
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname)); // for static HTML at root

// Session and Passport setup for dashboard
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => done(null, profile));
}));

// Main site static HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/appeal', (req, res) => res.sendFile(path.join(__dirname, 'appeal.html')));
app.get('/catalogue', (req, res) => res.sendFile(path.join(__dirname, 'catalogue.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(__dirname, 'orders.html')));
app.get('/portfolio', (req, res) => res.sendFile(path.join(__dirname, 'portfolio.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/services', (req, res) => res.sendFile(path.join(__dirname, 'services.html')));
app.get('/tos', (req, res) => res.sendFile(path.join(__dirname, 'tos.html')));
app.get('/404', (req, res) => res.sendFile(path.join(__dirname, '404.html')));

// Nexapatch static HTML
app.use('/nexapatch', express.static(path.join(__dirname, 'nexapatch')));

// Dashboard (nexion) routes
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/nexion/login');
}
app.get('/nexion/login', passport.authenticate('discord'));
app.get('/nexion/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/nexion' }), (req, res) => res.redirect('/nexion/dashboard'));
app.get('/nexion/logout', (req, res) => { req.logout(() => res.redirect('/nexion')); });
app.get('/nexion', (req, res) => res.render('landing', { user: req.user }));
app.get('/nexion/dashboard', checkAuth, (req, res) => res.render('dashboard', { user: req.user, guilds: req.user.guilds || [] }));
app.get('/nexion/dashboard/guild/:id', checkAuth, (req, res) => res.render('guild', { user: req.user, guild: { id: req.params.id, name: 'Example Guild' }, channels: [], activeModule: 'logging', logging_enabled: false, logging_channel: '' }));

module.exports = app;
