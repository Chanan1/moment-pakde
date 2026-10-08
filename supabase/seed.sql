-- Seed Data untuk Moment Pakde (Komunitas MagangHub)
-- Menghadirkan data awal realistis untuk pengujian lokal & staging

-- 1. Profiles (Simulasi akun magang)
insert into public.profiles (id, username, display_name, role, bio)
values
  ('00000000-0000-0000-0000-000000000001', 'admin_magang', 'Admin MagangHub', 'admin', 'Menjaga ketertiban dan kehangatan komunitas anak magang.'),
  ('00000000-0000-0000-0000-000000000002', 'mod_pakde', 'Kang Moderator', 'moderator', 'Siap menyaring drama dan membiarkan canda tawa tetap mengalir.'),
  ('00000000-0000-0000-0000-000000000003', 'budi_frontend', 'Budi Santoso', 'user', 'Anak magang FE yang sering pusing sama centering div tapi tetap ceria.'),
  ('00000000-0000-0000-0000-000000000004', 'sarah_uiux', 'Sarah Annisa', 'user', 'UI/UX enthusiast. Suka desain figma sampai subuh bareng tim batch 3.'),
  ('00000000-0000-0000-0000-000000000005', 'dimas_backend', 'Dimas Prasetyo', 'user', 'Backend intern. Kopi hitam tanpa gula adalah bahan bakar harian.')
on conflict (id) do nothing;

-- 2. Tags
insert into public.tags (slug)
values
  ('haripertama'),
  ('lembur'),
  ('makansiang'),
  ('farewell'),
  ('batch3'),
  ('kantor')
on conflict (slug) do nothing;

-- 3. Momen Sampel
insert into public.moments (id, user_id, caption, moment_date, location, status, reaction_count, comment_count)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Hari pertama onboarding magang! Dapat merchandise kaos dan tumbler kece. Siap belajar banyak hal baru bareng temen-temen hebat! 🚀',
    now() - interval '10 days',
    'Auditorium MagangHub Lantai 4',
    'published',
    12,
    3
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Makan siang bareng squad desain di warung pojok seberang kantor. Es teh jumbo dan ayam geprek menyelamatkan hari deadline! 🍜✨',
    now() - interval '5 days',
    'Warung Pojok Bu Sri',
    'published',
    8,
    2
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'Deploy sprint 2 jam 11 malam akhirnya sukses tanpa error 500! Terima kasih mentor yang sabar nemenin review PR.',
    now() - interval '2 days',
    'Ruang Kolaborasi Tech',
    'published',
    15,
    4
  )
on conflict (id) do nothing;

-- 4. Tag Relasi Momen
insert into public.moment_tags (moment_id, tag_id)
select '10000000-0000-0000-0000-000000000001', id from public.tags where slug in ('haripertama', 'batch3')
on conflict do nothing;

insert into public.moment_tags (moment_id, tag_id)
select '10000000-0000-0000-0000-000000000002', id from public.tags where slug in ('makansiang', 'kantor')
on conflict do nothing;

insert into public.moment_tags (moment_id, tag_id)
select '10000000-0000-0000-0000-000000000003', id from public.tags where slug in ('lembur', 'batch3')
on conflict do nothing;

-- 5. Confess Sampel
insert into public.confessions (
  id,
  short_id,
  body,
  recipient,
  category,
  status,
  sender_hash,
  secret_code_hash,
  auto_flags,
  reaction_count,
  created_at,
  published_at
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'c1a2b3c4',
    'Buat anak magang divisi frontend yang pakai kacamata bulat dan hoodie abu-abu pas onboarding: senyum kamu manis banget waktu sesi ice breaking. Semoga kita bisa satu project ya! 👉👈',
    'Anak FE Kacamata',
    'naksir',
    'published',
    'seed_sender_hash_1',
    'seed_secret_hash_1',
    '{}',
    18,
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'd5e6f7a8',
    'Makasih banget buat Mas Mentor yang kemarin udah nraktir kopi pas sprint review. Awalnya takut banget presentasi, tapi feedback-nya bikin semangat lagi.',
    'Mas Mentor Squad A',
    'terima_kasih',
    'published',
    'seed_sender_hash_2',
    'seed_secret_hash_2',
    '{}',
    24,
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'g9h0i1j2',
    'Jujur kadang ngerasa imposter syndrome banget di sini. Temen-temen magang yang lain pada jago-jago banget coding-nya. Tapi aku janji bakal terus belajar dan gak nyerah!',
    null,
    'curhat',
    'published',
    'seed_sender_hash_3',
    'seed_secret_hash_3',
    '{}',
    35,
    now() - interval '1 day',
    now() - interval '1 day'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'k3l4m5n6',
    'Maaf banget buat tim UI/UX, kemarin pas daily standup aku telat 10 menit gara-gara macet di jalan layang. Besok aku usahakan berangkat lebih pagi ya Lur.',
    'Tim UI/UX Batch 3',
    'minta_maaf',
    'published',
    'seed_sender_hash_4',
    'seed_secret_hash_4',
    '{}',
    6,
    now() - interval '12 hours',
    now() - interval '12 hours'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    'o7p8q9r0',
    'AC di lantai 3 dinginnya kayak kutub utara Lur 🥶 Jaket tebel pun tembus. Tolong dong yang megang remote AC suhunya dinaikin dikit.',
    null,
    'unek_unek',
    'published',
    'seed_sender_hash_5',
    'seed_secret_hash_5',
    '{}',
    42,
    now() - interval '4 hours',
    now() - interval '4 hours'
  )
on conflict (id) do nothing;
