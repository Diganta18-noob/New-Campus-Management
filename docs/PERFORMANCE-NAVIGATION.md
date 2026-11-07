# Navigation and people-directory performance

The `/students` page uses a lightweight Material UI table. Its production route bundle fell from **119.8 KiB to 13.8 KiB gzipped** in local builds. The full JavaScript gzip budget fell from about **545 KiB to 441 KiB**.

The sidebar begins loading a page's code on hover, focus, or touch. For an admin opening the people directory, it also warms the first learner page. React Query caches each role, search, page, and page-size combination for five minutes and retains it for twenty minutes. A manual Refresh or a user mutation invalidates the directory cache. Login, logout, account change, and expired authentication clear cached data so one account cannot see another account's cached directory.

The directory no longer waits 250 ms before its first request or fetches unused departments. Its dedicated API view selects only table/form fields, skips batch population, and has a role plus creation-date index. Loading and error feedback render inside the directory card, leaving the page shell visible.

`verify-directory-cache.mjs` intercepts delayed API responses and checks one request on initial visit, none on a fresh repeat visit, one on Refresh, and one sidebar prefetch without a duplicate on click. These are local network-call and bundle measurements; live Vercel/MongoDB latency depends on hosting, geography, cold starts, and database indexes after deployment.
