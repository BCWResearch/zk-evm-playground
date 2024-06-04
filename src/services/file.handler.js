require('dotenv').config();
let fs = require("fs");
let writeStream;
let fileName;


class FileHandler {

    createFile = async (__filename) => {
        fileName = `./${__filename}`;
        const createStream = fs.createWriteStream(fileName);
        createStream.end();
    }

    setFile = (__filename) => {
        fileName = `./${__filename}`;
    }

    writeFile = async (row) => {
        const csvReady = row.join(',')+ '\n';
        fs.readFileSync(fileName, "utf8");
         fs.appendFile(fileName, csvReady, (err) => {
            if (err) {
                console.log(`Error writing to ${fileName}`);
                console.log(err);
            }
        });
    }

    closeFile = async () => {
        const file_descriptor = fs.openSync(fileName);
        // Close the file descriptor 
        fs.close(file_descriptor, (err) => { 
            if (err) 
            console.error('Failed to close file', err); 
            else { 
            console.log("\n> File Closed successfully"); 
            } 
        }); 
    }

}

module.exports = Object.freeze(new FileHandler());
