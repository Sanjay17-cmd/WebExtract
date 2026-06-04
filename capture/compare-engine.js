const fs = require("fs");

const Diff = require("diff");

function compareHtml(

    htmlPathA,
    htmlPathB
) {

    const htmlA =
        fs.readFileSync(
            htmlPathA,
            "utf-8"
        );

    const htmlB =
        fs.readFileSync(
            htmlPathB,
            "utf-8"
        );

    return Diff.createPatch(

        "html",

        htmlA,

        htmlB
    );
}

module.exports = {
    compareHtml
};