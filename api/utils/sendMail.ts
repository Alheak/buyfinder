import nodemailer from 'nodemailer'
import { User } from '../../types/User'

export default async function sendMail ({ subject, text, html }: { subject: string, text: string, html: string }, user: User) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD
    }
  })

  const email = {
    from: `buyfinder <${process.env.EMAIL_ADDRESS}>`,
    to: user.email,
    subject,
    text,
    html
  }

  try {
    await transporter.sendMail(email)
  } catch (error) {
    console.error('Error when trying to send an email', email, error)
  }
}
