// Runs a node script with the variables of an env file added (the build secret), without `node --env-file`, which Next
// passes on to its build workers through NODE_OPTIONS, where Node refuses it:
//   node scripts/vps/with-env.mjs /run/secrets/env node_modules/next/dist/bin/next build
import fs from 'node:fs'
import { parseEnv } from 'node:util'
import { spawnSync } from 'node:child_process'

const [file, ...cmd] = process.argv.slice(2)
const env = { ...process.env, ...parseEnv(fs.readFileSync(file, 'utf8')) }
const r = spawnSync(process.execPath, cmd, { stdio: 'inherit', env })
process.exit(r.status ?? 1)
