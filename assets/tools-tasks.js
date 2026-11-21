/* Tools page: "What do you need to do right now?"
   One task -> one good free tool, a 15-minute plan, and (where useful) a prompt to copy. */
(function () {
  const box = document.getElementById('answer'); if (!box) return;
  const esc = (t) => { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; };

  const T = {
    resume: {
      pick: 'A free AI assistant', name: 'Claude or ChatGPT, free plan', url: 'https://claude.ai', cta: 'Open Claude',
      why: 'It does what the paid resume tools do, without the subscription. You stay in charge of every word.',
      steps: ['Copy the prompt below and open Claude or ChatGPT.', 'Paste the job description and three to five bullets from your resume.', 'Pick the versions that sound like you, and check every fact before you use them.'],
      prompt: 'Here is a job description and some bullet points from my resume. Rewrite my bullets so they match what this job is asking for. Keep every fact true: don\'t invent numbers, job titles or skills I didn\'t mention. Give me three versions of each bullet, from plain to bold.\n\nJob description:\n[paste it here]\n\nMy bullets:\n[paste them here]',
      also: ['Teal (free plan)', 'https://www.tealhq.com', 'a resume builder that shows which keywords a job post is looking for.'],
    },
    interview: {
      pick: 'A practice interviewer in your pocket', name: 'Claude or ChatGPT, in voice mode', url: 'https://claude.ai', cta: 'Open Claude',
      why: 'Saying answers out loud is what makes them easy on the day. This is patient, free, and there\'s no one to embarrass yourself in front of.',
      steps: ['Open the app on your phone and switch to voice.', 'Paste the prompt below, with your role filled in.', 'Answer three questions out loud, then ask: "What should I practise most?"'],
      prompt: 'You\'re a kind but honest interviewer for a [role] job. Ask me one question at a time and wait for my answer. After each answer, tell me one thing that worked and one thing to improve. Start with "Tell me about yourself", then ask why I left my last job (I was laid off), then two questions about my experience.',
      extra: '<p class="answer__extra"><b>Words for "Why did you leave?"</b> "My role was one of many cut in a company-wide layoff. I\'m proud of what I did there, especially [one result], and I\'m looking for a team where I can [what you want next]."</p>',
      also: ['Pramp', 'https://www.pramp.com', 'free mock interviews with other job seekers, best for tech roles.'],
    },
    track: {
      pick: 'One calm place for every application', name: 'Huntr, free plan', url: 'https://huntr.co', cta: 'Open Huntr',
      why: 'When you can see everything in one board, follow-ups stop slipping and the search feels less endless.',
      steps: ['Sign up free and add the browser extension.', 'Clip each job as you apply. It saves the details for you.', 'Once a week, follow up on anything with no reply after seven days.'],
      also: ['Saved jobs in your plan', 'jobs.html', 'save jobs from our job board and they wait for you in Your plan.'],
    },
    money: {
      pick: 'Know your runway', name: 'Our runway calculator, right here', calc: true,
      why: 'Knowing exactly how long your money lasts turns a vague fear into a number you can plan around.',
      also: ['YNAB', 'https://www.ynab.com', 'a budgeting app that\'s free for a year if you email their support and tell them you\'ve been laid off.'],
    },
    learn: {
      pick: 'Free courses with your library card', name: 'LinkedIn Learning, through your public library', url: 'https://www.google.com/search?q=my+public+library+LinkedIn+Learning', cta: 'Find your library\'s access',
      why: 'Many libraries give it away free with a library card, and a short course on your resume shows you\'ve kept moving.',
      steps: ['Look on your library\'s website for "LinkedIn Learning" (many issue cards online).', 'Sign in with your library card number, not a LinkedIn login.', 'Pick one course under two hours that appears in the jobs you\'re applying for.'],
      also: ['freeCodeCamp', 'https://www.freecodecamp.org', 'completely free courses and certificates, from coding to data.'],
    },
    mind: {
      pick: 'Start with one minute', name: 'Our one-minute breather', breathe: true,
      why: 'Your nervous system has had a shock. A minute of slow breathing is the quickest way to take the edge off.',
      steps: ['Take the one-minute breather now. It\'s just six slow breaths.', 'For more, try Insight Timer (free) and search "job loss" or "anxiety".', 'If it feels heavy, talk to someone. Call or text 988 in the US, or see our low-cost therapy picks.'],
      also: ['Insight Timer', 'https://insighttimer.com', 'thousands of free guided meditations, with no paywall for the basics.'],
    },
  };

  function calcHTML() {
    return '<form class="runway" id="runway" onsubmit="return false">' +
      '<label>Savings you can use<span>$</span><input type="number" id="rw-save" min="0" step="100" placeholder="8000"></label>' +
      '<label>Severance still to come<span>$</span><input type="number" id="rw-sev" min="0" step="100" placeholder="0"></label>' +
      '<label>Unemployment per week<span>$</span><input type="number" id="rw-ui" min="0" step="10" placeholder="450"></label>' +
      '<label>Weeks of unemployment<input type="number" id="rw-weeks" min="0" max="52" step="1" value="26"></label>' +
      '<label>Essential costs per month<span>$</span><input type="number" id="rw-cost" min="0" step="50" placeholder="3200"></label>' +
      '<div class="runway__out" id="rw-out"><p>Fill in what you know. It updates as you type, and stays on your device.</p></div>' +
      '</form>';
  }
  function calc() {
    const v = (id) => +(document.getElementById(id).value || 0);
    const save = v('rw-save') + v('rw-sev'), ui = v('rw-ui'), weeks = v('rw-weeks'), cost = v('rw-cost');
    const out = document.getElementById('rw-out');
    try { localStorage.setItem('ls_runway', JSON.stringify({ save: v('rw-save'), sev: v('rw-sev'), ui, weeks, cost })); } catch (e) {}
    if (!cost) { out.innerHTML = '<p>Add your essential monthly costs (rent, food, bills, insurance) to see your runway.</p>'; return; }
    const uiMonth = ui * 52 / 12, uiMonths = weeks * 12 / 52;
    let money = save, months = 0;
    while (months < 60) {
      const income = months < uiMonths ? uiMonth * Math.min(1, uiMonths - months) : 0;
      const need = cost - income;
      if (need <= 0) { months += 1; continue; }
      if (money >= need) { money -= need; months += 1; } else { months += money / need; break; }
    }
    const m = Math.floor(months), until = new Date(); until.setMonth(until.getMonth() + m);
    const big = months >= 60 ? '5+ years' : (m + (months - m >= 0.5 ? '½' : '') + (m === 1 ? ' month' : ' months'));
    let note;
    if (months < 3) note = 'That\'s tight, and it\'s good you know now. Check whether you qualify for Medicaid, ask lenders and your landlord about hardship plans, and look at <a href="offers.html">our low-cost picks</a>.';
    else if (months < 6) note = 'You have some room to breathe. Cut one or two costs now, keep applying steadily, and consider a short contract to stretch it.';
    else note = 'That\'s a real cushion. You can be choosy about the next role. Still worth checking your health coverage options.';
    out.innerHTML = '<p class="runway__big">' + big + '</p><p class="runway__sub">' + (months < 60 ? 'Your money lasts until about <b>' + until.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + '</b>.' : '') + '</p><p class="runway__note">' + note + '</p>';
  }

  function show(k) {
    const t = T[k];
    document.querySelectorAll('.task').forEach((b) => b.setAttribute('aria-pressed', b.dataset.task === k));
    let h = '<p class="answer__kicker">Best free pick</p><h2>' + esc(t.pick) + '</h2><p class="answer__name">' + esc(t.name) + '</p><p class="answer__why">' + esc(t.why) + '</p>';
    if (t.calc) h += calcHTML();
    if (t.steps) h += '<div class="answer__plan"><p class="answer__label">Your 15-minute plan</p><ol>' + t.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol></div>';
    if (t.prompt) h += '<div class="answer__prompt"><p class="answer__label">Copy this prompt</p><pre id="answerPrompt">' + esc(t.prompt) + '</pre><button type="button" class="btn btn--outline btn--sm" id="copyPrompt">Copy prompt</button></div>';
    if (t.extra) h += t.extra;
    h += '<div class="answer__actions">';
    if (t.url) h += '<a class="btn btn--primary" href="' + t.url + '" target="_blank" rel="noopener">' + esc(t.cta) + ' &#8599;</a>';
    if (t.breathe) h += '<button type="button" class="btn btn--primary" data-breathe>Take the one-minute breather</button>';
    h += '</div>';
    if (t.also) h += '<p class="answer__also"><b>Also good:</b> <a href="' + t.also[1] + '"' + (t.also[1].startsWith('http') ? ' target="_blank" rel="noopener"' : '') + '>' + esc(t.also[0]) + '</a>, ' + esc(t.also[2]) + '</p>';
    box.innerHTML = h; box.hidden = false;
    box.classList.remove('is-in'); void box.offsetWidth; box.classList.add('is-in');
    const cp = document.getElementById('copyPrompt');
    if (cp) cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(t.prompt); cp.textContent = 'Copied'; setTimeout(() => (cp.textContent = 'Copy prompt'), 1800); } catch (e) {} });
    if (t.calc) {
      try { const r = JSON.parse(localStorage.getItem('ls_runway') || 'null'); if (r) { document.getElementById('rw-save').value = r.save || ''; document.getElementById('rw-sev').value = r.sev || ''; document.getElementById('rw-ui').value = r.ui || ''; document.getElementById('rw-weeks').value = r.weeks || 26; document.getElementById('rw-cost').value = r.cost || ''; } } catch (e) {}
      document.getElementById('runway').addEventListener('input', calc); calc();
    }
    try { history.replaceState(null, '', '#do-' + k); } catch (e) {}
    if (box.getBoundingClientRect().top > window.innerHeight * 0.6) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('.task').forEach((b) => b.addEventListener('click', () => show(b.dataset.task)));
  const start = (location.hash || '').replace(/^#(do-)?/, '');
  if (T[start]) show(start);
})();
