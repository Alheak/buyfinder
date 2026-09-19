import Head from "next/head"
import H2 from "../../components/_utils/H2"
import H3 from "../../components/_utils/H3"
import SideMenu from "../../components/_utils/SideMenu"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faComment, faExternalLink, faFlag, faRefresh } from "@fortawesome/free-solid-svg-icons"
import Notice from "../../components/_utils/Notice"
import Modal from "../../components/_utils/Modal"
import ShopSuggestion from "../../components/Figure/ShopSuggestion"
import { useState } from "react"
import Button from "../../components/_utils/Button"

export default function About () {
  const { data: session } = useSession()
  const [showShopSuggestionModal, setShowShopSuggestionModal] = useState(false)
  const links = [
    {
      title: "General",
      path: "/faq#General"
    },
    {
      title: "Watches",
      path: "/faq#Watches"
    },
    {
      title: "Premium",
      path: "/faq#Premium"
    },
    {
      title: "Reports",
      path: "/faq#Reports"
    }
  ]

  return (
    <>
      <Head>
        <title>FAQ - buyfinder</title>
      </Head>

      <div className="container flex flex-col md:flex-row max-w-4xl mx-auto p-4 gap-8">
        <SideMenu links={links} sticky />
        <div className="w-full min-h-s-screen mx-auto pb-4 px-4 leading-7">
          <h1 className="my-4 text-4xl">Frequently Asked Questions</h1>
          <H2 id="General">General</H2>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What is this website?
            </span>
          </H3>
          <p>
            buyfinder&#46;moe searches and compares prices for anime figures. It looks through multiple online hobby shops at once to find if the figure you&apos;re looking for is in stock and at what price. The results are then sorted by price so you can see the best offers first.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What can I search for?
            </span>
          </H3>
          <p>
            As long as it is in our database or you have a MyFigureCollection link or a JAN of the item, <strong>and it has actually been available for sale/pre-order at some point</strong>, pretty much anything — although in order to be as accurate as possible with the results, the search algorithm has been optimized for figures first. The shops that are searched have also been chosen because they sell figures but might not necessarily sell other goods.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What is MyFigureCollection (MFC)?
            </span>
          </H3>
          <p>
            <a href="https://myfigurecollection.net" rel="nofollow noreferrer" target="_blank">MyFigureCollection <FontAwesomeIcon icon={faExternalLink} /></a> is a database website that collects information about anime figures and goods. buyfinder can recognize a link to an entry on this website and recover information about it in order to search the item.
          </p>
          <H3 id="JAN">
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What is a JAN?
            </span>
          </H3>
          <p>
            A JAN (Japanese Article Number) is simply a barcode. It is 13 digits long and is attributed to a specific item in order to identify it.
            <br />
            In case of anime figures and goods, it generally starts with 06, 45, 471, 49 or 69. Most online shops use JANs to reference their products and display it in their listings.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              How can I start a search?
            </span>
          </H3>
          <p>
            Simply by entering a JAN, a MFC link or keywords related to the figure in the search bar. <br />
            For the latter, a list of items might appear below the search bar. Just clicking on the desired one will bring you to its page. <br />
            If you don&apos;t find what you want, it probably means that it is not in the database yet, so you should try with a JAN or MFC link instead.
            <br /><br />
            Once on the figure&apos;s page, click on the &quot;Start searching&quot; button to start a search.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              Why does the figure I am searching for have outdated/missing info?
            </span>
          </H3>
          <p>
            To preserve server resources, info about items (name, JAN codes, origin, etc...) is only updated once every few days/weeks. <br />
            It is possible that the info was recovered by buyfinder before the entry was updated on MFC, rendering it obsolete until the next update. <br /><br />
            If you feel this might cause issues during a search, you can contact us at <a href="mailto:buyfinder.moe@gmail.com">buyfinder.moe@gmail.com</a> so we can update it manually.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What does the <FontAwesomeIcon className="mx-1 text-red-500" icon={faRefresh} /> refresh button do?
            </span>
          </H3>
          <p>
            Because price and stock change with time, results eventually become obsolete. <br />
            By <FontAwesomeIcon className="mx-1 text-red-500" icon={faRefresh} /> refreshing, buyfinder will re-check for up-to-date results.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              I tried searching for a figure but the results are for completely different items. What gives?
            </span>
          </H3>
          <p>
            Sometimes, shops don&apos;t reference their catalog by JAN or items don&apos;t have any known JAN, which means buyfinder will have to search using keywords instead, making searching for a specific item a bit more tricky and inaccurate.
            <br />
            In that case, buyfinder mostly depends on the reliability of the shops&apos; search engines, meaning that if results are wrong on a given shop, there is a chance it&apos;ll be wrong on buyfinder as well.
            To help mitigate this, we do our best to optimize queries and filter results to make sure they are as accurate as possible, although we have chosen to make the filtering algorithm more lenient to avoid false negatives (missed hits) at the expense of getting more false positives (wrong results).
            <br /><br />
            <strong>
              Because buyfinder uses info found on MFC to search for the item, there is also a possibility that the item&apos;s MFC entry is incorrect. A wrong JAN or a wrong name will heavily throw off the searches.
              <br />
              While you can help us refine our algorithm thanks to <a href="#Reports">Reports</a>, you can also help by creating alerts on the MFC page of the item if the entry contains incorrect or incomplete information about it.
            </strong>
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              Does buyfinder use AI?
            </span>
          </H3>
          <p>
            No. I do not have the technical ability to implement machine learning and it would be too expensive/resource-intensive to use anyway.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              Do you plan on adding more shops?
            </span>
          </H3>
          <p>
            Yes, but given the enormous quantity of online shops out there, only the ones that stand out will be added. <br />
            For example, a shop is more likely to be added if it is popular, features things like attractive prices, item availability, second-hand items, or allows finding items with <a href="#JAN">JANs</a>. <br />
            <br />
            If you would like to suggest a shop, click on the button below. <br />
            <br />
            <Button action={() => setShowShopSuggestionModal(true)}>Suggest a shop</Button>
          </p>
          <H2 id="Watches">Watches</H2>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What are watches?
            </span>
          </H3>
          <p>
            Anime figures are usually limited in stock and as a result, their price and availability fluctuate with time. Watches help you keep track of those changes and notify you when new results or prices are found.
            <br />
            Watches can also be customized so you don&apos;t get notified if prices are too high or if you don&apos;t want or can&apos;t buy from certain shops.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              When do I get notified?
            </span>
          </H3>
          <p>
            Searches being quite computationally intensive, buyfinder cannot be constantly on the lookout for new results for every figure, meaning that new results can only be found when a user starts a search on the website or refreshes results.
            <br />
            As such, you&apos;ll only get notified of new results when someone searches for a figure you are currently watching.
          </p>
          <H3 id="WatchPoints">
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What are Watch Points?
            </span>
          </H3>
          {/* <Notice type="warning" fullWidth>
            This feature is experimental and may be adjusted occasionally.
          </Notice>
          <br /> */}
          <p>
            They are points that allow you to set your watches to be automatically searched at a regular interval set by you, from once every 10 minutes to once per day. <br />
            One point is equivalent to one search per shop, and you can obtain them either by buying them or by correctly reporting wrong results.
            <br /><br />
            You can set any number of watches to be automatically searched, but the more watches there are and the more shops are searched, the faster the points will be used.
            <br /><br />
            Naturally, if you don&apos;t have any remaining points, the watches will no longer be automatically searched until you buy or earn more points.
            <br /><br />
            There is currently no upper limit on the number of points you can accumulate.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              Why are my Watch Points being spent more slowly than expected?
            </span>
          </H3>
          <p>
            In order to preserve server resources, some shops — even if selected — won&apos;t be searched because the chances of finding the watched item there are virtually non-existent (e.g. a garage kit on the Good Smile Company store.) <br />
            Since the search isn&apos;t made, no point is consumed. <br /><br />
            It is not absolute however, some shops might still be searched even though the item can&apos;t be found there. <br />
            It is your responsibility to make sure the item you&apos;re looking for can actually appear on a shop you&apos;ve selected so you can avoid wasting your points. <br />
            <br />
            Sometimes, buyfinder might also encounter errors while searching that prevent it from getting results. In that case, Watch Points will not be consumed.
          </p>
          {/* <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What is Active Search?
            </span>
          </H3>
          <p>
            As stated above, watches can only notify you of new results when a search is started on the website. If you&apos;re actively hunting for a figure, this can prove to be quite unreliable as you might miss restocks or other users can find out about a restock before you.
            <br />
            <br />
            To help this that, Active Search makes your watch be automatically searched every 20 minutes (depending on server load) in the background. <br />
            Contrary to searches made on the website, those automatic searches notify only you of new results and are not visible on the figure&apos;s page.
            <br />
            They can also be fine-tuned by setting customized rules for each shop. You can change the queries used to search for the item and add keywords to filter certain results.
            <br />
            <br />
            In case multiple Premium users were to be watching the same figure, notifications will be sent on a first come, first served basis.
          </p> */}
          <H2 id="Premium">Premium</H2>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What is Premium?
            </span>
          </H3>
          <p>
            It&apos;s a monthly subscription to access extra features on this website.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What features are available?
            </span>
          </H3>
          <p>
            With a Premium subscription, you have access to price charts. With them, you can follow the evolution of prices and know when is the best time to buy or sell your figures.
            <br />
            Those charts show price history for both new and pre-owned figures as well as the range of prices, with the possibility to filter by shop.
            <br />
            <br />
            Premium users can also start multiple searches for different items on the website at the same time without having to wait for the previous ones to finish first.
            <br />
            <br />
            More benefits are planned to be added to Premium in the future. If you have ideas or suggestions, contact us at <a href="mailto:buyfinder.moe@gmail.com">buyfinder.moe@gmail.com</a>.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              How far back do the price charts go and how precise are they?
            </span>
          </H3>
          <p>
            Since buyfinder only gets price data when searches are made, prices can only go back as early as the release of this site, which is around March 2023, so older and more popular figures will have more precise and complete charts. <br />
            With time, we expect charts to become more and more useful and detailled.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              How much does a Premium subscription cost?
            </span>
          </H3>
          <p>
            2.00 USD per month.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              How can I subscribe?
            </span>
          </H3>
          <p>
            {
              session ? (
                <span>
                  Simply go to <Link href="/profile/membership">your profile page</Link> and click on the &quot;Subscribe&quot; button.
                </span>
              ) : (
                <span>
                  First, you need to be a registered user on the website. <Link href="/signup">Sign up</Link> or <Link href="/signin">sign in</Link> then head to <Link href="/profile/membership">your profile page</Link> and click on the &quot;Subscribe&quot; button.
                </span>
              )
            }
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              I just subscribed but I can&apos;t access Premium features. What is happening?
            </span>
          </H3>
          <p>
            Your account should be updated automatically after the payment has been confirmed but it is possible that it didn&apos;t happen for some technical reason.
            <br />
            Simply refreshing the website or signing out then in again should fix it, but in case it didn&apos;t, contact us at <a href="mailto:buyfinder.moe@gmail.com">buyfinder.moe@gmail.com</a>.
          </p>
          <H2 id="Reports">Reports</H2>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What are <FontAwesomeIcon className="mx-1 text-red-500" icon={faFlag} /> reports?
            </span>
          </H3>
          <p>
            They are a way to flag results as being either wrong or missing, helping us weed out false data and refine our search algorithm.
            <br />
            You can report by clicking on the red flag <FontAwesomeIcon className="mx-1 text-red-500" icon={faFlag} /> on the right side of a result.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What do I get in return?
            </span>
          </H3>
          <p>
            If you have an account and you are signed in, you can earn up to <a href="#WatchPoints">120 Watch Points</a> per report by correctly reporting wrong results.
            <br />
            Each correct report can earn you at least 60 Watch Points if the item could be searched with a JAN, 12 otherwise, plus up to 60 more Watch Points depending on how popular the item is.
            <br /><br />
            Your watch points will be credited after an admin has verified the report.
          </p>
          <H3>
            <FontAwesomeIcon icon={faComment} />
            <span className="ml-2">
              What is considered a wrong/missing result?
            </span>
          </H3>
          <Notice type="warning" fullWidth>
            Do not search for items that have never been available for sale as results will obviously be wrong. <br />
            Watch Points may be deducted if report abuse is suspected.
          </Notice>
          <br />
          <p>
            A result is considered wrong if it contains:
          </p>
          <ul className="ml-6 list-outside list-square">
            <li className="mb-2">
              <p>
                A listing for a different item
              </p>
              <p className="leading-relaxed	text-sm text-zinc-700 dark:text-zinc-300">
                Different versions of an item that have separate entries on MFC are considered wrong. <br />
                Sets are not considered wrong as long as they contain the correct item.
              </p>
            </li>
            <li className="mb-2">
              A bootleg or counterfeit item
            </li>
            <li className="mb-2">
              A broken link or a page that is not a product page
            </li>
            <li className="mb-2">
              A product that is currently sold out
              {/* <p className="leading-relaxed	text-sm text-zinc-700 dark:text-zinc-300">
                &quot;Sold out&quot; in this case means that the item is completely unavailable for purchase and is not expected to be back in stock. <br />
                For this reason, back-orders and such are not considered sold out.
              </p> */}
              {/* <p className="leading-relaxed	text-sm text-zinc-700 dark:text-zinc-300">
                This is mostly intended to find bugs where a hit is found during a search you started or after refreshing but the item is not actually in stock. <br />
                If the results were just recently checked, it is possible there is no bug and the item simply sold out by the time you visited the page. <br />
                In this case, if the item is back in stock when your report gets verified by an admin, you might not get rewarded for it. <br />
                Moreover, results that haven&apos;t been refreshed for over 8 hours cannot be reported for being sold out because they are no longer considered up-to-date.
              </p> */}
            </li>
            <li className="">
              <p>
                Wrong information like incorrect price or condition (used/new)
              </p>
              <p className="leading-relaxed	text-sm text-zinc-700 dark:text-zinc-300">
                buyfinder gets prices from a single currency per shop, usually the shop&apos;s default currency. <br />
                If you display prices in a different currency, it is possible that the indicated price will not exactly match the listed price because of differences in exchange rates and is not considered wrong.<br />
                If the difference is too great however, a warning should be displayed on top of the result indicating that the shop inflates exchange rates on their site. If you don&apos;t see any warning however, you can report the result with an indication in the &quot;Additional information&quot; field of the report form that the warning is missing so it can be added.
              </p>
            </li>
          </ul>
          <br />
          <p>
            A result is considered missing if it is displayed as having &quot;No hits&quot; despite the item being currently in stock in the shop in question. In this case, it is appreciated to add the link to the product page in the &quot;Additional information&quot; field of the report form.
          </p>
        </div>
      </div>
      {
        showShopSuggestionModal && (
          <Modal title="Suggest a shop" onClose={() => setShowShopSuggestionModal(false)}>
            <ShopSuggestion close={() => setShowShopSuggestionModal(false)} />
          </Modal>
        )
      }
    </>
  )
}
