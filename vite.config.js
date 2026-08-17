import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dictionaryAudioHandler from './api/dictionary-audio.js'

function dictionaryAudioPlugin() {
  return {
    name: 'dictionary-audio-local',
    configureServer(server) {
      server.middlewares.use('/api/dictionary-audio', async (req, res, next) => {
        try {
          const url = new URL(
            req.url || '',
            `http://${req.headers.host || 'localhost'}`
          )

          req.query = Object.fromEntries(url.searchParams.entries())

          const response = {
            statusCode: 200,

            status(code) {
              this.statusCode = code
              return this
            },

            setHeader(name, value) {
              res.setHeader(name, value)
            },

            json(data) {
              res.statusCode = this.statusCode
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            },

            end() {
              res.statusCode = this.statusCode
              res.end()
            },
          }

          await dictionaryAudioHandler(req, response)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    dictionaryAudioPlugin(),
  ],
  base: process.env.VERCEL ? '/' : '/English-simply/',
})