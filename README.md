Source code for buyfinder.

Requires Redis, ElasticSearch and MongoDB.
Basic installs of those should be sufficient.

A sample env file has been provided.

What needs to be done: 
- A few shops have probably changed and their selectors need to be updated for them to work again
- Some other shops, notably AmiAmi, animota and Suruga-ya, are very unfriendly to bots and I wasn't able to get past their blocks, except Suruga-ya with Cloudflare's Browser Run action, but relying on it gets expensive.
- Figuring out a way to get an authenticated session on MFC to retrieve NSFW item data
- Making the admin interface a bit more usable and complete
- Maybe a way to let users submit listings if the crawler can't find them because of a block

Contact me at buyfinder.moe@gmail.com if you are unsure about something about the website itself.
I won't be able to help you with more technical stuff like setting up your system.


