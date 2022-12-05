import express from 'express';
import loadJSON from '../loadJSON.js';
import flat from 'flat';
import saveJSON from '../saveJSON.js';

const router = express.Router();

router.get('/', async (req,res)=>{
    const cache = flat.unflatten(loadJSON('/cache.json', false));
    if (!cache || !Object.keys(cache).length) {
        res.redirect('/');
        return;
    }
    const teachers = getTeachers(cache);
    const topics = getTopics(cache);

    const list = {
        courses: cache.courses ? cache.courses.courses : undefined,
        teachers: teachers,
        topics: topics,
        userProfiles: cache.userProfiles
    }

    res.render('cache', {cache: list});
})

router.get('/get', (req,res)=>{
    const cache = sortCache();

    res.json(cache)
    // res.json(sortCache(cache))
})

router.post('/clear/userProfiles', (req,res)=>{
    // Load cache
    const cache = loadJSON('/cache.json', false);
    // If cache doesn't exist, just redirect back
    if (!cache) res.redirect('/cache');

    let clear = [];

    // Loop through body and delete the appropriate cache
    for (let i in req.body) {
        // Delete from cache if exist
        if (cache[`userProfiles.${i}`]) {
            delete cache[`userProfiles.${i}`];
            clear.push(`userProfiles.${i}`);
        }
    }

    console.log("Cleared cache: " + clear.join(' '));

    // Save changes to cache
    saveJSON('/cache.json', cache);

    res.redirect('/cache');
})


// Handle clearing cache for courses
router.post('/clear/courses', (req,res)=> {
    // Do nothing if body is empty
    if (!Object.keys(req.body).length) {
        res.redirect('/cache');
        return;
    }

    // Load cache
    const cache = loadJSON('/cache.json', false);
    // If cache doesn't exist, just redirect back
    if (!cache) res.redirect('/cache');

    const clear= [];

    // Check if courses are selected
    if (req.body.courses) {
        delete cache.courses;
        clear.push('courses');
    }

    // Check if teachers are selected
    if (req.body.teachers) {
        // Get list of courseId's where teachers are stored
        const teachersList = getTeachers(flat.unflatten(cache));

        // Go through and remove teachers from all those places
        for (let i = 0; i < teachersList.length; i++) {
            delete cache[`courses.${teachersList[i]}.teachers`];
        }
        clear.push('teachers');
    }

    // Check if topics are selected
    if (req.body.topics) {
        // Get list of courseId's where teachers are stored
        const topicsList = getTopics(flat.unflatten(cache));

        // Go through and remove teachers from all those places
        for (let i = 0; i < topicsList.length; i++) {
            delete cache[`courses.${topicsList[i]}.topics`];
        }
        clear.push('topics');
    }

    console.log("Cleared cache: " + clear.join(' '));

    saveJSON('/cache.json', cache);

    res.redirect('/cache');
});

const findFieldByKey = (keys, key, list)=>{
    let fields = [];
    for (const i in keys) {
        for (const j in list) {
            if (j == keys[i]) fields.push(list[j][key]);
        }
    }
    return fields;
};

const sortCache = () =>{
    const cache = loadJSON('/cache.json', false) || {};
    const sortedCache = flat.unflatten(cache);
    const teachersList = getTeachers(sortedCache);
    const topicsList = getTopics(sortedCache);

    let courses = {};
    courses.courses = sortedCache.courses ? sortedCache.courses.courses : [];

    courses.teachers = findFieldByKey(teachersList, 'teachers', sortedCache.courses);
    courses.topics = findFieldByKey(topicsList, 'topics', sortedCache.courses);

    return {courses: courses, userProfiles: sortedCache.userProfiles};
}

const getTeachers = (cache) =>{
    let teachers = [];
    for (const i in cache.courses) {
        if (cache.courses[i].teachers)
            if (checkExpiry(cache.courses[i].teachers.expire)) teachers.push(i);
    }
    return teachers.length > 0 ? teachers : undefined;
}

const getTopics = (cache) =>{
    let topics = [];
    for (const i in cache.courses) {
        if (cache.courses[i].topics)
            if (checkExpiry(cache.courses[i].topics.expire)) topics.push(i);
    }
    return topics.length > 0 ? topics : undefined;
}

const checkExpiry = (expire) =>{
    const now = new Date();
    expire = new Date(expire);
    if (now.getTime() > expire.getTime()) {
        return false;
    }
    return true;
}

export default router;