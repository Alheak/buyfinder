import { GetServerSidePropsContext } from "next"
import { Session, getServerSession } from "next-auth"
import Head from "next/head"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"
import { authOptions } from "../api/auth/[...nextauth]"
import Layout from "../../components/Profile/layout"
import Button from "../../components/_utils/Button"
import TextInput from "../../components/_utils/TextInput"
import { useToast } from "../../store/ToastContext"
import LoadingSpinner from "../../components/_utils/LoadingSpinner"
import Notice from "../../components/_utils/Notice"

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  try {
    const session = await getServerSession(context.req, context.res, authOptions)

    if (!session) {
      return {
        redirect: {
          destination: '/'
        }
      }
    }
    
    return {
      props: {}
    }
  } catch (error) {
    console.error('Error when getting session', error)

    return {
      redirect: {
        destination: '/'
      }
    }
  }
}

export default function Profile () {
  const { data: session, update: updateSession } = useSession()
  const { updateToast } = useToast()
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [showEmailChangeNotice, setShowEmailChangeNotice] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newEmailRepeat, setNewEmailRepeat] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function changeEmail () {
    if (newEmail !== newEmailRepeat) {
      updateToast('Emails don\'t match.', 'error')

      return
    }

    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/changeEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newEmail,
          password
        })
      })

      if (res.ok) {
        setShowEmailChangeNotice(true)
      } else {
        updateToast('An error occured, verify that the email isn\'t already in use or that the password is correct.', 'error')
      }
    } catch (error) {
      updateToast('Internal error, try again later or contact the admin.', 'error')
    }

    setIsUpdatingEmail(false)
    setIsLoading(false)
  }

  return (
    <>
      <Head>
        <title>My Profile - buyfinder</title>
      </Head>

      <Layout>
        <h1 className="mt-4 mb-8 text-4xl">My profile</h1>
        <section>
          {
            isLoading ? (
              <LoadingSpinner />
            ) : (
              showEmailChangeNotice ? (
                <Notice type="info">
                  An email has been sent to the address you provided with a confirmation link. <br />
                  Please open the link to confirm the change.
                </Notice>
              ) : (
                isUpdatingEmail ? (
                  <div>
                    <TextInput title="New email" type="email" name="newEmail" value={newEmail} update={(value) => setNewEmail(value)} />
                    <TextInput className="mt-4" title="Re-type new email" type="email" name="newEmailRepeat" value={newEmailRepeat} update={(value) => setNewEmailRepeat(value)} />
                    <TextInput className="mt-4" title="Password" type="password" name="password" value={password} update={(value) => setPassword(value)} />
                    <p className="flex mt-4 gap-2">
                      <Button action={() => changeEmail()}>Send</Button>
                      <Button bgColor="bg-white" textColor="text-black" action={() => setIsUpdatingEmail(false)}>Cancel</Button>
                    </p>
                  </div>
                ) : (
                  <div className="w-min flex justify-between items-center gap-4">
                    <p>
                      <strong>Email address</strong>
                      <br />
                      <span>{session?.user.email}</span>
                    </p>
                    <Button action={() => setIsUpdatingEmail(true)}>Change</Button>
                  </div>
                )
              )
            )
          }
        </section>
      </Layout>
    </>
  )
}
