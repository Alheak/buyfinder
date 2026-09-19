import { faExternalLink } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Head from "next/head"

export default function About () {
  return (
    <>
      <Head>
        <title>About - buyfinder</title>
      </Head>

      <div className="container max-w-lg w-full min-h-s-screen mx-auto p-4 leading-7">
        <h1 className="mt-4 mb-8 text-4xl">About</h1>
        <p>
          buyfinder&#46;moe searches and compares prices for anime figures that searches for in-stock items on multiple online shops at once.
        </p>
        <br />
        <p>
          It is also possible to set watches to be notified by email of new listings when other users search for the same figure.
        </p>
        <br />
        <p>
          While you can technically use this website for items other than figures, the results may not be accurate as it has been optimized for figures first.
        </p>
        <h2 className="text-2xl mt-12 mb-4">Disclaimer</h2>
        <p className="text-sm leading-6">
          The prices displayed are purely indicative as they are taken directly from the shops and may or may not include additional costs, fees and/or taxes.
          <br />
          <br />
          To cover the costs of operating this website, be aware that some results include affiliate links. They however do not influence the order the listings are sorted by.
          <br />
          <br />
          This website is still in development and things might not always work as expected. There might be inaccuracies in the results or random bugs when using the website.
          <br />
          <br />
          If you happen to find such a problem somewhere, or if you want to get in contact for whatever reason, do not hesitate to send an email to <a href="mailto:buyfinder.moe@gmail.com" target="_blank" rel="nofollow noreferrer">buyfinder.moe@gmail.com</a> or a message to <a href="https://myfigurecollection.net/profile/buyfinder" target="_blank" rel="nofollow noreferrer"><span className="mr-1">buyfinder on MyFigureCollection</span> <FontAwesomeIcon icon={faExternalLink} /></a>.
        </p>
      </div>
    </>
  )
}
