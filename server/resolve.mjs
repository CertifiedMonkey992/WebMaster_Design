/* Registers resolve-hooks.mjs. Loaded with `node --import ./server/resolve.mjs`. */
import { register } from 'node:module'

register('./resolve-hooks.mjs', import.meta.url)
