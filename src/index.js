import * as dotenv from 'dotenv';
import express from 'express';
import auth from './routes/auth.js';
import feeds from './routes/feeds.js';
import rss from './routes/rss.js';
import account from './routes/account.js';
import cache from './routes/cache.js';
import loadJSON from './loadJSON.js';
import saveJSON from './saveJSON.js';

const PORT = process.env.PORT || 3000

dotenv.config();
const app = express();

// Make sure that credentials.json exists before running
loadJSON('/credentials.json');

app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use('/auth', auth)
app.use('/rss', rss);
app.use('/account', account)
app.use('/cache', cache);
app.use('/', feeds)


// Handle logging out
app.post('/logout', (req,res)=>{
    console.log("Logging out, deleting\n'./token.json' and './cache.json'");
    saveJSON('/token.json', {});
    saveJSON('/cache.json', {});
    res.redirect('/');
})

app.listen(PORT, (err)=>{
    console.log(err||"Classroom-RSS started");
})