function extractDomTree() {

    const nodes = [];

    let nodeId = 0;

    // =====================================
    // WALK DOM
    // =====================================

    function walk(

        element,

        parentId = null,

        depth = 0
    ) {

        // ---------------------------------
        // CURRENT NODE ID
        // ---------------------------------

        const currentId = nodeId++;

        // ---------------------------------
        // ATTRIBUTES
        // ---------------------------------

        const attributes = {};

        for (

            const attr of element.attributes || []

        ) {

            attributes[attr.name] =
                attr.value;
        }

        // ---------------------------------
        // NODE OBJECT
        // ---------------------------------

        nodes.push({

            id: currentId,

            parentId,

            depth,

            tag:

                element.tagName
                ?.toLowerCase() || "",

            idAttr:

                element.id || "",

            classAttr:

                element.className || "",

            text:

                (
                    element.innerText || ""
                )

                .trim()

                .slice(0, 120),

            attributes,

            visible:

                !!(

                    element.offsetWidth ||

                    element.offsetHeight
                )
        });

        // ---------------------------------
        // CHILDREN
        // ---------------------------------

        for (

            const child of element.children || []

        ) {

            walk(

                child,

                currentId,

                depth + 1
            );
        }
    }

    // =====================================
    // START FROM HTML ROOT
    // =====================================

    walk(

        document.documentElement
    );

    return nodes;
}

module.exports = {
    extractDomTree
};