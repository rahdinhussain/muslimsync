// Refresh complete Quran verses only. The two catalog entries below contain the
// entire ayah. Shorter quotations have separate editorial drafts.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const verses = [
  {sura:1, aya:6, reference:'Surah Al-Fatiha 1:6', arabic:'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ'},
  {sura:3, aya:8, reference:'Surah Ali Imran 3:8', arabic:'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ'}
];
const locale = 'ur';
const edition = 'urdu_junagarhi';
function letters(s) {
  return s.normalize('NFKC').replace(/ٱ/g,'ا').replace(/ٰ/g,'ا').replace(/[\p{Mark}\u0640]/gu,'').replace(/\s/g,'');
}
async function get(path) {
  const r=await fetch('https://quranenc.com/api/v1/'+path,{signal:AbortSignal.timeout(15000)});
  if (!r.ok) throw Error('QuranEnc returned '+r.status);
  return r.json();
}
const catalog=await get('translations/list/'+locale+'?localization=en');
const book=catalog.translations.find(x=>x.key===edition && x.language_iso_code===locale);
assert.ok(book?.version && book.title.includes('Junagarhi'),'Published edition unavailable');
const rows=[];
for (const v of verses) {
  const {result}=await get('translation/aya/'+edition+'/'+v.sura+'/'+v.aya);
  assert.equal(Number(result.sura),v.sura);
  assert.equal(Number(result.aya),v.aya);
  assert.equal(letters(result.arabic_text),letters(v.arabic));
  assert.ok(result.translation?.trim());
  rows.push({arabic:v.arabic,reference:v.reference,
    meaning:result.translation+(result.footnotes?'\n\n'+result.footnotes:''),
    source:book.title+' · QuranEnc.com · '+book.version+' · https://quranenc.com/en/browse/'+edition+'/'+v.sura+'#'+v.aya});
}
if(process.argv.includes('--publish')) {
  const sql=`WITH edition AS (SELECT * FROM jsonb_to_recordset(:'items'::jsonb) v(arabic text,reference text,meaning text,source text))
    UPDATE public.dua_translations t SET translation=e.meaning, source=e.source, reviewed=true
    FROM edition e JOIN public.duas d ON d.arabic_text=e.arabic AND d.reference=e.reference
    WHERE t.dua_id=d.id AND t.locale='ur' AND
      ((NOT t.reviewed AND t.source='Muslim Sync · AI-assisted Urdu rendering of the Arabic excerpt') OR t.source LIKE '%QuranEnc.com%/urdu_junagarhi/%')
      AND (t.translation,t.source,t.reviewed) IS DISTINCT FROM (e.meaning,e.source,true);`;
  const job=spawnSync(process.env.PSQL || 'psql',['-X','-v','ON_ERROR_STOP=1','-v','items='+JSON.stringify(rows)],{input:sql,encoding:'utf8'});
  if (job.status!==0) throw Error(job.stderr || 'Database unavailable');
  process.stdout.write(job.stdout);
}
console.log('Validated '+rows.length+' complete Urdu verses in '+edition+' '+book.version+'.');
