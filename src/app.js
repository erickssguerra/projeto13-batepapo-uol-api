import express, { json } from "express"
import cors from "cors"
import dotvenv from "dotenv"
import { MongoClient } from "mongodb"

// configs
dotvenv.config()
const mongoClient = new MongoClient(process.env.MONGO_URI)
await mongoClient.connect()
const dbBatepapoUOL = mongoClient.db("batepapo-uol-api")
const app = express()
app.use(cors())
app.use(json())

app.post("/participants", async (req, res) => {
    const name = req.body.name
    if (!name) {
        res.sendStatus(422)
        return
    }
    try {
        const participants = await dbBatepapoUOL.collection("participants").find({}).toArray()
        if (!participants.find(p => p.name === name)) {
            await dbBatepapoUOL.collection("participants").insertOne({ name: name, lastStatus: Date.now() })
            res.sendStatus(201)
        }
        else {
            res.send("Usuário já cadastrado").status(409)
        }
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get("/participants", async (req, res) => {
    try {
        const participants = await dbBatepapoUOL.collection("participants").find({}).toArray()
        res.send(participants)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

// connection
app.listen(5000, () => {
    console.log("You're connect to port 5000!")
})