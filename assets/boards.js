/* Layoff Support: the job boards we recommend. One list, used by the job board page,
   the "jobs matched to you" preferences and the Job boards section of Your plan.
   Every board here was checked to be running and free for job seekers.
   Links carry a referral tag so boards can see the visitors we send them. */
window.LS_BOARD_TAGS = {
  disability: 'Disability & chronic illness',
  neuro: 'Neurodivergent',
  mental: 'Mental health',
  women: 'Women & non-binary',
  lgbtq: 'LGBTQ+',
  poc: 'People of colour',
  veterans: 'Veterans & military families',
  over50: 'Over 50',
  returners: 'Returning after a break',
  secondchance: 'Second chances',
  visa: 'Immigrants & visas',
  remote: 'Remote work',
  impact: 'Nonprofit & impact',
  salary: 'Salary shown up front',
};
window.LS_BOARD_GROUPS = [
  ['Boards for', ['disability', 'neuro', 'mental', 'women', 'lgbtq', 'poc', 'veterans', 'over50', 'returners', 'secondchance', 'visa']],
  ['Kind of work', ['remote', 'impact', 'salary']],
];
window.LS_BOARDS = [
  {"id": "inclusively", "name": "Inclusively", "url": "https://inclusively.com/hire/", "tags": ["disability", "mental", "neuro"], "where": "US", "for": "People with disabilities, mental health conditions, chronic illness or neurodivergence", "why": "List the support you need at work on your profile, so you never have to disclose it cold.", "img": "inclusively"},
  {"id": "abilityjobs", "name": "abilityJOBS", "url": "https://abilityjobs.com/", "tags": ["disability"], "where": "US", "for": "Disabled job seekers", "why": "Every employer listed is actively looking to hire disabled people.", "img": "abilityjobs"},
  {"id": "evenbreak", "name": "Evenbreak", "url": "https://www.evenbreak.com/", "tags": ["disability", "mental"], "where": "UK & global", "for": "Disabled people and people with long-term conditions", "why": "Run by disabled people, with jobs from entry level to senior and free alerts."},
  {"id": "careercircle", "name": "CareerCircle", "url": "https://www.careercircle.com/job-seekers/individuals-with-disabilities", "tags": ["disability"], "where": "US", "for": "Disabled people and other under-served groups", "why": "Free coaching and job matching. It took over the Getting Hired board."},
  {"id": "untapped", "name": "Untapped Talent", "url": "https://untappedtalent.ca/", "tags": ["disability"], "where": "Canada", "for": "Disabled Canadians", "why": "Canada's national disability job board, including disability-confident Job Bank roles."},
  {"id": "mentra", "name": "Mentra", "url": "https://mentra.com/", "tags": ["neuro"], "where": "US", "for": "Autistic, ADHD, dyslexic and other neurodivergent people", "why": "Employers see your strengths profile and reach out to you, so you don't have to sell yourself cold.", "img": "mentra"},
  {"id": "hireautism", "name": "Hire Autism", "url": "https://www.hireautism.org/job-board/", "tags": ["neuro"], "where": "US", "for": "Autistic adults", "why": "A nonprofit board of autism-friendly employers, with free mentoring alongside."},
  {"id": "exceptional", "name": "Exceptional Individuals", "url": "https://exceptionalindividuals.com/", "tags": ["neuro"], "where": "UK", "for": "Neurodivergent people", "why": "Neuroinclusive job alerts, and help with the UK Access to Work scheme."},
  {"id": "fairygodboss", "name": "Fairygodboss", "url": "https://fairygodboss.com/jobs", "tags": ["women"], "where": "US", "for": "Women", "why": "Jobs alongside anonymous reviews from women about how companies really treat them."},
  {"id": "inhersight", "name": "InHerSight", "url": "https://www.inhersight.com/jobs", "tags": ["women"], "where": "US", "for": "Women", "why": "See how employers rate on paid leave, flexibility and equal pay before you apply."},
  {"id": "techladies", "name": "Tech Ladies", "url": "https://www.hiretechladies.com/", "tags": ["women"], "where": "US & global", "for": "Women and non-binary people in tech", "why": "A free job board and newsletter from a community of 150,000+ members."},
  {"id": "mygwork", "name": "myGwork", "url": "https://mygwork.com/jobs", "tags": ["lgbtq"], "where": "UK & global", "for": "LGBTQ+ professionals", "why": "Jobs at employers committed to LGBTQ+ inclusion, plus mentoring and careers fairs."},
  {"id": "transcanwork", "name": "Trans Can Work", "url": "https://www.transcanwork.org/", "tags": ["lgbtq"], "where": "US", "for": "Trans, gender-nonconforming and intersex people", "why": "A nonprofit job board with free career support."},
  {"id": "outintech", "name": "Out in Tech", "url": "https://outintech.com/jobs/", "tags": ["lgbtq"], "where": "US", "for": "LGBTQ+ people in tech", "why": "Partner job listings and free virtual hiring events with recruiters."},
  {"id": "blacksintech", "name": "Blacks In Technology", "url": "https://www.blacksintechnology.net/jobs-board/", "tags": ["poc"], "where": "US & global", "for": "Black technologists", "why": "A free job board from the largest Black tech community, with local chapters."},
  {"id": "talentally", "name": "TalentAlly", "url": "https://talentally.com/jobs", "tags": ["poc", "women"], "where": "US", "for": "Diverse professionals", "why": "A diversity job board with career fairs and a free interview practice tool."},
  {"id": "hireheroes", "name": "Hire Heroes USA", "url": "https://www.hireheroesusa.org/", "tags": ["veterans"], "where": "US", "for": "Veterans and military spouses", "why": "Free one-to-one coaching, resume writing and mock interviews, plus a job board."},
  {"id": "hiringourheroes", "name": "Hiring Our Heroes", "url": "https://jobs.hiringourheroes.org/", "tags": ["veterans", "salary"], "where": "US", "for": "Service members, veterans and spouses", "why": "Jobs with salary ranges shown, plus hiring events and fellowships."},
  {"id": "recruitmilitary", "name": "RecruitMilitary", "url": "https://my.recruitmilitary.com/jobs", "tags": ["veterans"], "where": "US", "for": "Veterans and spouses", "why": "A large veteran job board with free career fairs."},
  {"id": "msep", "name": "MSEP", "url": "https://msepjobs.militaryonesource.mil/msep/", "tags": ["veterans"], "where": "US", "for": "Military spouses", "why": "The government portal of employers who have pledged to hire military spouses."},
  {"id": "workforce50", "name": "Workforce50", "url": "https://www.workforce50.com/", "tags": ["over50"], "where": "US", "for": "People aged 50 and over", "why": "Jobs plus practical advice for a midlife job search."},
  {"id": "aarp", "name": "AARP Job Search", "url": "https://www.aarp.org/work/job-search/indeed-career-services/", "tags": ["over50"], "where": "US", "for": "People aged 50 and over", "why": "Free resume and interview help made for older workers (listings come from Indeed)."},
  {"id": "restless", "name": "Rest Less", "url": "https://restless.co.uk/jobs/find-a-job/", "tags": ["over50"], "where": "UK", "for": "People aged 50 and over", "why": "A big UK board that marks age-inclusive employers."},
  {"id": "pathforward", "name": "Path Forward", "url": "https://pathforward.org/returnships/", "tags": ["returners"], "where": "US", "for": "People returning after caregiving", "why": "A directory of every US returnship programme, with free resources."},
  {"id": "irelaunch", "name": "iRelaunch", "url": "https://jobs.irelaunch.com/", "tags": ["returners"], "where": "US & global", "for": "Mid-career returners", "why": "Employers here want you to call out your career break, not hide it."},
  {"id": "momproject", "name": "The Mom Project", "url": "https://themomproject.com/", "tags": ["returners", "women"], "where": "US", "for": "Mothers and allies", "why": "Vetted employers, returnships and mentoring, free to join."},
  {"id": "careerreturners", "name": "Career Returners", "url": "https://careerreturners.com/", "tags": ["returners"], "where": "UK", "for": "People returning after a break", "why": "UK returner programmes and roles, with a free community."},
  {"id": "honestjobs", "name": "Honest Jobs", "url": "https://www.honestjobs.com/for-job-seekers", "tags": ["secondchance"], "where": "US", "for": "People with a criminal record", "why": "Shows each employer's fair-chance hiring record and how a conviction affects eligibility."},
  {"id": "workingchance", "name": "Working Chance", "url": "https://workingchance.org/", "tags": ["secondchance", "women"], "where": "UK", "for": "Women with convictions", "why": "A UK charity offering job matching and support."},
  {"id": "myvisajobs", "name": "MyVisaJobs", "url": "https://www.myvisajobs.com/", "tags": ["visa"], "where": "US", "for": "H-1B and green card seekers", "why": "See which employers recently sponsored your role, before you apply."},
  {"id": "uscish1b", "name": "USCIS H-1B Employer Data Hub", "url": "https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub", "tags": ["visa"], "where": "US", "for": "Visa holders", "why": "Official government data on which employers actually got H-1B approvals."},
  {"id": "uksponsors", "name": "UK Register of Licensed Sponsors", "url": "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers", "tags": ["visa"], "where": "UK", "for": "People needing a UK work visa", "why": "The official list of employers allowed to sponsor UK work visas."},
  {"id": "relocate", "name": "Relocate.me", "url": "https://relocate.me/international-jobs", "tags": ["visa", "remote"], "where": "EU, UK, Canada & more", "for": "Tech workers moving countries", "why": "Jobs that come with visa or relocation support."},
  {"id": "wwr", "name": "We Work Remotely", "url": "https://weworkremotely.com/", "tags": ["remote"], "where": "Worldwide", "for": "Anyone who wants to work from home", "why": "A large, long-running remote board. Browse and apply without an account; skip the paid Pro plan."},
  {"id": "himalayas", "name": "Himalayas", "url": "https://himalayas.app/", "tags": ["remote", "salary"], "where": "Worldwide", "for": "Remote jobs worldwide", "why": "Over 100,000 remote jobs and free resume tools, with salary shown when employers give it.", "img": "himalayas"},
  {"id": "workingnomads", "name": "Working Nomads", "url": "https://www.workingnomads.com/jobs", "tags": ["remote"], "where": "Worldwide", "for": "Fully remote roles", "why": "A curated list of fully remote jobs, with free email alerts by category."},
  {"id": "wellfound", "name": "Wellfound", "url": "https://wellfound.com/jobs", "tags": ["remote", "salary"], "where": "US & worldwide", "for": "Startup jobs", "why": "Apply straight to founders, with salary and equity usually listed up front.", "img": "wellfound"},
  {"id": "idealist", "name": "Idealist", "url": "https://www.idealist.org/en", "tags": ["impact"], "where": "US & worldwide", "for": "Nonprofit and social-impact work", "why": "The biggest nonprofit job board, with a salary explorer to check what's fair.", "img": "idealist"},
  {"id": "workforgood", "name": "Work for Good", "url": "https://workforgood.org/", "tags": ["impact", "salary"], "where": "US", "for": "Nonprofit jobs", "why": "Search by cause and role. Many listings show the salary range.", "img": "workforgood"},
  {"id": "probablygood", "name": "Probably Good", "url": "https://jobs.probablygood.org/", "tags": ["impact"], "where": "Worldwide", "for": "High-impact careers", "why": "Hand-picked roles in health, policy, climate and more, with email alerts.", "img": "probablygood"},
  {"id": "climatebase", "name": "Climatebase", "url": "https://climatebase.org/jobs", "tags": ["impact"], "where": "Worldwide", "for": "Climate jobs", "why": "The main board for climate work. The board itself is free."},
  {"id": "levels", "name": "Levels.fyi Jobs", "url": "https://www.levels.fyi/jobs", "tags": ["salary"], "where": "US & worldwide", "for": "Mostly tech roles", "why": "Jobs sit next to real, verified pay data, so you can check an offer before you negotiate."},
  {"id": "builtin", "name": "Built In", "url": "https://builtin.com/jobs", "tags": ["salary"], "where": "US", "for": "Tech and business roles in US cities", "why": "Most listings show a salary range, and you can filter by pay.", "img": "builtin"},
  {"id": "wttj", "name": "Welcome to the Jungle", "url": "https://www.welcometothejungle.com/en/jobs", "tags": ["salary"], "where": "US, UK & France", "for": "Tech and startup roles", "why": "Formerly Otta. Detailed company profiles and a long push for employers to publish salaries."},
];
window.LS_refLink = function (url) {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'layoff.support');
    u.searchParams.set('utm_medium', 'referral');
    u.searchParams.set('utm_campaign', 'job_boards');
    return u.toString();
  } catch (e) { return url; }
};
