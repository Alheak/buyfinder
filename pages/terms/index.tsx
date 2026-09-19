import Head from "next/head"
import H3 from "../../components/_utils/H3"

export default function TermsOfService () {
  return (
    <>
      <Head>
        <title>Terms Of Service - buyfinder</title>
      </Head>

      <div className="container max-w-lg w-full min-h-s-screen mx-auto p-4 leading-7">
        <h1 className="mt-4 mb-8 text-4xl">Terms of Service</h1>
        <p>
          Please read these terms of service carefully before using buyfinder&#46;moe (&quot;Our Website&quot;). By using our website, you agree to be bound by these terms of service.
        </p>
        <H3>
          Use of The Website
        </H3>
        <p>
          Our website is a price comparator for anime figures. It fetches and displays listings from diverse online shops where a given figure is found in stock and sorts the results by price. Users can set watches to get notified when new listings or prices are found.
        </p>
        <H3>
          Intellectual Property
        </H3>
        <p>
          Any copyrighted material on our website belongs to its rightful owner. The name &quot;buyfinder.moe&quot; and the website itself is our intellectual property. <br />
          Users are forbidden to use commercially the results provided by our website as content or material for their own website or service without prior authorization.
        </p>
        <H3>
          User Responsibilities
        </H3>
        <p>
          Users have to provide correct contact and billing information when making a purchase on our website.
        </p>
        <H3>
          Limitations of Liability
        </H3>
        <p>
          Our website might go into unplanned maintenance or experience occasional technical difficulties during which it won&apos;t be able to operate correctly or provide Premium features. We are not responsible for any loss or damages resulting from the unavailability of our website.
        </p>
        <H3>
          Disclaimer of Warranties
        </H3>
        <p>
          Our website is provided on an &quot;as is&quot; basis without any warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>
        <H3>
          Termination
        </H3>
        <p>
          We reserve the right to close a user&apos;s account and terminate any associated subscriptions without notice if the user is found to have violated any of the terms of service.
        </p>
        <H3>
          Jurisdiction and Applicable Law
        </H3>
        <p>
          Any dispute arising from the use of our website shall be governed by French law and submitted to the competent French courts, in accordance with French procedural rules.
        </p>
        <H3>
          Modifications
        </H3>
        <p>
          We reserve the right to modify or terminate the terms of service at any time without prior notice. Users will be notified by email of important changes to the terms of service.
        </p>
        <hr className="my-8 border-zinc-500" />
        <p className="mb-8">
          By using our website, you acknowledge that you have read, understood, and agreed to be bound by these terms of service.
        </p>
      </div>
    </>
  )
}
