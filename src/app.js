import express from "express";
import bodyParser from "body-parser";
import { MongoClient, ObjectId } from "mongodb";

const app = express();

app.use(bodyParser.json());

const connectionString = process.env.DATABASE_URL;
const [, db] = connectionString.match(/mongodb.net\/(.*)$/);

app.get('/', async (req, res) => {
    let client = null;
    try {
        client = new MongoClient(connectionString);
        const database = client.db(db);
        const records = database.collection('records');
        let filter = {}
        if ('player' in req.body) filter = { player: req.body.player };
        if ('_id' in req.body) filter = { _id: new ObjectId(req.body._id) };
        const result = await records.find(filter).toArray();
        return res.status(200).json(result)
    } finally {
        await client.close();
    }
});

app.post('/', async (req, res) => {
    if (!('player' in req.body)) return res.status(400).json({ message: "Missing field 'player'!" });
    if (!('score' in req.body)) return res.status(400).json({ message: "Missing field 'score'!" });
    const player = req.body.player;
    if (!player) return res.status(400).json({ message: "Field 'player' must not be empty!" });
    const score = Number.parseInt(req.body.score);
    if (!Number.isInteger(score)) return res.status(400).json({ message: "Field 'score' must be an integer!" });
    if (score < 0) return res.status(400).json({ message: "Field 'score' must be greater or iqual to 0!" });
    let client = null;
    try {
        client = new MongoClient(connectionString);
        const database = client.db(db);
        const records = database.collection('records');
        const { insertedId } = await records.insertOne({ player, score });
        return res.status(201).json({ insertedId });
    } finally {
        await client.close();
    }
});

app.delete('/', async (req, res) => {
    let client = null;
    try {
        client = new MongoClient(connectionString);
        const database = client.db(db);
        const records = database.collection('records');
        if (('_id' in req.body)) {
            const { acknowledged } = await records.deleteOne({ _id: new ObjectId(req.body._id) });
            return res.status(204).json({ acknowledged });
        }
        const { deletedCount } = await records.deleteMany(req.body);
        return res.status(204).json({ deletedCount });
    } finally {
        await client.close();
    }
});

app.put('/', async (req, res) => {
    let client = null;
    try {
        client = new MongoClient(connectionString);
        const database = client.db(db);
        const records = database.collection('records');
        if ('_id' in req.body) {
            const { _id, ...update } = req.body;
            const { acknowledged } = (await records.updateOne({ _id: new ObjectId(_id) }, { $set: update }));
            return res.status(204).json({ acknowledged });
        }
        if ('player' in req.body) {
            const { player, ...update } = req.body;
            const { matchedCount } = await records.updateMany({ player }, { $set: update });
            return res.status(204).json({ matchedCount });
        }
        if ('score' in req.body) {
            const score = Number.parseInt(req.body.score);
            if (!Number.isInteger(score)) return res.status(400).json({ message: "Field 'score' must be an integer!" });
            const { matchedCount } = await records.updateMany({}, { $set: { score } });
            return res.status(204).json({ matchedCount });
        }
        return res.sendStatus(422);
    } finally {
        await client.close();
    }
});

export default app;
