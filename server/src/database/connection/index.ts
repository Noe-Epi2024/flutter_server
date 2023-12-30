import mongoose from 'mongoose';

export async function mongo() {
    const uri = process.env.MONGO_URI || '';
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true } as any);

    const db = mongoose.connection;

    try {
        db.once('open', () => {
            console.log("Connected successfully to MongoDB");
            // listDatabases();
        });

        async function listDatabases() {
            const admin = mongoose.connection.db.admin();
            const databasesList = await admin.listDatabases();
            console.log("Databases:");
            databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
        }
    } catch (e) {
        console.error(e);
    }
}