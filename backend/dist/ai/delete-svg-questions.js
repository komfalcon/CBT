"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
async function deleteSvgQuestions() {
    const uri = 'mongodb+srv://noreplyaurikrex_db_user:cbt-aurikex2026@cbt-aurikex.ydvflr6.mongodb.net/jamb_cbt?retryWrites=true&w=majority';
    const client = new mongodb_1.MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const count = await db.collection('questions').countDocuments({
            source: 'ai_generated',
            diagram_svg: { $ne: null }
        });
        console.log(`Found ${count} AI-generated questions with SVG diagrams.`);
        if (count > 0) {
            const result = await db.collection('questions').deleteMany({
                source: 'ai_generated',
                diagram_svg: { $ne: null }
            });
            console.log(`Successfully deleted ${result.deletedCount} questions.`);
        }
        const remainingTextOnly = await db.collection('questions').countDocuments({ source: 'ai_generated' });
        console.log(`Remaining text-only AI questions: ${remainingTextOnly}`);
    }
    catch (err) {
        console.error('Error during deletion:', err);
    }
    finally {
        await client.close();
        process.exit(0);
    }
}
deleteSvgQuestions();
//# sourceMappingURL=delete-svg-questions.js.map