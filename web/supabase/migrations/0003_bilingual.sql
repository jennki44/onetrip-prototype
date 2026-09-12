-- Optional Traditional Chinese variants for trip content. The app shows the variant matching the viewer's language when present.
alter table itinerary_items add column title_zh text, add column note_zh text, add column flag_zh text;
alter table trip_days add column theme_zh text, add column stay_zh text, add column drive_zh text, add column rule_zh text, add column caption_zh text;
alter table places add column name_zh text;
alter table decisions add column title_zh text, add column question_zh text;
alter table decision_options add column label_zh text, add column sub_zh text;
