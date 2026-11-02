// IndexNow: tell Bing, Yandex, Seznam, Naver (and others sharing the protocol)
// which URLs changed, so they are recrawled in minutes instead of days.
export async function pingIndexNow(site, urls, { endpoint = 'https://api.indexnow.org/indexnow', fetchImpl = fetch } = {}) {
  if (!site.indexNowKey) return { skipped: 'no indexNowKey in config' };
  if (/^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$|\.localhost$/.test(new URL(site.url).hostname)) return { skipped: 'site.url is local' };
  if (!urls.length) return { skipped: 'no changed URLs' };
  const host = new URL(site.url).host;
  const results = [];
  for (let i = 0; i < urls.length; i += 10000) {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: site.indexNowKey, keyLocation: `${site.url}/${site.indexNowKey}.txt`, urlList: urls.slice(i, i + 10000) }),
    });
    results.push(res.status);
  }
  return { submitted: urls.length, status: results };
}
