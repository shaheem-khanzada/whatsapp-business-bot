import { Request, Response } from 'express'
import { waManager } from '../../whatsapp/WhatsAppManager'
import { Boom } from '@hapi/boom'
import { waitForConnected } from '../../util'

export const loginClient = async (req: Request, res: Response) => {
  const { phone } = req.body
  await waManager.login(req.params.id, phone)
  const client = waManager.get(req.params.id)

  if (!client) {
    return res.status(404).json({
      success: false,
      message: `WhatsApp client '${req.params.id}' not found.`,
    })
  }

  await waitForConnected(client)

  res.json({ 
    ok: true,
    status: client.getState().status,
  })
}

export const sendMessage = async (req: Request, res: Response) => {
  console.log("sendMessage", JSON.stringify(req.body, null, 2))
  try {
    const clientId = req.params.id
    const { to, text } = req.body 
    const file: any = req.files?.file

    console.log("to", to)

    // Check if client exists
    if (!waManager.getActiveClients().includes(clientId)) {
      return res.status(404).json({
        success: false,
        message: `WhatsApp client '${clientId}' not found. Please initialize the client first.`,
      })
    }

    // Check if client is ready
    const isReady = await waManager.isClientReady(clientId)
    if (!isReady) {
      return res.status(422).json({
        success: false,
        message: `WhatsApp client '${clientId}' is not ready. Please ensure the client is connected.`,
      })
    }

    if (!file || !text) {
      return res.status(400).json({
        success: false,
        message: 'File or text is required',
      })
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number (to) is required',
      })
    }

    const client = waManager.get(clientId)
    if (!client) {
      return res.status(404).json({
        success: false,
        message: `WhatsApp client '${clientId}' not found.`,
      })
    }

    let message: any

    if (file) {
      message = await client.sendFile(
      `${to.replace('+', '')}@s.whatsapp.net`,
      file.data,
      file.name,
      file.mimetype,
      text
    )
  } else {
    message = await client.sendText(
      `${to.replace('+', '')}@s.whatsapp.net`,
      text
    )
  }

    res.status(200).json({
      success: true,
      message: `message sent successfully to ${to}`,
      data: {
        message: message,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {

  console.error('Send file error:', error)
  // Already retried once → fail
  if (req._waRetry) {
    return res.status(500).json({
      success: false,
      message: 'Failed after retry',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

    const client = waManager.get(req.params.id)
    if (client) {
      const success = await client.handleDisconnect(error as Boom | Error | undefined)
      if (success) {
        // req._waRetry = true
        // sendMessage(req, res)
        // return
      }
    }
    console.error('Send file error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const logoutClient = async (req: Request, res: Response) => {
  await waManager.logout(req.params.id)
  res.json({ loggedOut: true })
}

export const getStatus = async (req: Request, res: Response) => {
  const clientId = req.params.id
  const client = waManager.get(clientId)
  if (!client) {
    return res.status(200).json({
      success: false,
      message: `WhatsApp client '${clientId}' not found.`,
    })
  }
  res.json({ status: client.getState().status })
}