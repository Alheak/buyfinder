import { signIn, useSession } from "next-auth/react"
import Router from "next/router"
import React, { useEffect, useState } from "react"
import { useToast } from "../../store/ToastContext"
import Button from "../_utils/Button"
import TextInput from "../_utils/TextInput"

export default function SignIn ({ onSignIn = () => Router.push('/'), switchToPasswordReset = () => Router.push('/signin/reset'), switchToSignUp = () => Router.push('/signup') }: { onSignIn?: () => void, switchToPasswordReset?: () => void, switchToSignUp?: () => void }) {
  const { data: session, status } = useSession()
  const { updateToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit (e: React.SyntheticEvent) {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      res && res.ok ? updateToast('Signed in.', 'success') : updateToast('Couldn\'t sign in, verify your credentials and try again.', 'error')
    } catch (error) {
      updateToast('Something went wrong trying to sign in.', 'error')
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (session) onSignIn()
  }, [session])

  return (
    <form
      className="w-full p-4"
      onSubmit={(e) => handleSubmit(e)}
    >
      <TextInput title="Email" name="email" type="email" value={email} required update={(value) => setEmail(value)} />
      <TextInput className="mt-2" title="Password" name="password" type="password" value={password} required update={(value) => setPassword(value)} />
      <a href="#" className="block w-full mt-1 mb-2 text-sm text-right" onClick={switchToPasswordReset}>Forgot your password?</a>
      <Button isLoading={isLoading} action={handleSubmit}>
        Sign in
      </Button>
      <p className="mt-4 text-sm text-right">
        <span>{`Don't have an account?`}</span>
        <br />
        <a href="#" onClick={switchToSignUp}>Click here to sign up</a>
      </p>
    </form>
  )
}
