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