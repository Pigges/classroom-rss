import express from 'express';
import api from '../api.js';
import loadJSON from '../loadJSON.js';

const router = express.Router();

router.get('/', async (req,res)=>{
    const user = await api('userProfiles/me?fields=name.fullName,photoUrl');
    const scopes = loadJSON('/scopes.json');
    res.render('account', {user, scopes});
})


export default router;