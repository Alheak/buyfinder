import Head from "next/head"
import H3 from "../../components/_utils/H3"

export default function PrivacyPolicy () {
  return (
    <>
      <Head>
        <title>Privacy Policy - buyfinder</title>
      </Head>

      <div className="container max-w-lg w-full min-h-s-screen mx-auto p-4 leading-7">
        <h1 className="mt-4 mb-8 text-4xl">Privacy policy</h1>
        <p>
          This privacy policy describes how we collect, use, and protect your personal information when you use our website.
        </p>
        <H3>
          Overview
        </H3>
        <p>
          This website is a price comparator for anime figures. It fetches and displays listings from diverse online shops where a given figure is found in stock and sorts the results by price. Users can set watches to get notified when new listings or prices are found.
        </p>
        <H3>
          Information We Collect
        </H3>
        <p>
          We collect your email address. This information is collected when you register. <br />
          Your IP address might also get written in our server logs when you make a search.
        </p>
        <H3>
          How We Use Your Information
        </H3>
        <p>
          We use your email address to send you email notifications about new listings or prices of anime figures that match the watches you set. <br />
          Your IP address is used to limit simultaneous searches.
        </p>
        <H3>
          Information Sharing
        </H3>
        <p>
          We only share your email address with Stripe, Inc. in case you sign up for a subscription. We do not share any other data with any other third-parties.
        </p>
        <H3>
          Data Security
        </H3>
        <p>
          We take the privacy and security of your personal information seriously. All data is stored on a secure server and can only be accessed or modified by the admin or by the user if the user is signed in.
        </p>
        <H3>
          User Rights
        </H3>
        <p>
          Users have the right to read, modify and delete their own information. <br />
          You can request any time to have all your information removed from our server by sending an email to <a href="mailto:buyfinder.moe@gmail.com" target="_blank" rel="nofollow noreferrer">buyfinder.moe@gmail.com</a>.
        </p>
        <H3>
          Policy Changes
        </H3>
        <p>
          We may update this privacy policy from time to time to reflect changes to our practices or for other operational, legal, or regulatory reasons. Users will be notified by email of any important changes to the policy.
        </p>
        <hr className="my-8 border-zinc-500" />
        <p className="mb-8">
          If you have any questions or concerns about our privacy policy or how we handle your personal information, please contact us at <a href="mailto:buyfinder.moe@gmail.com" target="_blank" rel="nofollow noreferrer">buyfinder.moe@gmail.com</a>.
        </p>
      </div>
    </>
  )
}
