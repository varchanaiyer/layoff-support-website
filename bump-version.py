"""Stamp every local CSS/JS link with a new ?v= version so browsers never mix
an old cached stylesheet with a new page. Run before each publish."""
import glob, re, time
VER = time.strftime('%Y%m%d%H%M')
for f in glob.glob('*.html'):
    s = open(f).read()
    n = re.sub(r'(["\'])(assets/[\w./-]+\.(?:css|js))(?:\?v=\w+)?\1', lambda m: m.group(1) + m.group(2) + '?v=' + VER + m.group(1), s)
    if n != s: open(f, 'w').write(n)
a = open('assets/auth.js').read()
open('assets/auth.js', 'w').write(re.sub(r"'assets/auth\.css(\?v=\w+)?'", "'assets/auth.css?v=" + VER + "'", a))
print('assets versioned', VER)
