import express from 'express';
import api from '../api.js';
import loadJSON from '../loadJSON.js';
import RSS from 'rss';
import urlify from '../urlify.js';

const router = express.Router();

router.get('/', (req,res)=>{
    res.redirect('/');
})

router.get('/:id', async (req,res)=>{
    const token = loadJSON('/token.json', false);
    res.type('application/xml');
    res.send(await loadFeed(token, req.params.id, res));
});

const loadFeed = async (token, id, res) =>{

    // Get list of all courses from API
    const {courses} = await api('courses?fields=courses.id,courses.name,courses.descriptionHeading,courses.alternateLink,courses.courseState,courses.ownerId');

    // Initialize course
    let course;

    // Loop through the courses to find the one we are looking for
    if (courses) courses.forEach(c => {
        if (c.id == id) {
            course = c;
        }
    })

    // Redirect to '/' if the course doesn't exist
    if (!course) {
        res.redirect('/');
        return;
    }

    // Get data from Google API
    const {courseWork} = await api(`courses/${id}/courseWork`);
    const {courseWorkMaterial} = await api(`courses/${id}/courseWorkMaterials`);
    const {announcements} = await api(`courses/${id}/announcements`)
    const {teachers} = await api(`courses/${id}/teachers?fields=teachers.userId,teachers.courseId,teachers.profile.name.fullName`);
    const {topic} = await api(`courses/${id}/topics?fields=topic.topicId,topic.courseId,topic.name`);
    // const owner = await api(`userProfiles/${course.ownerId}?fields=id,name.fullName`);

    // Create a RSS feed and return it
    return await genRSS(id, topic, course, announcements, courseWorkMaterial, courseWork, teachers);
}

const genRSS = async (id, topics, course, announcements, courseMaterials, works, teachers) => {

    // Get class owner name
    const owner = findFieldById(course.ownerId, 'userId', teachers)

    // Initialize RSS with  course details
    const feed = new RSS({
        title: course.name,
        description: course.descriptionHeading,
        id: course.id,
        generator: "Classroom-RSS",
        author: owner ? owner.profile.name.fullName : '',
    });

    // Add assignments to feed
    for (let i in works) {
        const work = works[i];
        
        // Find the teacher who uploaded the assignment
        const teacher = findFieldById(work.creatorUserId, 'userId', teachers);
        if (!teacher) return; // If it for some reason wasn't a teacher, just return


        // Prepare materials
        const materials = prepMaterials(work.materials);

        // Get topic name to categorize
        const topic = findFieldById(work.topicId, 'topicId', topics);

        feed.item({
            title: "Assignment: " + work.title,
            id: work.id,
            url: work.alternateLink,
            date: new Date(work.creationTime),
            author: teacher.profile.name.fullName,
            categories: [topic ? topic.name : ''],
            description: `
                ${work.description ? '<h2>Description:</h2>' : ''}
                ${work.description ?  urlify(work.description).replace(/\r\n|\n|\r/gm, '<br />') : ''}
                ${work.description && materials[0] ? '<hr>' : ''}
                ${materials[0] ? '\n<h3>Material:</h3>' : ''}
                ${materials.join(' ')}
            `
            // custom_elements: materials,
        });
    }

    // Add announcements to feed
    if (announcements) announcements.forEach(announcement => {

        // Only show announcements from teachers
        const teacher = findFieldById(announcement.creatorUserId, 'userId', teachers);
        if (!teacher) return; // If it for some reason wasn't a teacher, just return;

        const materials = prepMaterials(announcement.materials);

        feed.item({
            title: "Announcement: " + announcement.text.substring(0, 30) + "...",
            id: announcement.id,
            url: announcement.alternateLink,
            date: new Date(announcement.creationTime),
            author: teacher.profile.name.fullName,
            description: `
                ${announcement.text ? '<h2>Message:</h2>' : ''}
                ${announcement.text ? urlify(announcement.text).replace(/\r\n|\n|\r/gm, '<br />') : ''}
                ${materials.join('')}
            `
            // custom_elements: materials,
        });

    })

    // Add materials to feed
    for (const i in courseMaterials) {
        const material = courseMaterials[i];
        
        // Find the teacher who uploaded the material
        const teacher = findFieldById(material.creatorUserId, 'userId', teachers);
        if (!teacher) return; // If it for some reason wasn't a teacher, just return

        // Prepare materials
        const materials = prepMaterials(material.materials);

        // Get topic name to categorize
        const topic = findFieldById(material.topicId, 'topicId', topics);

        feed.item({
            title: "Material: " + material.title,
            id: material.id,
            url: material.alternateLink,
            date: new Date(material.creationTime),
            author: teacher.profile.name.fullName,
            categories: [topic ? topic.name : ''],
            description: `
                ${material.description ? '<h2>Description:</h2>' : ''}
                ${material.description ? urlify(material.description).replace(/\r\n|\n|\r/gm, '<br />') : ''}
                ${material.description && materials[0] ? '<hr>' : ''}
                ${materials[0] ? '\n<h3>Material:</h3>' : ''}
                ${materials.join('')}
            `
        });
    }

    // return rss feed
    return feed.xml().replace("<link>http://github.com/dylang/node-rss</link>", `<link>${course.alternateLink}</link>`);
}

// Find a specific field from list
const findFieldById = (id, fieldName, list) => {
    let field;
    list.forEach(l => {
        if (id == l[fieldName]) field = l;
    });
    return field;
}

const prepMaterials = (materials) => {
    let mats = [];
    for (const i in materials) {
        
        // Handle what material type it is
        if (materials[i].driveFile) {
            // Handle Drive files
            const file = materials[i].driveFile.driveFile

            let thumbnailUrl = file.thumbnailUrl;
            
            const thumbnail = thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${file.title || file.alternateLink.split('/')[-1]}"></img>` : '';

            mats.push(`
                <a href="${materials[i].driveFile.driveFile.alternateLink}">
                    <p>Google Drive: ${materials[i].driveFile.driveFile.title}</p>
                    ${thumbnail}
                </a>
            `)
        } else if (materials[i].link) {
            // Handle links
            const link = materials[i].link;
            let fileName = link.url.split('/');
            // fileName = fileName[fileName.length-1];
            // const thumbnail = link.thumbnailUrl ? `<img src="${link.thumbnailUrl}" alt="${link.title || link.url.split('/')[-1]}"></img>` : '';
            
            
            mats.push(`
                <a href="${link.url}">
                    <p>Link: ${link.title || link.url}</p>
                </a>
            `)
        } else if (materials[i].youtubeVideo) {
            // Handle Youtube videos
            const video = materials[i].youtubeVideo;
            const id = video.alternateLink.split('watch?v=')[1];

            mats.push(`
                <a href="${video.alternateLink}"><p>Youtube: ${video.title || ' '}</p></a>
                <iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>
            `)
        }
    }


    // TODO: Maybe add support for form materials
    // https://developers.google.com/classroom/reference/rest/v1/Material


    return mats;
}

export default router;