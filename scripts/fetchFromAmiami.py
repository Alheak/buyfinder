import sys
from curl_cffi import requests
import json

search = sys.argv[1]

data = {
  "s_keywords": search,
  "pagemax": 5,
  "lang": "eng",
  "s_st_list_preorder_available": 1,
  "s_st_list_backorder_available": 1,
  "s_st_list_newitem_available": 1,
  "s_st_condition_flg": 1,
  "age_confirm": "true"
}
headers = {
  "X-User-Key": "buyfinder_dev",
  "User-Agent": "python-buyfinder_dev"
}
res = requests.get("https://api.amiami.com/api/v1.0/items", params=data, headers=headers, impersonate="chrome110", proxies=None)
data = res.json()

print(json.dumps(data, indent=2))
