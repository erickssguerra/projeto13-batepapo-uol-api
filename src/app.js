import express from "express"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())


app.listen(5000, () => {
    console.log("You're connect to port 5000!")
})
