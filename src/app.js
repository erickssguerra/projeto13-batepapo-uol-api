import express, { json } from "express"
import cors from "cors"
import dotvenv from "dotenv"
import { MongoClient } from "mongodb"
import joi from "joi"
import dayjs from "dayjs"

// configs
dotvenv.config()
const mongoClient = new MongoClient(process.env.MONGO_URI)
try {
    await mongoClient.connect()
    console.log("MongoDB conected!")
} catch (err) {
    console.log(err)
}
const dbBatepapoUOL = mongoClient.db("batepapo-uol-api")
const server = express()
server.use(cors())
server.use(json())

// collections
const colParticipants = dbBatepapoUOL.collection("participants")
const colMessages = dbBatepapoUOL.collection("messages")

// validation schemas
const participantSchema = joi.object({
    name: joi.string().required()
})

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message")
})

// route participants
server.post("/participants", async (req, res) => {
    const { name } = req.body

    const validation = participantSchema.validate({ name }, { abortEarly: false })
    if (validation.error) {
        const errorMessage = validation.error.details.map((detail) => detail.message)
        res.status(422).send(errorMessage)
        return
    }

    try {
        const participants = await colParticipants.find({}).toArray()
        if (!participants.find(p => p.name === name)) {
            await colParticipants.insertOne({ name, lastStatus: Date.now() })
            await colMessages.insertOne({
                from: name,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: dayjs().format("HH:mm:ss")
            })
            res.sendStatus(201)
            return
        }
        else {
            res.status(409).send({ message: "Usuário já cadastrado" })
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

// route messages
server.get("/messages", async (req, res) => {
    const { user } = req.headers
    const limit = parseInt(req.query.limit)

    try {
        const filteredMessages = await colMessages
            .find({
                $or: [
                    { "from": user },
                    { "type": "message" },
                    { "to": user },
                    { "to": "Todos" }
                ]
            })
            .toArray()
        if (limit || limit > 0) {
            res.status(200).send(filteredMessages.slice(-limit))
            return
        }
        else {
            res.status(200).send(filteredMessages)
            return
        }
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

server.post("/messages", async (req, res) => {
    const { to, text, type } = req.body
    const from = req.headers.user

    const validation = messageSchema.validate({ to, text, type }, { abortEarly: false })

    if (validation.error) {
        const errorMessage = validation.error.details.map((detail) => detail.message)
        res.status(422).send(errorMessage)
        return
    }

    try {
        const foundSender = await colParticipants.findOne({ name: from })
        if (!foundSender) {
            res.status(422).send("Você não está mais logado!")
            return
        }

        await colMessages.insertOne({
            from,
            to,
            text,
            type,
            time: dayjs().format("HH:mm:ss")
        })
        res.sendStatus(201)
        return
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
        return
    }
})

// route status
server.post("/status", async (req, res) => {
    const { user } = req.headers
    try {
        const isUserOnline = await colParticipants.findOne({ name: user })
        if (!isUserOnline) {
            res.status(404).send({ message: "Usuário não está online." })
        }
        else {
            await colParticipants.updateOne(
                { name: user }, // filter 
                { $set: { lastStatus: Date.now() } } // updated field
            )
            res.status(200).send({ message: "Status atualizado." })
        }
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

// connection
server.listen(5000, () => {
    console.log("Conected in port 5000!")
})