-- The launch catalogue. Idempotent so it is safe to re-run.
insert into public.stacks (slug, name, description) values
  ('data-analysis', 'Data Analysis', 'Collect, clean, analyse and visualise data to drive decisions.'),
  ('frontend', 'Frontend Development', 'Build fast, accessible and interactive web interfaces.'),
  ('backend', 'Backend Development', 'Design APIs, databases and the server-side logic behind products.'),
  ('cloud-devops', 'Cloud Computing / DevOps', 'Deploy, scale and operate software on the cloud with modern DevOps practice.'),
  ('game-development', 'Game Development', 'Design and build games from mechanics to polish.'),
  ('ui-ux', 'UI/UX Design', 'Research, design and prototype products people love to use.'),
  ('product-management', 'Product Management', 'Discover problems, define products and lead them to market.'),
  ('machine-learning', 'Machine Learning', 'Build and evaluate models that learn from data.')
on conflict (slug) do nothing;
