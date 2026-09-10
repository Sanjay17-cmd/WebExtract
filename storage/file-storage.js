const fs = require("fs");

function saveHtml(path, html) {

    fs.writeFileSync(
        path,
        html
    );
}

module.exports = {
    saveHtml
};