import express from 'express'
import connecctDB from './config/db.js'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import cookieParser from 'cookie-parser'

dotenv.config()
const app = express()
app.use(express.json())
app.use(cookieParser())
connecctDB();
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/api/auth', authRoutes)
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log('Example app listening on port 3000!')
})