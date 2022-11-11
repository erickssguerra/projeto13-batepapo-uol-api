import express, { json } from "express"
import cors from "cors"
import dotvenv from "dotenv"
import { MongoClient } from "mongodb"

// configs
dotvenv.config()
const mongoClient = new MongoClient(process.env.MONGO_URI)
try {
    await mongoClient.connect()
    console.log("MongoDB Conected!")
} catch (err) {
    console.log(err)
}
const dbBatepapoUOL = mongoClient.db("batepapo-uol-api")
const colParticipants = dbBatepapoUOL.collection("participants")
const server = express()
server.use(cors())
server.use(json())

server.post("/participants", async (req, res) => {
    const name = req.body.name
    if (!name) {
        res.sendStatus(422)
        return
    }
    try {
        const participants = await colParticipants.find({}).toArray()
        if (!participants.find(p => p.name === name)) {
            await colParticipants.insertOne({ name, lastStatus: Date.now() })
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

server.get("/participants", async (req, res) => {
    try {
        const participants = await colParticipants.find({}).toArray()
        res.send(participants)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

// connection
server.listen(5000, () => {
    console.log("You're connect to port 5000!")
})