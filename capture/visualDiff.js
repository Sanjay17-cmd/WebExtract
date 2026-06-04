const fs = require("fs");

const PNG =
    require("pngjs").PNG;

const {

    default: pixelmatch

} = require(
    "pixelmatch"
);

async function createVisualDiff(

    imageA,

    imageB,

    outputPath

) {

    const img1 =
        PNG.sync.read(

            fs.readFileSync(
                imageA
            )
        );

    const img2 =
        PNG.sync.read(

            fs.readFileSync(
                imageB
            )
        );

    const width =
        Math.min(

            img1.width,

            img2.width
        );

    const height =
        Math.min(

            img1.height,

            img2.height
        );

    const diff =
        new PNG({

            width,

            height
        });

    const changedPixels =
    pixelmatch(

        img1.data,

        img2.data,

        diff.data,

        width,

        height,

        {

            threshold: 0.1,

            includeAA: true,

            alpha: 0.5,

            diffColor: [

                0,

                255,

                0
            ],

            diffColorAlt: [

                255,

                0,

                0
            ]
        }
    );

    fs.writeFileSync(

        outputPath,

        PNG.sync.write(
            diff
        )
    );

    return {

        changedPixels
    };
}

module.exports = {

    createVisualDiff
};