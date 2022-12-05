import express from 'express';
import api from '../api.js';
import loadJSON from '../loadJSON.js';
import saveJSON from '../saveJSON.js';

const router = express.Router();

router.get('/', async (req,res)=>{
    const token = loadJSON('/token.json', false);
    // Check if token exists
    if (token) {
        // Make sure the token contains access_token
        if (!token.access_token) {
            const authUrl = getAuthUrl();
            res.render('login', {authUrl});
        } else loadFeeds(token, res);
    } else {
        const authUrl = getAuthUrl();
        res.render('login', {authUrl});
    }
});

const loadFeeds = async (token, res) =>{
    const data = await api('courses?fields=courses.id,courses.name,courses.descriptionHeading,courses.alternateLink,courses.courseState');
    res.render('feeds', {data});
}


const getAuthUrl = () => {
    const credentials = loadJSON('/credentials.json');

    // Set OAUTH params
    const options = {
        redirect_uri: credentials.installed.redirect_uris,
        client_id: credentials.installed.client_id,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: loadJSON('/scopes.json').join(" ")
    };
    const qs = new URLSearchParams(options);
    return `${credentials.installed.auth_uri}?${qs}`
}


export default router;