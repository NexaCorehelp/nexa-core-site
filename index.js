require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});
client.commands = new Collection();

// Initialize database
const db = require('./database');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS mutes (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        muted_at INTEGER,
        PRIMARY KEY (user_id, guild_id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        logging_enabled INTEGER DEFAULT 0,
        logging_channel TEXT
    )`);
});

// Load commands and events
let ds = path.join(__dirname, 'commands');
if (fs.existsSync(ds)) {
    fs.readdirSync(ds).filter(f => f.endsWith('.js')).forEach(file => {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    });
}

ds = path.join(__dirname, 'events');
if (fs.existsSync(ds)) {
    fs.readdirSync(ds).filter(f => f.endsWith('.js')).forEach(file => {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    });
}

client.login(process.env.TOKEN);

const app = express();

// IMPORTANT: This allows Express to read form data from your guild.ejs
app.use(express.urlencoded({ extended: true })); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/discord/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
}));

app.use(session({
    secret: 'keyboard cat', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 604800000 } // 7 days
}));
app.use(passport.initialize());
app.use(passport.session());

// --- HELPERS ---

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// --- WEB ROUTES ---

app.get('/login', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));
app.get('/logout', (req, res) => req.logout(() => res.redirect('/')));

app.get('/', (req, res) => {
    res.render('landing', {
        user: req.user,
        serverCount: client.guilds.cache.size,
        userCount: client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)
    });
});

app.get('/dashboard', checkAuth, (req, res) => {
    const ownerID = '1092489655888379915'; 
    if (req.user.id !== ownerID) return res.send("You are not authorized.");

    const userGuilds = req.user.guilds.filter(guild => {
        const isManager = (BigInt(guild.permissions) & BigInt(0x20)) === BigInt(0x20);
        return client.guilds.cache.has(guild.id) || isManager;
    }).map(guild => {
        const botInGuild = client.guilds.cache.has(guild.id);
        return {
            ...guild,
            botInGuild,
            inviteLink: `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot&guild_id=${guild.id}`
        };
    }).sort((a, b) => (a.botInGuild === b.botInGuild) ? 0 : a.botInGuild ? -1 : 1);

    res.render('dashboard', { user: req.user, guilds: userGuilds });
});

// --- GUILD SETTINGS ROUTES ---

// GET the settings page
app.get('/dashboard/guild/:guildID', checkAuth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect('/dashboard');

    db.get(`SELECT * FROM guild_settings WHERE guild_id = ?`, [guild.id], (err, row) => {
        res.render('guild', {
            guild,
            activeModule: req.query.module || null,
            channels: guild.channels.cache.filter(c => c.type === 0), // Text channels 
            logging_enabled: row ? row.logging_enabled === 1 : false,
            logging_channel: row ? row.logging_channel : null
        });
    });
});

// POST to save logging settings

app.post('/dashboard/guild/:guildID/logging', checkAuth, (req, res) => {
    const guildID = req.params.guildID;
    const enabled = req.body.logging_enabled ? 1 : 0;
    const channelID = req.body.logging_channel;

    db.run(`INSERT INTO guild_settings (guild_id, logging_enabled, logging_channel) 
            VALUES (?, ?, ?) 
            ON CONFLICT(guild_id) DO UPDATE SET 
            logging_enabled = excluded.logging_enabled, 
            logging_channel = excluded.logging_channel`, 
    [guildID, enabled, channelID], (err) => {
        if (err) console.error(err);
        res.redirect(`/dashboard/guild/${guildID}`);
    });
});

app.listen(3000, () => console.log('Dashboard live at http://localhost:3000'));
