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

    const cropped1 =
        new PNG({

            width,

            height
        });

    const cropped2 =
        new PNG({

            width,

            height
        });

    PNG.bitblt(

        img1,

        cropped1,

        0,

        0,

        width,

        height,

        0,

        0
    );

    PNG.bitblt(

        img2,

        cropped2,

        0,

        0,

        width,

        height,

        0,

        0
    );

    const diff =
        new PNG({

            width,

            height
        });

    const changedPixels =
        pixelmatch(

            cropped1.data,

            cropped2.data,

            diff.data,

            width,

            height,

            {

                threshold: 0.1,

                includeAA: true,

                alpha: 0.5,

                diffColor: [

                    255,

                    0,

                    0
                ],

                diffColorAlt: [

                    0,

                    255,

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