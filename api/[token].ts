import { NowRequest, NowResponse } from '@vercel/node'
import axios from 'axios'
import { getUpdateHandler } from 'vercel-telegram-bot-api'
import { getAuthenticatedContext } from 'vercel-telegram-bot-api/lib/context'
import { endWithText } from 'vercel-telegram-bot-api/lib/reply'
import { ParseMode } from 'vercel-telegram-bot-api/lib/types/ParseMode'
import { TelegramContext } from 'vercel-telegram-bot-api/lib/types/TelegramContext'

type ShouldIDeploy = {
  timezone: string
  shouldideploy: boolean
  message: string
}

const getMessage = () =>
  axios
    .get<ShouldIDeploy>('https://shouldideploy.today/api')
    .then(({ data }) => data)

const sendMessage = (ctx: TelegramContext) => (shouldIDeploy: ShouldIDeploy) =>
  endWithText(`**${shouldIDeploy.message}**`, ctx, {
    reply: true,
    parseMode: ParseMode.MarkdownV1
  })

const getAndSendMessage = (ctx: TelegramContext) =>
  getMessage().then(sendMessage(ctx))

export default (req: NowRequest, res: NowResponse) => {
  const token = process.env.TELEGRAM_TOKEN

  if (!token) return res.status(500).json({ message: 'No TELEGRAM_TOKEN' })

  const handleUpdates = getUpdateHandler({
    commands: {
      deploy: async (_, ctx) => getAndSendMessage(ctx)
    },
    text: (message, ctx) => {
      if (!message.text?.includes('deploy')) return

      return getAndSendMessage(ctx)
    }
  })

  return getAuthenticatedContext(token, req, res)
    .then(handleUpdates)
    .catch((err) =>
      res.status(500).json({ message: err.message, stackTrace: err.stack })
    )
}
