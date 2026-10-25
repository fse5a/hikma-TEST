insert into skins (slug, name, metadata, is_public)
values
  ('alice', 'Alice in Wonderland', '{"source": "public domain", "notes": "Original placeholder art for the public domain story pack."}', true),
  ('shahrazad', 'Shahrazad', '{"source": "public domain", "notes": "Respectful placeholder art for the storyteller theme."}', true)
on conflict (slug) do nothing;

insert into activation_codes (code, created_by)
values
  ('DEMO-1234', null)
on conflict (code) do nothing;
