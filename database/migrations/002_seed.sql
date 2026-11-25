-- مسؤول عن: بيانات أولية (السكنز والأصوات بس)
insert into skins (slug, name, metadata, is_public)
values
  ('alice', 'Alice in Wonderland', '{"source": "public domain", "notes": "Original placeholder art for the public domain story pack."}', true),
  ('shahrazad', 'Shahrazad', '{"source": "public domain", "notes": "Respectful placeholder art for the storyteller theme."}', true)
on conflict (slug) do nothing;

-- مفيش كود تفعيل هنا. الأكواد بتتعمل بـ scripts/make-activation-code.mjs وبتتضاف يدويًا (مخزّنة كهاش).
