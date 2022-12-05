import dotenv from 'dotenv';
import axios from 'axios';
import loadJSON from './loadJSON.js';
import saveJSON from './saveJSON.js';

dotenv.config();

async function api (url) {
    // Load  token data
    const token = loadJSON('/token.json', false);

    // Make sure we have a token with a refresh_token
    if (!token || !token.refresh_token) return;

    // Try use cache on safe urls
    const cache = getCache(url);
    if (cache) return cache;
    
    // Try and fetch data from Google API
    const data = await fetch(url, token);

    // Try save cache on safe urls
    saveCache(url, data);
    
    // Return data
    return data;
}

const fetch = async (url, token) => {
    // Set bearer to empty string if token.access_token does not exist to prevent error
    const bearer = token ? token.access_token : '';

    try {
        // Fetch data from Google API
        return (await axios.get("https://classroom.googleapis.com/v1/" + url, {
            headers: {'Authorization': 'Bearer ' + bearer}
        })).data;
    } catch (err) {
        // Check if Authorization fails
        if (err.response.status == 401) return await updateToken(token, url);
        // Check if Not Found
        if (err.response.status == 404) return
        else console.log(err);
    }
}

async function updateToken(token, url) {
    console.log("access_token not valid... generating new");

    // Load credentials information
    const credentials = loadJSON('/credentials.json', false);

    // Request new access_token from Google API
    const access_token = await refreshGoogleAuthToken(token.refresh_token, credentials);

    // return if no access_token was received
    if (!access_token) return;

    // Update 'token.json' with new access_token
    token.access_token = access_token;
    saveJSON('/token.json', token);

    // Retry fetching with the newly generated access_token
    return await fetch(url, token);
}

async function refreshGoogleAuthToken(code, credentials) {
    const url = credentials.installed.token_uri;

    // Define params
    const values = {
        client_id: credentials.installed.client_id,
        client_secret: credentials.installed.client_secret,
        refresh_token: code,
        grant_type: 'refresh_token'
    };

    // Create URLSearchParams Object from the params
    const params = new URLSearchParams(values);

    // Try retrieving access_token
    try {
        return (await axios.post(url, params.toString())).data.access_token;
    } catch (err) {
        console.error('Failed to get new access_token');
        return;
    }
}

function getCache(url) {

    // Load saved cache
    const cache = loadJSON('/cache.json', false) || {};
    
    const name = (url.split('?')[0]).replaceAll('/', '.');

    // Do not continue if name is not in cache
    if (!cache[name]) return;

    // Do not continue if cache is empty
    if (!Object.keys(cache[name]).length) return;

    // Check if cache has expired
    const now = new Date();
    const expire = new Date(cache[name].expire);
    if (now.getTime() > expire.getTime()) {
        console.log("Cache out of date");
        return;
    }

    // console.log(cache[name]);

    console.log("Using cache for", name);

    // return cache data
    return cache[name];
}

const nonSafeCache = ["courseWork", "announcements"]

function saveCache(url, data) {
    // Do not continue if url is in nonSafeCache
    for (const i in nonSafeCache) {
        if (url.includes(nonSafeCache[i])) return;
    }

    // Do not continue if data is empty
    if (!data) return;

    // Convert name to storage use
    const name = (url.split('?')[0]).replaceAll('/', '.');

    // Set expiry date on cache
    data.expire = new Date(Date.now() + process.env.EXPIRE * 24 * 60 * 60 * 1000);
    
    console.log("Saving cache for", name);
    
    // Load saved cache
    const cache = loadJSON('/cache.json', false) || {};

    // Add new cache to object
    cache[name] = data;

    // Save updated save
    saveJSON('/cache.json', cache);
}

export default api;