import express from 'express'
import fileUpload from 'express-fileupload'
import clientsRoutes from './api/routes/clients.routes'
import cors from 'cors'
const app = express()

app.use(express.json())
app.use(fileUpload())
app.use(cors({ origin: '*' }))

app.use('/clients', clientsRoutes)

export default app
