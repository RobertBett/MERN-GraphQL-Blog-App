
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err,'Clear Image error'));
};
exports.deleteFile = deleteFile;