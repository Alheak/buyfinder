import Tokens from '../models/Token'

export async function getToken (token: string) {
  const tokenDoc = await Tokens.findOne({ token })
  const now = new Date().getTime()
  const tokenCreationDate = new Date(tokenDoc.createdAt).getTime()
  const tokenExpirationDate = tokenCreationDate + (1000 * 60 * 10)

  if (now > tokenExpirationDate) {
    await Tokens.deleteOne({ token })

    return null
  }

  return tokenDoc
}
