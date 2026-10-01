-- Optional: loads the six placeholder events the site already shows, so the
-- Events page isn't empty on day one. Run once, after the migration.
-- Delete or edit them from the admin dashboard afterwards.

insert into public.events
  (title, category, status, event_date, description, details, highlights_title, highlights_items, capacity, form_fields)
values
  ('NeoFolks Winter Hackathon', 'Competitions', 'upcoming', '2026-12-12',
   'A 24-hour build sprint for teams across the university.',
   'A 24-hour build sprint for teams across the university. Form a team, pick a problem, and ship a working prototype before the clock runs out, with mentors on hand to help you get unstuck.',
   'What to expect',
   array['24 hours of hands-on building in teams','Mentors from the NeoFolks community on hand','Live demos and feedback at the end','Open to every student, no experience required'],
   100,
   '[{"id":"dept","label":"Department","type":"text","required":true},
     {"id":"year","label":"Year of study","type":"select","required":true,"options":["1st year","2nd year","3rd year","4th year"]},
     {"id":"team","label":"Team name (if you have one)","type":"text","required":false}]'::jsonb),

  ('Intro to Cloud Computing', 'Workshops', 'upcoming', '2026-11-14',
   'A hands-on primer on deploying your first cloud application.',
   'A hands-on primer on deploying your first cloud application. You will go from an empty account to a live app, picking up the core ideas of compute, storage and networking along the way.',
   'What you will learn',
   array['Core cloud concepts: compute, storage and networking','Deploying a simple app end to end','Keeping costs under control with free tiers','Where to go next after your first deployment'],
   40,
   '[{"id":"dept","label":"Department","type":"text","required":true},
     {"id":"year","label":"Year of study","type":"select","required":true,"options":["1st year","2nd year","3rd year","4th year"]},
     {"id":"laptop","label":"I will bring a laptop","type":"checkbox","required":true}]'::jsonb),

  ('AI/ML Bootcamp', 'Workshops', 'past', '2026-08-22',
   'A weekend series covering the fundamentals of applied machine learning.',
   'A weekend series covering the fundamentals of applied machine learning, from preparing data to training and evaluating your first models.',
   'What we covered',
   array['Cleaning and exploring real datasets','Training and evaluating a first model','Common pitfalls such as overfitting and data leakage','How machine learning fits into real projects'],
   null, '[]'::jsonb),

  ('Industry Expert Talk: Careers in Tech', 'Seminars', 'past', '2026-03-20',
   'An evening session with alumni working across the tech industry.',
   'An evening session with alumni working across the tech industry, sharing how they got started and what they wish they had known as students.',
   'Topics discussed',
   array['Paths into the tech industry','Skills employers look for in graduates','Lessons from first jobs','Open Q&A with the audience'],
   null, '[]'::jsonb),

  ('NeoFolks Founding Meetup', 'Community', 'past', '2025-09-15',
   'The first gathering of NeoFolks members on campus.',
   'The first gathering of NeoFolks members on campus, where the club''s founding members met, shared ideas and set the direction for what came next.',
   'Highlights',
   array['Meeting the founding members','Sharing ideas for what NeoFolks could become','Planning the first workshops and events'],
   null, '[]'::jsonb),

  ('Web Development Sprint', 'Workshops', 'past', '2025-11-08',
   'A three-day sprint building full-stack web projects in teams.',
   'A three-day sprint building full-stack web projects in teams, from a blank repository to a deployed application.',
   'What we built',
   array['Full-stack projects built in small teams','Collaboration with Git and pull requests','Deploying the finished project'],
   null, '[]'::jsonb);
