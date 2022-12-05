import fs from 'fs';

// Load a JSON file
export default (path, exit=true) => {
    /*
    path: 'path to file'
    exit: 'whether or not it should exit if file not found'
    */
    let json;
    try {
        json = JSON.parse(fs.readFileSync(new URL(process.cwd() + path, import.meta.url)));
    } catch (err) {
        if (exit) {
            console.log(`Did not find '.${path}'.`);
            console.log('Exiting');
            process.exit()
        }
    }
    return json;
}