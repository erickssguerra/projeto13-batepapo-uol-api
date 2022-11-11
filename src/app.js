import express, { json } from "express"
import cors from "cors"
import dotvenv from "dotenv"
import { MongoClient } from "mongodb"
import joi from "joi"

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

// validation schemas
const participantSchema = joi.object({
    name: joi.string().required()
})

// route participants
server.post("/participants", async (req, res) => {
    const name = req.body.name

    const validation = participantSchema.validate({ name }, { abortEarly: false })
    if (validation.error) {
        const messages = validation.error.details.map((detail) => detail.message)
        res.status(422).send(messages)
        return
    }

    try {
        const participants = await colParticipants.find({}).toArray()
        if (!participants.find(p => p.name === name)) {
            await colParticipants.insertOne({ name, lastStatus: Date.now() })
            res.sendStatus(201)
            return
        }
        else {
            res.status(409).send("Usuário já cadastrado")
            return
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
    console.log(`You're connect in port 5000!`)
})