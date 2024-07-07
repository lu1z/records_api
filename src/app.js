import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

let id = 0;
let db = [];

app.get('/', (req, res) => res.status(200).json(db));

app.post('/', (req, res) => {
    if (!('player' in req.body)) return res.status(400).json({ message: "Missing field 'player'!" });
    if (!('score' in req.body)) return res.status(400).json({ message: "Missing field 'score'!" });
    const player = req.body.player;
    if (!typeof player === 'string') return res.status(400).json({ message: "Field 'player' must be an string!" });
    if (!player) return res.status(400).json({ message: "Field 'player' must not be empty!" });
    const score = Number.parseInt(req.body.score);
    if (!Number.isInteger(score)) return res.status(400).json({ message: "Field 'score' must be an integer!" });
    if (score < 0) return res.status(400).json({ message: "Field 'score' must be greater or iqual to 0!" });
    const record = { id, player, score };
    db.push(record);
    id++;
    return res.status(201).json(record)
});

app.delete('/', (req, res) => {
    if (('wipe' in req.body)) {
        db = [];
        return res.sendStatus(204);
    }
    if (('id' in req.body)) {
        const id = Number.parseInt(req.body.id);
        const removed = db.splice(db.findIndex((r) => id === r.id), 1);
        return res.status(204).json(removed)
    }
    if (('player' in req.body)) {
        db = db.filter((r) => req.body.player !== r.player);
        return res.sendStatus(204)
    }
    return res.status(400).json({ message: "Failed!" });
});

export default app;
