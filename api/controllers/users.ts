import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'
import Users from '../models/User'
import Tokens from '../models/Token'
import connectDB from '../utils/connectDB'
import { User } from '../../types/User'
import sendMail from '../utils/sendMail'

connectDB()

export async function getUser (email: string) {
  try {
    const user = await Users.findOne({ email })
  
    return user
  } catch (error) {
    console.error('An error occured trying to get the user', error)

    throw new Error('An error occured trying to get the user')
  }
}

export async function createUser (email: string, password: string) {
  try {
    const user = await getUser(email)

    if (user) throw new Error('Email already in use')

    const token = nanoid()

    const confirmUrl = `${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/signup/confirm/${token}`

    const confirmationEmail = {
      subject: "buyfinder - Account activation",
      text: `
        Hello,

        Thank you for creating an account on buyfinder. To activate your account, please visit the url below:

        ${confirmUrl}
      `,
      html: `
        Hello,<br />
        <br />
        Thank you for creating an account on buyfinder. To activate your account, please visit the url below:<br />
        <br />
        <a href="${confirmUrl}">${confirmUrl}</a>
      `
    }
    
    const userInstance = await Users.create({ email, password: await bcrypt.hash(password, 10), activated: false, token })

    await sendMail(confirmationEmail, userInstance)

    return userInstance
  } catch (error) {
    console.error('An error occured trying to create the user', error)

    throw new Error('An error occured trying to create the user')
  }
}

export async function confirmUser (token: string) {
  try {
    const user = await Users.findOne({ token })

    if (!user) throw new Error(`No user with this token: ${token}`)

    user.activated = true

    await user.save()
  } catch (error) {
    console.error('An error occured trying to confirm the user', error)

    throw new Error('An error occured trying to confirm the user')
  }
}

export async function signIn (email: string, password: string) {
  try {
    const user = await getUser(email)

    if (!user || !(await bcrypt.compare(password, user.password))) throw new Error('Invalid credentials')

    return user
  } catch (error) {
    console.error('An error occured trying to sign in the user', error)

    throw new Error('An error occured trying to sign in the user')
  }
}

export async function passwordReset (user: User) {
  try {
    const token = nanoid()

    await Tokens.create({ user: user._id, token })

    const resetUrl = `${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/signin/reset/${token}`

    const email = {
      subject: "buyfinder - Password Reset",
      text: `
        Hello,

        A password reset has been requested. To proceed, visit the link below within 10 minutes. If you haven't made this request, ignore this email.

        ${resetUrl}
      `,
      html: `
        Hello,<br />
        <br />
        A password reset has been requested. To proceed, visit the link below within 10 minutes. If you haven't made this request, ignore this email.<br />
        <br />
        <a href="${resetUrl}">${resetUrl}</a>
      `
    }

    await sendMail(email, user)
  } catch (error) {
    console.error('An error occured trying to request a password reset', error)

    throw new Error('An error occured trying to request a password reset')
  }
}

export async function resetPassword (token: string, password: string) {
  try {
    const tokenDoc = await Tokens.findOne({ token })

    if (!tokenDoc) throw new Error('Invalid token.')

    const now = new Date().getTime()
    const tokenCreationDate = new Date(tokenDoc.createdAt).getTime()
    const tokenExpirationDate = tokenCreationDate + (1000 * 60 * 10)

    if (now > tokenExpirationDate) {
      await Tokens.deleteOne({ token })

      throw new Error('Invalid token.')
    }

    const user = await Users.findOne({ _id: tokenDoc.user })
        
    if (!user) throw new Error('Invalid token.')
        
    user.password = await bcrypt.hash(password, 10)
        
    await user.save()
        
    await Tokens.deleteOne({ _id: tokenDoc._id })
  } catch (error) {
    console.error('An error occured trying to reset the password', error)

    throw new Error('An error occured trying to reset the password')
  }
}

export async function changeEmail (user: User, newEmail: string, password: string) {
  try {
    const userInstance = await Users.findOne({ email: user.email })

    if (!userInstance || !(await bcrypt.compare(password, userInstance.password))) throw new Error('Invalid credentials')

    const emailExists = await Users.findOne({ email: newEmail })

    if (emailExists) throw new Error('Email already in use')

    const token = nanoid()

    await Tokens.create({ user: user._id, token, data: newEmail })

    const confirmationLink = `${process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DEV_APP_URL : process.env.NEXT_PUBLIC_PROD_APP_URL}/profile/email/change/${token}`

    const email = {
      subject: "buyfinder - Email Change",
      text: `
        Hello,

        A change of email address has been requested. To proceed, visit the link below within 10 minutes. If you haven't made this request, do not open the link and ignore this email.

        ${confirmationLink}

        If you opened the link above by mistake, please reply to this email immediately.
      `,
      html: `
        Hello,<br />
        <br />
        A change of email address has been requested. To proceed, visit the link below within 10 minutes. If you haven't made this request, do not open the link and ignore this email.<br />
        <br />
        <a href="${confirmationLink}">${confirmationLink}</a><br />
        <br />
        If you opened the link above by mistake, please reply to this email immediately.
      `
    }

    await sendMail(email, user)
  } catch (error) {
    console.error('An error occured trying to request to change an email address', error)

    throw new Error('An error occured trying to change an email address')
  }
}

export async function confirmEmailChange (token: string) {
  try {
    const tokenDoc = await Tokens.findOne({ token })

    if (!tokenDoc) throw new Error('Invalid token.')
    if (!tokenDoc.data) throw new Error('Invalid token.')

    const now = new Date().getTime()
    const tokenCreationDate = new Date(tokenDoc.createdAt).getTime()
    const tokenExpirationDate = tokenCreationDate + (1000 * 60 * 10)

    if (now > tokenExpirationDate) {
      await Tokens.deleteOne({ token })

      throw new Error('Invalid token.')
    }

    const user = await Users.findOne({ _id: tokenDoc.user })
        
    if (!user) throw new Error('Invalid token.')

    user.previousEmail = user.email
    user.email = tokenDoc.data

    await user.save()
        
    await Tokens.deleteOne({ _id: tokenDoc._id })
  } catch (error) {
    console.error('An error occured trying to change the email', error)

    throw new Error('An error occured trying to change the email')
  }
}
