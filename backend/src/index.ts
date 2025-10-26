import express from "express"
import { PORT } from "./config"
import routes from "./routes/index.router"
import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
//   origin: ['https://school-six-self.vercel.app'],
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get("/", (req, res) => {
  res.json({ message: "welcome to Todo Server" })
})
app.use("/api/v1", routes)


app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`)
})
export default app