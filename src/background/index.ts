import { toAppError } from '../core/errors'
import { createLogger } from './logger/logger'
import { initBackground, registerMessaging } from './messaging'

const logger = createLogger('background')

initBackground()
  .then(() => {
    registerMessaging()
  })
  .catch((e) => {
    logger.error('Service worker init failed', { error: toAppError('storage', e) })
  })
