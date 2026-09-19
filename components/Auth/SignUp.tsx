import { signIn, useSession } from "next-auth/react"
import Router from "next/router"
import React, { useEffect, useState } from "react"
import { useToast } from "../../store/ToastContext"
import Button from "../_utils/Button"
import TextInput from "../_utils/TextInput"
import Link from "next/link"

export default function SignUp ({ onSignIn = () => Router.push('/'), switchToSignIn = () => Router.push('/signin') }: { onSignIn?: () => void, switchToSignIn?: () => void }) {
  const { data: session, status } = useSession()
  const { updateToast } = useToast()
  const [email, setEmail] = useState('')
  const [emailRepeat, setEmailRepeat] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [hasAgreed, setHasAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()

    if (isLoading) return

    if (email !== emailRepeat) {
      updateToast('Emails don\'t match.', 'error')

      return
    }

    if (password !== passwordRepeat) {
      updateToast('Passwords don\'t match.', 'error')

      return
    }

    if (!hasAgreed) {
      updateToast('You have to agree to the privacy policy and the terms of service in order to register.', 'error')

      return
    }

    setIsLoading(true)

    try {
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      })
    } catch (error: any) {
      if (error.status === 400) {
        updateToast('Email already in use.', 'error')
      } else {
        updateToast('Internal error, try again later or contact the admin.', 'error')
      }

      setIsLoading(false)

      return
    }

    setAccountCreated(true)

    // try {
    //   const res = await signIn('credentials', {
    //     email,
    //     password,
    //     redirect: false
    //   })

    //   res && res.ok ? updateToast('Account created.', 'success') : updateToast('Error trying to sign in, try again later or contact the admin.', 'error')
    // } catch (error) {
    //   updateToast('Error trying to sign in, try again later or contact the admin.', 'error')
    // }

    setIsLoading(false)
  }

  useEffect(() => {
    if (!session) return

    onSignIn()
  }, [session])

  return accountCreated ? (
    <div className="w-full p-4">
      Your account has been created. <br /><br />
      To activate it, please click on the link in the email that has been sent to the address you provided ({email}). <br /><br />
      If you didn&apos;t receive any email, wait a bit, check your spam folder, verify the address you provided or <a href="mailto:buyfinder.moe@gmail.com">contact an admin</a>.
    </div>
  ) : (
    <form
      className="w-full p-4"
      onSubmit={(e) => handleSubmit(e)}
    >
      <TextInput title="Email" name="email" type="email" value={email} required update={(value) => setEmail(value)} />
      <TextInput className="mt-2" title="Re-type email" name="email" type="email" value={emailRepeat} required update={(value) => setEmailRepeat(value)} />
      <TextInput className="mt-2" title="Password" name="password" type="password" value={password} required update={(value) => setPassword(value)} />
      <TextInput className="mt-2" title="Re-type password" name="password" type="password" value={passwordRepeat} required update={(value) => setPasswordRepeat(value)} />
      <div className="mt-2 mb-4">
        <input type="checkbox" name="hasAgreed" id="PrivacyPolicy" checked={hasAgreed} onChange={() => setHasAgreed(prev => !prev)} />
        <label htmlFor="hasAgreed" onClick={() => setHasAgreed(prev => !prev)}>
          <span className="ml-2">I agree to the <Link href="/privacy" target="_blank">Privacy Policy</Link> and <Link href="/terms" target="_blank">Terms of Service</Link>.</span>
        </label>
      </div>
      <Button isLoading={isLoading} action={handleSubmit}>
        Sign in
      </Button>
      <p className="mt-4 text-sm text-right">
        <span>Already have an account?</span>
        <br />
        <a href="#" onClick={switchToSignIn}>Click here to sign in</a>
      </p>
    </form>
  )
}
