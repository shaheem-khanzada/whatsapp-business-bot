import { Router } from 'express'
import {
  loginClient,
  sendMessage,
  logoutClient,
  getStatus,
} from '../controllers/clients.controller'

const router = Router()

router.post('/:id/login', loginClient)
router.post('/:id/send-message', sendMessage)
router.post('/:id/logout', logoutClient)
router.get('/:id/status', getStatus)

export default router
