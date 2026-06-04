const path = require("path");
require("dotenv").config();
console.log(
    "Gemini Key:",
    process.env.GEMINI_API_KEY
);

let clientPromise = null;

async function getClient() {
    if (!clientPromise) {
        clientPromise = import("@google/genai").then(({ GoogleGenAI }) => {
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (!apiKey) {
                throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY");
            }
            return new GoogleGenAI({ apiKey });
        });
    }
    return clientPromise;
}

function buildPrompt(payload) {
    return `
You are summarizing webpage comparison results.

Rules:
- Be concise.
- Ignore IDs, timestamps, and noisy technical fields.
- Focus only on visible user-facing changes.
- Return JSON only.

Input:
${JSON.stringify(payload, null, 2)}
`;
}

async function summarizeComparison(payload) {
console.log(
    "\n===== GEMINI PAYLOAD =====\n"
);

console.dir(
    payload,
    {
        depth: null
    }
);

    const ai = await getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: buildPrompt(payload),
        config: {
            temperature: 0.2,
            responseFormat: {
                text: {
                    mimeType: "application/json",
                    schema: {
                        type: "object",
                        properties: {
                            summary_text: { type: "string" },
                            risk_level: {
                                type: "string",
                                enum: ["low", "medium", "high"]
                            },
                            key_points: {
                                type: "array",
                                items: { type: "string" }
                            },
                            user_visible_changes: {
                                type: "array",
                                items: { type: "string" }
                            }
                        },
                        required: ["summary_text", "risk_level", "key_points", "user_visible_changes"],
                        additionalProperties: false
                    }
                }
            }
        }
    });
    console.log(
    "\n===== RAW GEMINI RESPONSE =====\n"
);

console.dir(
    response,
    {
        depth: null
    }
);

    console.log(
    "\n===== RESPONSE TEXT =====\n"
);

console.log(
    response.text
);

const parsed =
    JSON.parse(
        response.text
    );

console.log(
    "\n===== PARSED JSON =====\n"
);

console.dir(
    parsed,
    {
        depth: null
    }
);

return parsed;
}

module.exports = {
    summarizeComparison
};