"""Fetch recent remote jobs from the Himalayas public API into data/live-jobs.json.

Runs daily from GitHub Actions. Himalayas allows showing its jobs on our own job board
with a visible credit and link back, and every Apply must use its applicationLink.
We never pass these jobs on to other boards or add JobPosting structured data."""
import json, time, urllib.request, urllib.parse, re, html, os

API = 'https://himalayas.app/jobs/api'
MAX_JOBS = 1500
MAX_AGE_DAYS = 30
UA = 'layoff-support-jobs/1.0 (+https://layoff.support)'

def get(params):
    url = API + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def clean(text, n=220):
    t = html.unescape(re.sub(r'<[^>]+>', ' ', text or ''))
    t = re.sub(r'\s+', ' ', t).strip()
    return (t[:n].rsplit(' ', 1)[0] + '…') if len(t) > n else t

def main():
    jobs, seen, cursor, now = [], set(), None, time.time()
    for _ in range(200):
        params = {'limit': 20}
        if cursor: params['cursor'] = cursor
        try:
            d = get(params)
        except Exception as e:
            print('stopping early:', e); break
        batch = d.get('jobs') or []
        for j in batch:
            gid = j.get('guid') or j.get('applicationLink')
            if not gid or gid in seen: continue
            if now - (j.get('pubDate') or now) > MAX_AGE_DAYS * 86400: continue
            seen.add(gid)
            jobs.append({
                'id': re.sub(r'[^A-Za-z0-9]+', '-', gid)[-80:],
                'title': j.get('title'),
                'company': j.get('companyName'),
                'logo': j.get('companyLogo'),
                'where': j.get('locationRestrictions') or [],
                'min': j.get('minSalary'), 'max': j.get('maxSalary'),
                'cur': j.get('currency'), 'per': j.get('salaryPeriod'),
                'type': j.get('employmentType'),
                'level': j.get('seniority') or [],
                'cats': (j.get('parentCategories') or j.get('categories') or [])[:3],
                'date': j.get('pubDate'),
                'link': j.get('applicationLink'),
                'about': clean(j.get('excerpt') or j.get('description')),
            })
        cursor = d.get('nextCursor')
        if not batch or not cursor or len(jobs) >= MAX_JOBS: break
        time.sleep(0.6)  # be gentle
    jobs.sort(key=lambda j: j['date'] or 0, reverse=True)
    os.makedirs('data', exist_ok=True)
    out = {'source': 'Himalayas', 'sourceUrl': 'https://himalayas.app', 'updated': int(now), 'jobs': jobs[:MAX_JOBS]}
    with open('data/live-jobs.json', 'w') as f:
        json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
    print('saved', len(out['jobs']), 'jobs')

if __name__ == '__main__':
    main()
