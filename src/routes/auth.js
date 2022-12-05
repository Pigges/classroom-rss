import express from 'express';
import axios from 'axios';
import loadJSON from '../loadJSON.js';
import saveJSON from '../saveJSON.js';

const router = express.Router();

router.get('/', async (req,res)=>{
    if (req.query.code) {
        // Get credentials
        const credentials = loadJSON('/credentials.json');
        // Try and receive OAUTH token from Google
        const token = await getGoogleAuthToken(req.query.code, credentials);
        if (token) {
            saveJSON('/token.json', {
                type: 'authorized_user',
                client_id: credentials.installed.client_id,
                client_secret: credentials.installed.client_secret,
                refresh_token: token.refresh_token,
                access_token: token.access_token
            });
        }
        res.redirect('/');
    } else {
        res.send("Wrong");
    }
});

async function getGoogleAuthToken(code, credentials) {
    const url = credentials.installed.token_uri;

    // Define params
    const values = {
        code,
        client_id: credentials.installed.client_id,
        client_secret: credentials.installed.client_secret,
        redirect_uri: credentials.installed.redirect_uris,
        grant_type: 'authorization_code'
    };

    // Create URLSearchParams Object from the params
    const params = new URLSearchParams(values);

    // Try retrieving access_token
    try {
        const res = await axios.post(url, params.toString(), {
        })
        return res.data;
    } catch (err) {
        console.log(err);
    }
    // console.log(res);
}


export default router;