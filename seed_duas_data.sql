-- Seed Script: Insert Hardcoded Dua Categories and Duas into Database
-- Run this AFTER running database_schema_duas.sql
-- This script uses INSERT ... ON CONFLICT to avoid duplicates if run multiple times

-- Insert Categories
INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Morning Duas', 'sunny', 'morning')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Evening Duas', 'moon', 'evening')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Food & Drink', 'restaurant', 'food')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Travel', 'airplane', 'travel')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Sleep', 'bed', 'sleep')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Dua for Rizq (Sustenance)', 'cash', 'rizq')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Dua for Forgiveness', 'heart', 'forgiveness')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Dua for Health', 'medical', 'health')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Dua for Protection', 'shield', 'protection')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO dua_categories (id, name, icon, slug) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Dua for Guidance', 'compass', 'guidance')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- Insert Duas for Morning Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Morning Dua', 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ', 'Asbahna wa asbahal mulku lillah', 'We have reached the morning and at this very time all sovereignty belongs to Allah', 'Sahih Muslim 2723', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Protection Dua', 'اللَّهُمَّ بِكَ أَصْبَحْنَا', 'Allahumma bika asbahna', 'O Allah, by You we enter the morning', 'Sunan Abu Dawud 5068', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Evening Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Evening Dua', 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ', 'Amsayna wa amsal mulku lillah', 'We have reached the evening and at this very time all sovereignty belongs to Allah', 'Sahih Muslim 2723', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Protection Dua', 'اللَّهُمَّ بِكَ أَمْسَيْنَا', 'Allahumma bika amsayna', 'O Allah, by You we enter the evening', 'Sunan Abu Dawud 5068', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Food & Drink Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Before Eating', 'بِسْمِ اللَّهِ', 'Bismillah', 'In the name of Allah', 'Sahih al-Bukhari 5376', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'After Eating', 'الْحَمْدُ لِلَّهِ', 'Alhamdulillah', 'Praise be to Allah', 'Sahih al-Bukhari 5458', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Travel Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Travel Dua', 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا', 'Subhanalladhi sakhkhara lana hadha', 'Glory to Him who has brought this under our control', 'Sahih al-Bukhari 2992', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Sleep Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Before Sleep', 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي', 'Bismika rabbi wada''tu janbi', 'In Your name, my Lord, I lay down my side', 'Sahih al-Bukhari 6320', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'After Waking', 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا', 'Alhamdulillahil ladhi ahyana', 'Praise be to Allah who gave us life', 'Sahih al-Bukhari 6314', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Rizq Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Dua for Sustenance', 'اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ', 'Allahumma akfini bihalalika ''an haramika, wa aghnini bifadhlika ''amman siwaka', 'O Allah, suffice me with what You have allowed instead of what You have forbidden, and make me independent of all others besides You', 'Sunan at-Tirmidhi 3563', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Dua for Increase in Provision', 'اللَّهُمَّ بَارِكْ لِي فِيمَا رَزَقْتَنِي', 'Allahumma barik li fima razaqtani', 'O Allah, bless me in what You have provided me', 'Sahih al-Bukhari 5379', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Dua for Good Provision', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ''adhaban-nar', 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire', 'Surah Al-Baqarah 2:201', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Forgiveness Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Seeking Forgiveness', 'اللَّهُمَّ اغْفِرْ لِي', 'Allahummaghfirli', 'O Allah, forgive me', 'Sahih Muslim 484', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Comprehensive Forgiveness Dua', 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ', 'Rabbi ghfirli wa tub ''alayya innaka antat-tawwabur-rahim', 'My Lord, forgive me and accept my repentance, for You are the Accepter of Repentance, the Merciful', 'Sahih al-Bukhari 6307', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Astaghfirullah', 'أَسْتَغْفِرُ اللَّهَ', 'Astaghfirullah', 'I seek forgiveness from Allah', 'General', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Dua of Prophet Adam', 'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', 'Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin', 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers', 'Surah Al-A''raf 7:23', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Health Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Dua for Healing', 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي', 'Allahumma ''afini fi badani, Allahumma ''afini fi sam''i, Allahumma ''afini fi basari', 'O Allah, grant me health in my body, O Allah, grant me health in my hearing, O Allah, grant me health in my sight', 'Sunan Abu Dawud 5090', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Dua for Sick Person', 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ وَاشْفِ أَنْتَ الشَّافِي لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا', 'Allahumma rabban-nasi adhhibil-ba''sa washfi antash-shafi la shifa''a illa shifa''uka shifa''an la yughadiru saqaman', 'O Allah, Lord of mankind, remove the harm and cure, for You are the Healer. There is no cure except Your cure, a cure that leaves no illness', 'Sahih al-Bukhari 5743', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Protection Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Seeking Protection from Evil', 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ كُلِّ دَابَّةٍ أَنْتَ آخِذٌ بِنَاصِيَتِهَا', 'Allahumma inni a''udhu bika min sharri nafsi wa min sharri kulli dabatin anta akhidhun binasiyatiha', 'O Allah, I seek refuge in You from the evil of my soul and from the evil of every living creature that You hold by its forelock', 'Sunan at-Tirmidhi 3522', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Morning Protection', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 'A''udhu bikalimatillahit-tammati min sharri ma khalaq', 'I seek refuge in the perfect words of Allah from the evil of what He has created', 'Sahih Muslim 2708', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert Duas for Guidance Category
INSERT INTO duas (id, category_id, name, arabic_text, transliteration, translation, reference, audio_url, audio_url_fallback) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Dua for Guidance', 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ', 'Rabbana la tuzigh qulubana ba''da idh hadaytana wa hab lana min ladunka rahmatan innaka antal-wahhab', 'Our Lord, do not let our hearts deviate after You have guided us. Grant us Your mercy. You are indeed the Giver of all gifts', 'Surah Ali Imran 3:8', NULL, NULL),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Dua for Right Path', 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Ihdinas-siratal-mustaqim', 'Guide us to the straight path', 'Surah Al-Fatiha 1:6', NULL, NULL)
ON CONFLICT (id) DO NOTHING;




