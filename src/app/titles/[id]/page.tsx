'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getOrdinal, buildSeasonTitle, formatScore, scoreColor } from '@/lib/utils';

// ─── CSS global ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fadeInUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideLeft {
    from { opacity:0; transform:translateX(-16px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity:0; transform:scale(0.94); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position:-600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes pulse {
    0%,100% { opacity:1; } 50% { opacity:.5; }
  }

  /* Poster overlay */
  .tp-poster-wrap:hover .tp-poster-overlay { opacity:1 !important; }

  /* Relation card */
  .tp-rel-card { transition:transform .18s,box-shadow .18s; }
  .tp-rel-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.45); }
  .tp-rel-card:hover .tp-rel-title { color:rgb(230,125,153) !important; }

  /* Rec card */
  .tp-rec-card img { transition:transform .28s ease; }
  .tp-rec-card:hover img { transform:scale(1.06); }

  /* Char / staff */
  .tp-char-card { transition:background .15s; }
  .tp-char-card:hover { background:#322f2f !important; }
  .tp-staff-card { transition:background .15s; }
  .tp-staff-card:hover { background:#322f2f !important; }

  /* Tabs */
  .tp-tab { transition:color .15s,border-color .15s; }
  .tp-tab:hover { color:rgb(230,125,153) !important; }

  /* Status btn */
  .tp-status-btn { transition:transform .12s,box-shadow .18s,opacity .15s; }
  .tp-status-btn:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.4); }
  .tp-status-btn:active { transform:translateY(0); }

  /* Scrollbar */
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:#2a2727;}
  ::-webkit-scrollbar-thumb{background:rgba(230,125,153,.4);border-radius:3px;}
  ::-webkit-scrollbar-thumb:hover{background:rgba(230,125,153,.7);}

  /* Anim helpers */
  .anim-fade-up { animation:fadeInUp .4s ease both; }
  .anim-fade-in { animation:fadeIn .3s ease both; }
  .anim-scale-in { animation:scaleIn .28s ease both; }
`;

// ─── Cores ─────────────────────────────────────────────────────────────────────
const BG     = '#3a3737';
const CARD   = '#2a2727';
const ACCENT = 'rgb(230,125,153)';
const MUTED  = '#92a0ad';
const TEXT   = '#e0e4e8';

// Mapa de labels para relation types
const REL_LABEL: Record<string,string> = {
  PREQUEL:'PREQUEL', SEQUEL:'SEQUEL', SPIN_OFF:'SPIN OFF',
  SIDE_STORY:'SIDE STORY', ADAPTATION:'ADAPTATION',
  ALTERNATIVE:'ALTERNATIVE', SUMMARY:'SUMMARY', OTHER:'OTHER',
};

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface CastMember {
  id:number; name:string; character:string;
  profile_path:string|null; order:number;
}
interface CrewMember {
  id:number; name:string; job:string;
  department:string; profile_path:string|null;
}
interface VideoItem {
  id:string; key:string; name:string;
  type:string; site:string; official:boolean;
}
interface Episode {
  id:number; name:string; episode_number:number;
  still_path:string|null; air_date:string; vote_average:number;
}
interface ProductionCo { id:number; name:string; logo_path:string|null; origin_country:string; }

interface RelationItem {
  slug:string; relationType:string; title:string;
  poster_path:string|null; kind:'movie'|'tv';
  year?:string; seasonNumber?:number;
}

interface TmdbSeasonStub {
  id:number; name:string; season_number:number;
  poster_path:string|null; air_date:string; episode_count:number;
}

interface TmdbShow {
  id:number; name:string; original_name:string; overview:string;
  backdrop_path:string|null; poster_path:string|null;
  vote_average:number; popularity:number; status:string;
  genres:{id:number;name:string}[];
  seasons:TmdbSeasonStub[];
  number_of_seasons:number; number_of_episodes:number;
  first_air_date:string; last_air_date:string|null; in_production:boolean;
  production_companies:ProductionCo[];
  networks:{id:number;name:string;logo_path:string|null}[];
  credits:{cast:CastMember[];crew:CrewMember[]};
  videos:{results:VideoItem[]};
  recommendations:{results:TmdbRec[]};
}

interface TmdbSeasonDetail {
  id:number; name:string; overview:string; poster_path:string|null;
  air_date:string; season_number:number; vote_average:number;
  episodes:Episode[];
  credits?:{cast:CastMember[];crew:CrewMember[]};
  videos?:{results:VideoItem[]};
}

interface TmdbMovie {
  id:number; title:string; original_title:string; overview:string;
  backdrop_path:string|null; poster_path:string|null;
  vote_average:number; popularity:number; status:string;
  genres:{id:number;name:string}[];
  runtime:number; release_date:string;
  production_companies:ProductionCo[];
  // Coleção: é aqui que o TMDB registra franquias (Mario → Mario Galaxy)
  belongs_to_collection:{id:number;name:string;poster_path:string|null}|null;
  credits:{cast:CastMember[];crew:CrewMember[]};
  videos:{results:VideoItem[]};
  recommendations:{results:TmdbRec[]};
}

interface TmdbRec {
  id:number; title?:string; name?:string; poster_path:string|null;
  vote_average:number; media_type?:string;
  release_date?:string; first_air_date?:string;
}

interface TmdbCollection {
  id:number; name:string;
  parts:{id:number;title:string;poster_path:string|null;release_date:string}[];
}

interface EntryData {
  id:string; tmdbId:number; parentTmdbId?:number|null; seasonNumber?:number|null;
  title:string; type:'MOVIE'|'TV_SEASON'; status:string;
  score:number; progress:number; totalEpisodes?:number|null;
  imagePath?:string|null; startDate?:string|null; finishDate?:string|null;
  rewatchCount?:number; notes?:string|null; hidden?:boolean;
  releaseDate?:string|null; endDate?:string|null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB    = 'https://api.themoviedb.org/3';

const getYear = (d?:string|null) => d?.split('-')[0] ?? '';
const tmdbImg = (p:string|null|undefined, size='w342') =>
  p ? `https://image.tmdb.org/t/p/${size}${p}` : null;


function getFormat(networks:any[],companies:any[]){
  const s=['Netflix','Amazon','Prime Video','Hulu','Disney+','Apple TV+','Max','Paramount+','Crunchyroll','Peacock'];
  return[...networks,...companies].some(c=>s.some(k=>c.name?.toLowerCase().includes(k.toLowerCase())))
    ?'Streaming':'TV';
}
function getSeasonStatus(eps:Episode[]):string{
  const today=new Date().toISOString().split('T')[0];
  const aired=eps.filter(e=>e.air_date&&e.air_date<=today);
  if(!aired.length)return'Not Yet Aired';
  if(aired.length===eps.length)return'Finished';
  return'Airing';
}
// Score: TMDB usa 0-10, não %, converte para decimal com 1 casa

function statusColor(st?:string){
  const m:Record<string,string>={
    WATCHING:'#3db4f2',COMPLETED:'#2ecc71',PAUSED:'#f1c40f',
    DROPPED:'#e74c3c',REWATCHING:'#9b59b6',UPCOMING:'#e67e22',PLANNING:ACCENT,
  };
  return m[st??'']??ACCENT;
}
function parseSlug(slug:string):
  |{kind:'movie';movieId:number}
  |{kind:'tv';showId:number;seasonNumber:number}
  |{kind:'unknown'}{
  const tv=slug.match(/^tv-(\d+)-s(\d+)$/);
  if(tv)return{kind:'tv',showId:+tv[1],seasonNumber:+tv[2]};
  const mo=slug.match(/^movie-(\d+)$/);
  if(mo)return{kind:'movie',movieId:+mo[1]};
  const nu=slug.match(/^(\d+)$/);
  if(nu)return{kind:'movie',movieId:+nu[1]};
  return{kind:'unknown'};
}

// ─── Skeleton shimmer ──────────────────────────────────────────────────────────
function Sk({w='100%',h='16px',r='4px'}:{w?:string;h?:string;r?:string}){
  return<div style={{
    width:w,height:h,borderRadius:r,
    background:`linear-gradient(90deg,#2a2727 25%,#333030 50%,#2a2727 75%)`,
    backgroundSize:'600px 100%',
    animation:'shimmer 1.4s infinite linear',
  }}/>;
}

// ─── Loading screen cinematográfico ───────────────────────────────────────────
function LoadingScreen(){
  return(
    <div style={{
      position:'fixed',inset:0,background:BG,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      gap:32,fontFamily:'Overpass,sans-serif',zIndex:9999,
      animation:'fadeIn .3s ease',
    }}>
      {/* Spinner rosa */}
      <div style={{
        width:54,height:54,borderRadius:'50%',
        border:'3px solid rgba(230,125,153,.18)',
        borderTopColor:ACCENT,
        animation:'spin .85s linear infinite',
      }}/>

      {/* Esqueleto da página */}
      <div style={{width:900,maxWidth:'92vw',display:'flex',gap:28}}>
        {/* Sidebar */}
        <div style={{width:200,flexShrink:0,display:'flex',flexDirection:'column',gap:10}}>
          <Sk w="200px" h="295px" r="6px"/>
          <Sk w="200px" h="38px" r="4px"/>
          <div style={{background:CARD,borderRadius:4,padding:16,display:'flex',flexDirection:'column',gap:10}}>
            {[...Array(8)].map((_,i)=><div key={i} style={{display:'flex',flexDirection:'column',gap:4}}>
              <Sk w="55%" h="10px"/><Sk w="80%" h="13px"/>
            </div>)}
          </div>
        </div>
        {/* Main */}
        <div style={{flex:1,paddingTop:90,display:'flex',flexDirection:'column',gap:14}}>
          <Sk w="60%" h="30px"/><Sk w="18%" h="13px"/>
          <Sk h="130px" r="4px"/><Sk h="100px" r="4px"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[...Array(4)].map((_,i)=><Sk key={i} h="80px" r="4px"/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Editar Capa (CORRIGIDO: aceita qualquer URL, inclusive do TMDB) ───
function CoverModal({entryId,current,onSaved,onClose}:{
  entryId:string; current:string|null;
  onSaved:(p:string)=>void; onClose:()=>void;
}){
  const[url,setUrl]=useState(current && (current.startsWith('http') || current.startsWith('https')) ? current : '');
  const[saving,setSaving]=useState(false);
  const[preview,setPreview]=useState(url);
  const inp:React.CSSProperties={
    width:'100%',padding:'9px 12px',background:'#1e1c1c',
    border:'1px solid rgba(255,255,255,.08)',borderRadius:4,
    color:TEXT,fontSize:12,boxSizing:'border-box',fontFamily:'Overpass,sans-serif',
  };
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};
    document.addEventListener('keydown',h);
    document.body.style.overflow='hidden';
    return()=>{document.removeEventListener('keydown',h);document.body.style.overflow='';};
  },[]);
  async function save(){
    if(!url.trim())return;
    setSaving(true);
    const res=await fetch(`/api/entries/${entryId}`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({imagePath:url.trim()}),
    });
    setSaving(false);
    if(res.ok){onSaved(url.trim());}
    else alert('Erro ao salvar capa. Verifique /api/entries/[id].');
  }
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.78)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'fadeIn .2s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:CARD,borderRadius:8,padding:28,width:'100%',maxWidth:440,boxShadow:'0 20px 60px rgba(0,0,0,.65)',animation:'scaleIn .25s ease'}}>
        <div style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:20}}>🖼 Alterar Capa</div>
        <div style={{display:'flex',gap:16,marginBottom:20}}>
          <div style={{width:88,height:132,borderRadius:4,overflow:'hidden',background:'#1a1a1a',flexShrink:0,border:'1px solid rgba(255,255,255,.06)'}}>
            {preview
              ?<img src={preview} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="preview" onError={()=>setPreview('')}/>
              :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,fontSize:11,textAlign:'center',padding:6}}>Preview</div>}
          </div>
          <div style={{flex:1}}>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:MUTED,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>URL da imagem (qualquer domínio)</label>
            <input value={url} onChange={e=>{setUrl(e.target.value);setPreview(e.target.value);}} placeholder="https://image.tmdb.org/t/p/original/..." style={inp}/>
            <p style={{fontSize:11,color:MUTED,lineHeight:1.5,marginTop:8}}>
              Cole a URL completa da imagem (ex: do TMDB ou qualquer outro host). 
              A capa será salva no banco e refletirá em <strong style={{color:TEXT}}>todo o site</strong>.
            </p>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={save} disabled={saving||!url.trim()} style={{flex:1,padding:11,background:ACCENT,border:'none',borderRadius:4,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',opacity:(!url.trim()||saving)?0.5:1,fontFamily:'Overpass,sans-serif'}}>
            {saving?'Salvando...':'✓ Salvar no site'}
          </button>
          <button onClick={onClose} style={{flex:1,padding:11,background:'transparent',border:'1px solid rgba(255,255,255,.1)',borderRadius:4,color:MUTED,fontSize:14,cursor:'pointer',fontFamily:'Overpass,sans-serif'}}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Adicionar Relation ─────────────────────────────────────────────────
function AddRelModal({onAdd,onClose}:{
  onAdd:(r:RelationItem)=>void; onClose:()=>void;
}){
  const[kind,setKind]=useState<'movie'|'tv'>('tv');
  const[tmdbId,setTmdbId]=useState('');
  const[sn,setSn]=useState('1');
  const[relType,setRelType]=useState('SEQUEL');
  const[loading,setLoading]=useState(false);
  const[preview,setPreview]=useState<any>(null);
  const[err,setErr]=useState('');

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};
    document.addEventListener('keydown',h);
    document.body.style.overflow='hidden';
    return()=>{document.removeEventListener('keydown',h);document.body.style.overflow='';};
  },[]);

  async function search(){
    const id=parseInt(tmdbId);if(isNaN(id)){setErr('TMDB ID inválido');return;}
    setLoading(true);setErr('');setPreview(null);
    try{
      if(kind==='movie'){
        const r=await fetch(`${TMDB}/movie/${id}?api_key=${API_KEY}&language=pt-BR`);
        const d=await r.json();if(d.status_code)throw new Error('Não encontrado');
        setPreview({title:d.title,poster:d.poster_path,year:getYear(d.release_date)});
      }else{
        const snN=parseInt(sn)||1;
        const[sr,pr]=await Promise.all([
          fetch(`${TMDB}/tv/${id}/season/${snN}?api_key=${API_KEY}&language=pt-BR`),
          fetch(`${TMDB}/tv/${id}?api_key=${API_KEY}&language=pt-BR`),
        ]);
        const[sd,pd]=await Promise.all([sr.json(),pr.json()]);
        setPreview({title:buildSeasonTitle(pd.name,snN),poster:sd.poster_path??pd.poster_path,year:getYear(sd.air_date),snN});
      }
    }catch(e:any){setErr(e.message??'Erro ao buscar.');}
    finally{setLoading(false);}
  }

  function confirm(){
    if(!preview)return;
    const id=parseInt(tmdbId);const snN=parseInt(sn)||1;
    onAdd(kind==='movie'
      ?{slug:`movie-${id}`,relationType:relType,title:preview.title,poster_path:preview.poster,kind:'movie',year:preview.year}
      :{slug:`tv-${id}-s${snN}`,relationType:relType,title:preview.title,poster_path:preview.poster,kind:'tv',year:preview.year,seasonNumber:snN}
    );
    onClose();
  }

  const inp:React.CSSProperties={width:'100%',padding:'9px 12px',background:'#1e1c1c',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:TEXT,fontSize:13,boxSizing:'border-box',fontFamily:'Overpass,sans-serif'};
  const lbl:React.CSSProperties={display:'block',fontSize:11,fontWeight:700,color:MUTED,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7};
  const ALL_RELS=['SEQUEL','PREQUEL','SPIN_OFF','SIDE_STORY','ADAPTATION','ALTERNATIVE','SUMMARY','OTHER'];

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.78)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'fadeIn .2s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:CARD,borderRadius:8,padding:26,width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,.65)',animation:'scaleIn .25s ease',display:'flex',flexDirection:'column',gap:16}}>
        <div style={{fontSize:16,fontWeight:700,color:TEXT}}>➕ Adicionar Relation</div>
        {/* Tipo de mídia */}
        <div>
          <label style={lbl}>Tipo de mídia</label>
          <div style={{display:'flex',gap:8}}>
            {(['tv','movie']as const).map(k=>(
              <button key={k} onClick={()=>setKind(k)} style={{flex:1,padding:8,background:kind===k?ACCENT:'#1e1c1c',border:'none',borderRadius:4,color:kind===k?'white':MUTED,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'Overpass,sans-serif'}}>
                {k==='tv'?'📺 Série':'🎬 Filme'}
              </button>
            ))}
          </div>
        </div>
        {/* Tipo de relação */}
        <div>
          <label style={lbl}>Tipo de relação</label>
          <select value={relType} onChange={e=>setRelType(e.target.value)} style={inp}>
            {ALL_RELS.map(r=><option key={r} value={r}>{REL_LABEL[r]??r}</option>)}
          </select>
        </div>
        {/* ID */}
        <div>
          <label style={lbl}>TMDB ID {kind==='tv'?'(da série pai, ex: 95557)':'(do filme)'}</label>
          <input value={tmdbId} onChange={e=>setTmdbId(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="ex: 95557" style={inp}/>
        </div>
        {kind==='tv'&&<div>
          <label style={lbl}>Número da temporada</label>
          <input value={sn} onChange={e=>setSn(e.target.value)} type="number" min="1" style={inp}/>
        </div>}
        {err&&<div style={{fontSize:12,color:'#e74c3c',padding:'6px 10px',background:'rgba(231,76,60,.12)',borderRadius:4}}>{err}</div>}
        {preview&&(
          <div style={{display:'flex',gap:12,background:'#1e1c1c',borderRadius:4,padding:12,animation:'fadeIn .2s ease'}}>
            {preview.poster&&<img src={tmdbImg(preview.poster,'w92')!} style={{width:46,height:69,objectFit:'cover',borderRadius:3}} alt="prev"/>}
            <div>
              <div style={{fontSize:13,fontWeight:700,color:TEXT}}>{preview.title}</div>
              <div style={{fontSize:11,color:MUTED,marginTop:3}}>{preview.year}</div>
              <div style={{fontSize:11,color:ACCENT,marginTop:4,fontWeight:700}}>{REL_LABEL[relType]??relType}</div>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:8}}>
          <button onClick={search} disabled={loading} style={{flex:1,padding:10,background:'#1e1c1c',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:TEXT,fontSize:13,cursor:'pointer',fontFamily:'Overpass,sans-serif',fontWeight:600}}>
            {loading?'⏳ Buscando...':'🔍 Buscar'}
          </button>
          {preview&&<button onClick={confirm} style={{flex:1,padding:10,background:ACCENT,border:'none',borderRadius:4,color:'white',fontSize:13,cursor:'pointer',fontFamily:'Overpass,sans-serif',fontWeight:700}}>✓ Confirmar</button>}
          <button onClick={onClose} style={{padding:'10px 14px',background:'transparent',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:MUTED,fontSize:13,cursor:'pointer',fontFamily:'Overpass,sans-serif'}}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: List Editor ────────────────────────────────────────────────────────
function ListEditorModal({entry,isTV,showId,seasonNumber,displayTitle,posterPath,episodeCount,tmdbId,onClose,onSaved}:{
  entry:EntryData|null; isTV:boolean; showId:number|null;
  seasonNumber:number|null; displayTitle:string;
  posterPath:string|null; episodeCount:number|null|undefined;
  tmdbId?:number|null;
  onClose:()=>void; onSaved:(u:Partial<EntryData>)=>void;
}){
  const[status,setStatus]=useState(entry?.status??'PLANNING');
  const[score,setScore]=useState<number>(entry?.score??0);
  const[scoreInput,setScoreInput]=useState(entry?.score?entry.score.toFixed(1):'0.0');
  const[progress,setProgress]=useState(entry?.progress??0);
  const[startDate,setStartDate]=useState(entry?.startDate??'');
  const[finishDate,setFinishDate]=useState(entry?.finishDate??'');
  const[rewatchCount,setRewatchCount]=useState(entry?.rewatchCount??0);
  const[notes,setNotes]=useState(entry?.notes??'');
  const[hidden,setHidden]=useState(entry?.hidden??false);
  const[saving,setSaving]=useState(false);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};
    document.addEventListener('keydown',h);
    document.body.style.overflow='hidden';
    return()=>{document.removeEventListener('keydown',h);document.body.style.overflow='';};
  },[]);

  // Auto-fill dates
  useEffect(()=>{
    const today=new Date().toISOString().split('T')[0];
    if(status==='COMPLETED'&&!finishDate)setFinishDate(today);
    if((status==='WATCHING'||status==='REWATCHING')&&!startDate)setStartDate(today);
  },[status]);

  // Sync score input → number
  function handleScoreInput(v:string){
    setScoreInput(v);
    const n=parseFloat(v);
    if(!isNaN(n)&&n>=0&&n<=10)setScore(n);
  }

  const STATUS_OPTS=['WATCHING','PLANNING','COMPLETED','REWATCHING','PAUSED','DROPPED','UPCOMING'];
  const maxEp=episodeCount??9999;

  async function save(){
    setSaving(true);
    try{
      const payload={score,status,progress,startDate:startDate||null,finishDate:finishDate||null,rewatchCount,notes:notes||null,hidden};
      let res:Response;
      if(entry){
        res=await fetch(`/api/entries/${entry.id}`,{
          method:'PATCH',headers:{'Content-Type':'application/json'},
          body:JSON.stringify(payload),
        });
      }else{
        res=await fetch('/api/add-media',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            tmdbId: (entry as EntryData | null)?.tmdbId ?? tmdbId ?? null,
            parentTmdbId: isTV ? showId : null,
            seasonNumber: isTV ? seasonNumber : null,
            type: isTV ? 'TV_SEASON' : 'MOVIE',
            title: displayTitle,
            poster_path: posterPath,
            totalEpisodes: episodeCount ?? null,
            ...payload,
          }),
        });
      }
      if(res.ok){onSaved(payload);onClose();}
      else alert('Erro ao salvar.');
    }finally{setSaving(false);}
  }

  const inp:React.CSSProperties={width:'100%',padding:'9px 12px',background:'#1e1c1c',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:TEXT,fontSize:13,boxSizing:'border-box',fontFamily:'Overpass,sans-serif'};
  const lbl:React.CSSProperties={display:'block',fontSize:11,fontWeight:700,color:MUTED,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7};
  const stepBtn:React.CSSProperties={width:38,height:38,background:'#1e1c1c',border:'1px solid rgba(255,255,255,.08)',borderRadius:4,color:TEXT,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0};
  const posterImg=posterPath?(posterPath.startsWith('http')?posterPath:`https://image.tmdb.org/t/p/w200${posterPath}`):null;

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(11,22,34,.88)',backdropFilter:'blur(5px)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'fadeIn .2s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#1a1a2e',borderRadius:8,width:'100%',maxWidth:480,maxHeight:'94vh',overflow:'auto',boxShadow:'0 16px 60px rgba(0,0,0,.7)',animation:'scaleIn .28s ease'}}>
        {/* Header */}
        <div style={{position:'relative',minHeight:110,background:'linear-gradient(135deg,rgba(61,187,238,.22),rgba(43,45,66,.95))',borderRadius:'8px 8px 0 0',overflow:'hidden',display:'flex',alignItems:'center',gap:14,padding:'16px 20px'}}>
          {posterImg&&<img src={posterImg} style={{width:55,height:80,objectFit:'cover',borderRadius:3,boxShadow:'0 2px 10px rgba(0,0,0,.4)',flexShrink:0}} alt={displayTitle}/>}
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,color:'white',lineHeight:1.3,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{displayTitle}</div>
            <div style={{fontSize:11,color:MUTED,textTransform:'uppercase',letterSpacing:'.5px'}}>{isTV?`Season ${seasonNumber}`:'Film'}</div>
          </div>
          <button onClick={onClose} style={{position:'absolute',top:10,right:14,background:'none',border:'none',color:'rgba(255,255,255,.5)',fontSize:24,cursor:'pointer',lineHeight:1}}>×</button>
        </div>

        <div style={{padding:'22px 20px',display:'flex',flexDirection:'column',gap:18}}>
          {/* Status */}
          <div>
            <label style={lbl}>Status</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
              {STATUS_OPTS.map(s=>(
                <button key={s} onClick={()=>setStatus(s)} style={{
                  padding:'8px 4px',fontSize:11,fontWeight:700,cursor:'pointer',
                  border:status===s?`2px solid ${statusColor(s)}`:'1px solid rgba(255,255,255,.07)',
                  borderRadius:4,background:status===s?`${statusColor(s)}22`:'#151f2e',
                  color:status===s?statusColor(s):MUTED,
                  fontFamily:'Overpass,sans-serif',transition:'all .15s',
                }}>
                  {s.charAt(0)+s.slice(1).toLowerCase().replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Score — nota quebrada 0.0 ~ 10.0 */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,alignItems:'center'}}>
              <label style={{...lbl,marginBottom:0}}>Score (0.0 – 10.0)</label>
              <span style={{fontSize:22,fontWeight:800,color:score>0?scoreColor(score):MUTED,letterSpacing:'-.5px'}}>
                {score>0?score.toFixed(1):'—'}
              </span>
            </div>
            {/* Slider para arrastar */}
            <input type="range" min={0} max={10} step={0.1} value={score}
              onChange={e=>{const v=Number(e.target.value);setScore(v);setScoreInput(v.toFixed(1));}}
              style={{width:'100%',accentColor:ACCENT,cursor:'pointer',marginBottom:8}}/>
            {/* Input manual para nota quebrada exata */}
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input
                type="number" min="0" max="10" step="0.1"
                value={scoreInput}
                onChange={e=>handleScoreInput(e.target.value)}
                style={{...inp,width:90,textAlign:'center'}}
                placeholder="0.0"
              />
              <span style={{fontSize:12,color:MUTED}}>Digite a nota exata (ex: 7.3, 9.5)</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#3d4f60',marginTop:4}}>
              {[0,1,2,3,4,5,6,7,8,9,10].map(n=><span key={n}>{n}</span>)}
            </div>
          </div>

          {/* Progress */}
          {isTV&&(
            <div>
              <label style={lbl}>Episodes {episodeCount?`/ ${episodeCount}`:''}</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={()=>setProgress(p=>Math.max(0,p-1))} style={stepBtn}>−</button>
                <input type="number" min={0} max={maxEp} value={progress}
                  onChange={e=>setProgress(Math.min(maxEp,Math.max(0,Number(e.target.value))))}
                  style={{...inp,textAlign:'center',flex:1}}/>
                <button onClick={()=>setProgress(p=>Math.min(maxEp,p+1))} style={stepBtn}>+</button>
              </div>
            </div>
          )}

          {/* Datas */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label style={lbl}>Start Date</label><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Finish Date</label><input type="date" value={finishDate} onChange={e=>setFinishDate(e.target.value)} style={inp}/></div>
          </div>

          {/* Rewatches */}
          <div>
            <label style={lbl}>Rewatches</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={()=>setRewatchCount(r=>Math.max(0,r-1))} style={stepBtn}>−</button>
              <div style={{...inp,flex:1,textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center'}}>{rewatchCount}</div>
              <button onClick={()=>setRewatchCount(r=>r+1)} style={stepBtn}>+</button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Anotações pessoais..." style={{...inp,resize:'vertical'}}/>
          </div>

          {/* Hidden */}
          <label style={{display:'flex',gap:10,alignItems:'center',cursor:'pointer'}}>
            <input type="checkbox" checked={hidden} onChange={e=>setHidden(e.target.checked)} style={{width:16,height:16,accentColor:ACCENT}}/>
            <span style={{fontSize:13,color:MUTED}}>Ocultar das listas</span>
          </label>

          {/* Salvar */}
          <div style={{display:'flex',gap:10,paddingTop:4}}>
            <button onClick={save} disabled={saving} style={{flex:1,padding:12,background:saving?'#555':ACCENT,border:'none',borderRadius:4,color:'white',fontSize:14,fontWeight:700,cursor:saving?'wait':'pointer',fontFamily:'Overpass,sans-serif'}}>
              {saving?'Salvando...':'Salvar'}
            </button>
            <button onClick={onClose} style={{flex:1,padding:12,background:'#151f2e',border:'1px solid rgba(255,255,255,.07)',borderRadius:4,color:MUTED,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'Overpass,sans-serif'}}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function TitlePage({params}:{params:Promise<{id:string}>}){
  const{id}=use(params);
  const parsed=parseSlug(id);

  const[entry,         setEntry]         =useState<EntryData|null>(null);
  const[show,          setShow]          =useState<TmdbShow|null>(null);
  const[seasonDetail,  setSeasonDetail]  =useState<TmdbSeasonDetail|null>(null);
  const[movie,         setMovie]         =useState<TmdbMovie|null>(null);
  const[relations,     setRelations]     =useState<RelationItem[]>([]);
  const[editingRel,    setEditingRel]    =useState(false);
  const[showAddRel,    setShowAddRel]    =useState(false);
  const[showCoverEdit, setShowCoverEdit] =useState(false);
  // customPoster: capa sobrescrita pelo usuário (salva no banco)
  const[customPoster,  setCustomPoster]  =useState<string|null>(null);
  const[activeTab,     setActiveTab]     =useState<'overview'|'characters'|'staff'|'videos'>('overview');
  const[loading,       setLoading]       =useState(true);
  const[error,         setError]         =useState<string|null>(null);
  const[editorOpen,    setEditorOpen]    =useState(false);
  const[source,        setSource]        =useState<string|null>(null);
  const[mounted,       setMounted]       =useState(false);

  // ========== NOVAS FUNÇÕES AQUI ==========
async function addRelation(newRel: RelationItem) {
  console.log('addRelation chamado', newRel);

  // 1. Obtém o sourceEntryId — se não está na lista, cria apenas a source entry
  let sourceEntryId: string | null = entry?.id || null;
  if (!sourceEntryId) {
    const addRes = await fetch('/api/add-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbId: createTmdbId,
        parentTmdbId: isTV ? showId : null,
        seasonNumber: isTV ? seasonNumber : null,
        type: isTV ? 'TV_SEASON' : 'MOVIE',
        title: displayTitle,
        poster_path: rawPosterPath,
        totalEpisodes: episodeCount ?? null,
      }),
    });
    if (!addRes.ok) {
      alert('Erro ao adicionar título à lista. Tente novamente.');
      return;
    }
    const newEntry = await addRes.json();
    sourceEntryId = newEntry.id;
    setEntry(newEntry);
  }

  // 2. Extrai metadados do target pelo slug — SEM criar Entry no banco
  let targetTmdbId: number | null = null;
  let targetParentTmdbId: number | null = null;
  let targetSeasonNumber: number | null = null;
  let targetType: 'MOVIE' | 'TV_SEASON' | null = null;

  try {
    if (newRel.slug.startsWith('movie-')) {
      targetTmdbId = parseInt(newRel.slug.split('-')[1]);
      targetType = 'MOVIE';
    } else if (newRel.slug.startsWith('tv-')) {
      const match = newRel.slug.match(/^tv-(\d+)-s(\d+)$/);
      if (!match) throw new Error('Slug TV inválido');
      targetParentTmdbId = parseInt(match[1]);
      targetSeasonNumber = parseInt(match[2]);
      targetType = 'TV_SEASON';
      // Busca o season.id real (tmdbId da temporada, não da série)
      const sRes = await fetch(
        `${TMDB}/tv/${targetParentTmdbId}/season/${targetSeasonNumber}?api_key=${API_KEY}&language=pt-BR`
      );
      if (!sRes.ok) throw new Error('Temporada não encontrada no TMDB');
      const sData = await sRes.json();
      targetTmdbId = sData.id;
    } else {
      throw new Error('Slug inválido');
    }
  } catch (e) {
    console.error(e);
    alert('Erro ao obter dados do título relacionado.');
    return;
  }

  if (!targetTmdbId) return;

  // 3. Salva a relação — a API vincula ao targetEntryId automaticamente se já existir
  const relRes = await fetch('/api/relations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceEntryId,
      relationType: newRel.relationType,
      title: newRel.title,
      poster_path: newRel.poster_path,
      kind: newRel.kind,
      year: newRel.year,
      seasonNumber: newRel.seasonNumber,
      targetTmdbId,
      targetParentTmdbId,
      targetSeasonNumber,
      targetType,
    }),
  });

if (relRes.ok) {
  console.log('✅ Relação salva');

  // Recarrega as relações do banco
  try {
    const refreshRes = await fetch(`/api/relations?sourceId=${sourceEntryId}`);
    if (refreshRes.ok) {
      const saved = await refreshRes.json();
      function mapRelation(r: any): RelationItem | null {
  // Prioridade: targetEntry (entry já na lista) → campos targetTmdbId (só metadados)
  let slug = '';
  if (r.targetEntry) {
    const t = r.targetEntry;
    slug = t.type === 'MOVIE'
      ? `movie-${t.tmdbId}`
      : `tv-${t.parentTmdbId ?? t.tmdbId}-s${t.seasonNumber ?? 1}`;
  } else if (r.targetTmdbId) {
    slug = r.targetType === 'MOVIE'
      ? `movie-${r.targetTmdbId}`
      : `tv-${r.targetParentTmdbId ?? r.targetTmdbId}-s${r.targetSeasonNumber ?? 1}`;
  } else {
    return null; // sem dados suficientes para montar o slug
  }
  return {
    slug,
    relationType: r.relationType,
    title: r.title,
    poster_path: r.poster_path,
    kind: r.kind,
    year: r.year ?? undefined,
    seasonNumber: r.seasonNumber ?? undefined,
  };
}
      setRelations(saved.map(mapRelation).filter(Boolean) as RelationItem[]);
    } else {
      console.error('Falha ao recarregar relações:', refreshRes.status);
    }
  } catch (e) {
    console.error('Erro ao recarregar relações', e);
  }
} else {
  const errorText = await relRes.text();
  console.error('❌ Falha ao salvar relação:', errorText);
  alert('Erro ao salvar relação.');
}
}

async function fetchRelations(sourceId: string) {
  try {
    const res = await fetch(`/api/relations?sourceId=${sourceId}`);
    if (res.ok) {
      const saved = await res.json();
      const mapped = saved.map((r: any) => {
        const target = r.targetEntry;
        if (!target) return null;
        let slug = '';
        if (target.type === 'MOVIE') {
          slug = `movie-${target.tmdbId}`;
        } else {
          slug = `tv-${target.parentTmdbId ?? target.tmdbId}-s${target.seasonNumber ?? 1}`;
        }
        return {
          slug,
          relationType: r.relationType,
          title: r.title,
          poster_path: r.poster_path,
          kind: r.kind,
          year: r.year ?? undefined,
          seasonNumber: r.seasonNumber ?? undefined,
        };
      }).filter(Boolean);
      setRelations(mapped);
    }
  } catch (e) {
    console.warn('Erro ao recarregar relações', e);
  }
}

async function removeRelation(relToRemove: RelationItem) {
  if (!entry) return;
  let targetEntryId: string | null = null;

  try {
    // Tenta buscar pelo slug (entry pode já estar na lista do usuário)
    const res = await fetch(`/api/entry/${relToRemove.slug}`);
    if (res.ok) {
      const e = await res.json();
      targetEntryId = e.id;
    }
  } catch {}

  // Fallback: se não achou pelo slug, busca direto nas relações salvas no banco
  // para pegar o targetEntryId correto sem depender de a entry estar na lista
  if (!targetEntryId) {
    try {
      const relRes = await fetch(`/api/relations?sourceId=${entry.id}`);
      if (relRes.ok) {
        const saved = await relRes.json();
        const match = saved.find((r: any) => {
          const t = r.targetEntry;
          if (!t) return false;
          const slug = t.type === 'MOVIE'
            ? `movie-${t.tmdbId}`
            : `tv-${t.parentTmdbId ?? t.tmdbId}-s${t.seasonNumber ?? 1}`;
          return slug === relToRemove.slug;
        });
        if (match) targetEntryId = match.targetEntryId;
      }
    } catch {}
  }

  if (!targetEntryId) return;

  // Extrai o targetTmdbId do slug para deletar sem precisar de Entry
let targetTmdbId: number | null = null;
if (relToRemove.slug.startsWith('movie-')) {
  targetTmdbId = parseInt(relToRemove.slug.split('-')[1]);
} else {
  const match = relToRemove.slug.match(/^tv-(\d+)-s(\d+)$/);
  if (match) {
    const parentId = parseInt(match[1]);
    const seasonNum = parseInt(match[2]);
    try {
      const sRes = await fetch(`${TMDB}/tv/${parentId}/season/${seasonNum}?api_key=${API_KEY}&language=pt-BR`);
      if (sRes.ok) { const sData = await sRes.json(); targetTmdbId = sData.id; }
    } catch {}
  }
}

if (!targetTmdbId) return;
await fetch(`/api/relations?sourceId=${entry.id}&targetTmdbId=${targetTmdbId}`, { method: 'DELETE' });
setRelations(prev => prev.filter(r => r.slug !== relToRemove.slug));
  setRelations(prev => prev.filter(r => r.slug !== relToRemove.slug));
}
// ========== FIM DAS FUNÇÕES ==========

  // Inject CSS once
  useEffect(()=>{
    if(document.getElementById('tp-css'))return;
    const el=document.createElement('style');
    el.id='tp-css';el.textContent=GLOBAL_CSS;
    document.head.appendChild(el);
  },[]);

// ─── Fetch de dados (corrigido para carregar relations salvas) ──────────────
useEffect(() => {
  let cancelled = false;
  async function load() {
    setLoading(true);
    setError(null);
    setMounted(false);
    setEntry(null);
    setShow(null);
    setSeasonDetail(null);
    setMovie(null);
    setRelations([]);
    setCustomPoster(null);
    setSource(null);

    try {
      if (parsed.kind === 'movie') {
        const [eRes, tRes, tResEn, recResEn] = await Promise.all([
  fetch(`/api/entry/movie-${parsed.movieId}`),
  fetch(`${TMDB}/movie/${parsed.movieId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos`),
  fetch(`${TMDB}/movie/${parsed.movieId}?api_key=${API_KEY}&language=en-US`),
  fetch(`${TMDB}/movie/${parsed.movieId}/recommendations?api_key=${API_KEY}&language=en-US`),
]);
        if (cancelled) return;
        
        let entryId: string | null = null;
        if (eRes.ok) {
          const e: EntryData = await eRes.json();
          setEntry(e);
          entryId = e.id;
          if (e.imagePath) setCustomPoster(e.imagePath);
        }
        if (!tRes.ok) throw new Error('Filme não encontrado no TMDB');
        const md: TmdbMovie = await tRes.json();
const mdEn: TmdbMovie = tResEn.ok ? await tResEn.json() : md;
md.title = mdEn.title || md.title;
md.original_title = mdEn.original_title || md.original_title;
        if (cancelled) return;
        setMovie(md);

        // ---------- Relations ----------
        let initialRels: RelationItem[] = [];

        // 1) Se a entry existe (temos entryId), tenta carregar do banco
if (entryId) {
  try {
    const relRes = await fetch(`/api/relations?sourceId=${entryId}`);
    if (relRes.ok) {
      const saved = await relRes.json();
      console.log(`[Relations] Carregadas ${saved.length} relações do banco para entryId ${entryId}`);
      if (saved.length) {
        initialRels = saved.map((r: any) => {
          const target = r.targetEntry;
          if (!target) {
            console.warn('Relação sem targetEntry', r);
            return null;
          }
          let slug = '';
          if (target.type === 'MOVIE') {
            slug = `movie-${target.tmdbId}`;
          } else {
            slug = `tv-${target.parentTmdbId ?? target.tmdbId}-s${target.seasonNumber ?? 1}`;
          }
          return {
            slug,
            relationType: r.relationType,
            title: r.title,
            poster_path: r.poster_path,
            kind: r.kind,
            year: r.year ?? undefined,
            seasonNumber: r.seasonNumber ?? undefined,
          };
        }).filter(Boolean);
        console.log('[Relations] Mapeadas:', initialRels);
      }
    } else {
      console.error(`Falha ao carregar relações: status ${relRes.status}`);
    }
  } catch (e) {
    console.warn('[Relations] Falha ao carregar do banco', e);
  }
}

        // 2) Se não tem relações salvas, gerar automáticas (TMDB)
        if (initialRels.length === 0 && md.belongs_to_collection) {
          try {
            const cRes = await fetch(
              `${TMDB}/collection/${md.belongs_to_collection.id}?api_key=${API_KEY}&language=pt-BR`
            );
            if (cRes.ok) {
              const col: TmdbCollection = await cRes.json();
              const sorted = [...col.parts].sort(
                (a, b) =>
                  new Date(a.release_date || '9999').getTime() -
                  new Date(b.release_date || '9999').getTime()
              );
              const myIdx = sorted.findIndex((p) => p.id === parsed.movieId);
              if (myIdx > 0) {
                const p = sorted[myIdx - 1];
                initialRels.push({
                  slug: `movie-${p.id}`,
                  relationType: 'PREQUEL',
                  title: p.title,
                  poster_path: p.poster_path,
                  kind: 'movie',
                  year: getYear(p.release_date),
                });
              }
              if (myIdx < sorted.length - 1) {
                const p = sorted[myIdx + 1];
                initialRels.push({
                  slug: `movie-${p.id}`,
                  relationType: 'SEQUEL',
                  title: p.title,
                  poster_path: p.poster_path,
                  kind: 'movie',
                  year: getYear(p.release_date),
                });
              }
            }
          } catch {}
        }

        if (!cancelled) setRelations(initialRels);

        // Source (keywords) – inalterado
        try {
          const kRes = await fetch(
            `${TMDB}/movie/${parsed.movieId}/keywords?api_key=${API_KEY}`
          );
          if (kRes.ok && !cancelled) {
            const kd = await kRes.json();
            const kws = (kd.keywords ?? []).map((k: any) => k.name.toLowerCase());
            if (kws.some((k: string) => k.includes('comic') || k.includes('graphic novel')))
              setSource('Comic Book');
            else if (kws.some((k: string) => k.includes('manga'))) setSource('Manga');
            else if (kws.some((k: string) => k.includes('novel') || k.includes('book')))
              setSource('Novel');
            else if (kws.some((k: string) => k.includes('video game') || k.includes('game')))
              setSource('Video Game');
            else setSource('Original');
          }
        } catch {
          if (!cancelled) setSource('Original');
        }
      } else if (parsed.kind === 'tv') {
        const { showId, seasonNumber } = parsed;
        const [eRes, sRes, sdRes, sResEn] = await Promise.all([
  fetch(`/api/entry/tv-${showId}-s${seasonNumber}`),
  fetch(`${TMDB}/tv/${showId}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos,recommendations`),
  fetch(`${TMDB}/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos`),
  fetch(`${TMDB}/tv/${showId}?api_key=${API_KEY}&language=en-US`),
]);
        if (cancelled) return;
        
        let entryId: string | null = null;
        if (eRes.ok) {
          const e: EntryData = await eRes.json();
          setEntry(e);
          entryId = e.id;
          if (e.imagePath) setCustomPoster(e.imagePath);
        }
        if (!sRes.ok) throw new Error('Série não encontrada no TMDB');
        const sd: TmdbShow = await sRes.json();
const sdEn: TmdbShow = sResEn.ok ? await sResEn.json() : sd;
sd.name = sdEn.name || sd.name;
sd.original_name = sdEn.original_name || sd.original_name;
        if (cancelled) return;
        setShow(sd);
        if (sdRes.ok) setSeasonDetail(await sdRes.json());

        // ---------- Relations ----------
        let initialRels: RelationItem[] = [];

        // 1) Carregar do banco se entry existe
if (entryId) {
  try {
    const relRes = await fetch(`/api/relations?sourceId=${entryId}`);
    if (relRes.ok) {
      const saved = await relRes.json();
      console.log(`[Relations] Carregadas ${saved.length} relações do banco para entryId ${entryId}`);
      if (saved.length) {
        initialRels = saved.map((r: any) => {
          const target = r.targetEntry;
          if (!target) {
            console.warn('Relação sem targetEntry', r);
            return null;
          }
          let slug = '';
          if (target.type === 'MOVIE') {
            slug = `movie-${target.tmdbId}`;
          } else {
            slug = `tv-${target.parentTmdbId ?? target.tmdbId}-s${target.seasonNumber ?? 1}`;
          }
          return {
            slug,
            relationType: r.relationType,
            title: r.title,
            poster_path: r.poster_path,
            kind: r.kind,
            year: r.year ?? undefined,
            seasonNumber: r.seasonNumber ?? undefined,
          };
        }).filter(Boolean);
        console.log('[Relations] Mapeadas:', initialRels);
      }
    } else {
      console.error(`Falha ao carregar relações: status ${relRes.status}`);
    }
  } catch (e) {
    console.warn('[Relations] Falha ao carregar do banco', e);
  }
}

        // 2) Se não há salvas, gerar automáticas (TMDB)
        if (initialRels.length === 0) {
          const numbered = sd.seasons.filter((s) => s.season_number > 0);
          const prevSeason = numbered.find((s) => s.season_number === seasonNumber - 1);
          const nextSeason = numbered.find((s) => s.season_number === seasonNumber + 1);
          if (prevSeason) {
            initialRels.push({
              slug: `tv-${showId}-s${prevSeason.season_number}`,
              relationType: 'PREQUEL',
              title: buildSeasonTitle(sd.name, prevSeason.season_number),
              poster_path: prevSeason.poster_path,
              kind: 'tv',
              year: getYear(prevSeason.air_date),
              seasonNumber: prevSeason.season_number,
            });
          }
          if (nextSeason) {
            initialRels.push({
              slug: `tv-${showId}-s${nextSeason.season_number}`,
              relationType: 'SEQUEL',
              title: buildSeasonTitle(sd.name, nextSeason.season_number),
              poster_path: nextSeason.poster_path,
              kind: 'tv',
              year: getYear(nextSeason.air_date),
              seasonNumber: nextSeason.season_number,
            });
          }
        }

        if (!cancelled) setRelations(initialRels);

        // Source (keywords) – inalterado
        try {
          const kRes = await fetch(
            `${TMDB}/tv/${showId}/keywords?api_key=${API_KEY}`
          );
          if (kRes.ok && !cancelled) {
            const kd = await kRes.json();
            const kws = (kd.results ?? []).map((k: any) => k.name.toLowerCase());
            if (kws.some((k: string) => k.includes('manga') || k.includes('anime')))
              setSource('Manga');
            else if (kws.some((k: string) => k.includes('comic'))) setSource('Comic Book');
            else if (kws.some((k: string) => k.includes('light novel') || k.includes('novel')))
              setSource('Light Novel');
            else if (kws.some((k: string) => k.includes('webtoon') || k.includes('manhwa')))
              setSource('Webtoon');
            else if (kws.some((k: string) => k.includes('video game') || k.includes('game')))
              setSource('Video Game');
            else setSource('Original');
          }
        } catch {
          if (!cancelled) setSource('Original');
        }
      } else {
        setError('Slug de título inválido.');
      }
    } catch (e: any) {
      if (!cancelled) setError(e.message ?? 'Erro desconhecido');
    } finally {
      if (!cancelled) {
        setLoading(false);
        setTimeout(() => setMounted(true), 60);
      }
    }
  }
  load();
  return () => {
    cancelled = true;
  };
}, [id]); // ← dependência apenas no `id`

  // ─── Loading / Error ────────────────────────────────────────────────────────
  if(loading)return<LoadingScreen/>;
  if(error||parsed.kind==='unknown'){
    return(
      <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Overpass,sans-serif'}}>
        <div style={{textAlign:'center',color:TEXT,animation:'fadeInUp .4s ease'}}>
          <div style={{fontSize:52,marginBottom:18}}>😕</div>
          <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Título não encontrado</div>
          <div style={{fontSize:13,color:MUTED,marginBottom:24}}>{error}</div>
          <Link href="/" style={{display:'inline-block',padding:'10px 24px',background:ACCENT,borderRadius:4,color:'white',fontWeight:700,textDecoration:'none',fontSize:13}}>← Voltar</Link>
        </div>
      </div>
    );
  }

  // ─── Dados derivados ────────────────────────────────────────────────────────
  const isTV        = parsed.kind==='tv';
  const showId      = isTV?(parsed as any).showId as number:null;
  const seasonNumber= isTV?(parsed as any).seasonNumber as number:null;
  const displayTitle= isTV&&show?buildSeasonTitle(show.name,seasonNumber!):movie?.title??'';
  const banner      = (isTV?show?.backdrop_path:movie?.backdrop_path)
    ?`https://image.tmdb.org/t/p/original${isTV?show!.backdrop_path:movie!.backdrop_path}`:null;

  // Poster: customPoster (banco) > temporada > série/filme
  const rawPosterPath=customPoster
    ??(isTV?(seasonDetail?.poster_path||show?.poster_path):movie?.poster_path)
    ??null;
  const poster=rawPosterPath
    ?(rawPosterPath.startsWith('http')?rawPosterPath:`https://image.tmdb.org/t/p/w500${rawPosterPath}`)
    :null;

  // ID a ser enviado ao criar uma entrada (prefere entry existente, depois season.id/movie.id)
  const createTmdbId = entry?.tmdbId ?? (isTV ? (seasonDetail?.id ?? show?.seasons?.find(s=>s.season_number===seasonNumber)?.id ?? null) : (movie?.id ?? null));

  // Score como decimal (0–10), não percentual
  const rawScore=isTV?(seasonDetail?.vote_average??show?.vote_average??0):(movie?.vote_average??0);
  const scoreDisplay = rawScore > 0 ? formatScore(rawScore) : null;

  const overview    = isTV?(seasonDetail?.overview||show?.overview||''):(movie?.overview||'');

  // Cast — deduplicado e ordenado por crédito de tela
  const cast:CastMember[]=(isTV
    ?[...(seasonDetail?.credits?.cast??[]),...(show?.credits?.cast??[])]
    :(movie?.credits?.cast??[]))
    .filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i)
    .sort((a,b)=>(a.order??99)-(b.order??99));

  // Staff — TODOS os cargos agrupados por departamento
  const allCrew:CrewMember[]=(isTV
    ?[...(seasonDetail?.credits?.crew??[]),...(show?.credits?.crew??[])]
    :(movie?.credits?.crew??[]))
    .filter((c,i,a)=>a.findIndex(x=>x.id===c.id&&x.job===c.job)===i);

  // Agrupa por departamento para exibir na aba Staff
  const crewByDept=allCrew.reduce<Record<string,CrewMember[]>>((acc,c)=>{
    const d=c.department||'Other';
    if(!acc[d])acc[d]=[];acc[d].push(c);return acc;
  },{});
  const DEPT_ORDER=['Directing','Writing','Production','Sound','Camera','Editing','Art','Costume & Make-Up','Visual Effects','Crew','Other'];
  const sortedDepts=Object.keys(crewByDept).sort((a,b)=>{
    const ai=DEPT_ORDER.indexOf(a),bi=DEPT_ORDER.indexOf(b);
    return(ai===-1?99:ai)-(bi===-1?99:bi);
  });

  // Videos
  const allVids:VideoItem[]=isTV
    ?[...(seasonDetail?.videos?.results??[]),...(show?.videos?.results??[])]
    :(movie?.videos?.results??[]);
  const uniqueVideos=allVids
    .filter(v=>v.site==='YouTube'&&['Trailer','Teaser','Clip','Featurette'].includes(v.type))
    .filter((v,i,a)=>a.findIndex(x=>x.key===v.key)===i)
    .sort((a,b)=>(b.official?1:0)-(a.official?1:0));

  const recommendations:TmdbRec[]=isTV
    ?(show?.recommendations?.results?.slice(0,6)??[])
    :(movie?.recommendations?.results?.slice(0,6)??[]);

  const seasonAirDate =isTV?(seasonDetail?.air_date||entry?.releaseDate):(movie?.release_date||entry?.releaseDate);
  const seasonEpisodes=isTV?(seasonDetail?.episodes??[]):[];
  const seasonStatus  =isTV?getSeasonStatus(seasonEpisodes):null;
  const todayStr      =new Date().toISOString().split('T')[0];
  const airedEps      =seasonEpisodes.filter(e=>e.air_date&&e.air_date<=todayStr);
  const lastAired     =airedEps.length?airedEps.at(-1)!.air_date:null;
  const endDate       =isTV?(lastAired||entry?.endDate):null;
  const year          =getYear(seasonAirDate);
  const episodeCount  =isTV?(seasonDetail?.episodes?.length??show?.seasons?.find(s=>s.season_number===seasonNumber)?.episode_count):null;
  const genresList    =(isTV?show?.genres:movie?.genres)??[];
  const studios       =(isTV?show?.production_companies:movie?.production_companies)??[];
  const formatDisplay =isTV&&show?getFormat(show.networks??[],show.production_companies??[]):'Movie';

  // Sidebar rows — inclui Producers (empresas) como campo separado
  const sidebarRows:([string,React.ReactNode])[]=[
    ['Format',formatDisplay],
    ...(isTV&&show?[['Season',`${getOrdinal(seasonNumber!)} Season`] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ...(isTV&&seasonStatus?[['Status',seasonStatus] as [string,React.ReactNode]]:(!isTV&&movie?.status?[['Status',movie.status] as [string,React.ReactNode]]:[] as [string,React.ReactNode][])),
    ...(seasonAirDate?[['Air Date',new Date(seasonAirDate+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ...(isTV&&endDate?[['Last Air',new Date(endDate).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ...(episodeCount?[['Episodes',String(episodeCount)] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ...(!isTV&&movie?.runtime?[['Duration',`${movie.runtime} min`] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ...(scoreDisplay?[['Avg Score',scoreDisplay] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ['Popularity',Math.floor((isTV?show?.popularity:movie?.popularity)??0).toLocaleString('pt-BR')] as [string,React.ReactNode],
    ...(genresList.length?[['Genres',genresList.map(g=>g.name).join(', ')] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ...(source?[['Source',source] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    ...(isTV&&show?.networks?.length?[['Network',show.networks[0].name] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
    // Producers: empresas produtoras (não pessoas)
    ...(studios.length?[['Producers',studios.map((s,i)=>(
      <span key={s.id}>{s.name}{i<studios.length-1?', ':''}</span>
    ))] as [string,React.ReactNode]]:[] as [string,React.ReactNode][]),
  ];

  // ─── Subcomponentes ─────────────────────────────────────────────────────────

  function CharCard({p}:{p:CastMember}){
    return(
      <div className="tp-char-card" style={{background:CARD,borderRadius:4,overflow:'hidden',display:'flex',justifyContent:'space-between'}}>
        <div style={{display:'flex'}}>
          <img src={p.profile_path?`https://image.tmdb.org/t/p/w185${p.profile_path}`:`https://placehold.co/60x80/2a2727/92a0ad?text=${encodeURIComponent(p.name[0])}`} style={{width:60,height:80,objectFit:'cover'}} alt={p.name}/>
          <div style={{padding:'8px 10px'}}>
            <div style={{fontSize:13,fontWeight:700,color:TEXT}}>{p.name}</div>
            <div style={{fontSize:11,color:MUTED,marginTop:2}}>Actor</div>
          </div>
        </div>
        <div style={{padding:'8px 10px',textAlign:'right'}}>
          <div style={{fontSize:12,color:TEXT,fontWeight:500}}>{p.character}</div>
          <div style={{fontSize:11,color:MUTED,marginTop:2}}>Character</div>
        </div>
      </div>
    );
  }

  function StaffCard({p}:{p:CrewMember}){
    return(
      <div className="tp-staff-card" style={{background:CARD,borderRadius:4,overflow:'hidden',display:'flex'}}>
        <img src={p.profile_path?`https://image.tmdb.org/t/p/w185${p.profile_path}`:`https://placehold.co/50x65/2a2727/92a0ad?text=${encodeURIComponent(p.name[0])}`} style={{width:50,height:65,objectFit:'cover'}} alt={p.name}/>
        <div style={{padding:'8px 10px'}}>
          <div style={{fontSize:12,fontWeight:700,color:TEXT,lineHeight:1.3}}>{p.name}</div>
          <div style={{fontSize:11,color:MUTED,marginTop:3}}>{p.job}</div>
        </div>
      </div>
    );
  }

  function RelCard({rel, onRemove}:{rel:RelationItem; onRemove:(rel:RelationItem)=>void}){
    return(
      <div className="tp-rel-card" style={{background:CARD,borderRadius:4,overflow:'hidden',display:'flex',height:90,position:'relative'}}>
        <img src={rel.poster_path?`https://image.tmdb.org/t/p/w200${rel.poster_path}`:'https://placehold.co/60x90/2a2727/92a0ad?text=?'} style={{width:60,objectFit:'cover',flexShrink:0}} alt={rel.title}/>
        <a href={`/titles/${rel.slug}`} style={{textDecoration:'none',display:'flex',flex:1,minWidth:0}}>
          <div style={{padding:'10px 12px',flex:1,minWidth:0}}>
            <div style={{color:ACCENT,fontSize:10,fontWeight:800,letterSpacing:'.8px',marginBottom:4}}>{REL_LABEL[rel.relationType]??rel.relationType.toUpperCase()}</div>
            <div className="tp-rel-title" style={{fontSize:13,fontWeight:700,color:TEXT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',transition:'color .15s'}}>{rel.title}</div>
            {rel.year&&<div style={{fontSize:11,color:MUTED,marginTop:4}}>{rel.kind==='movie'?'Film':rel.seasonNumber?`${getOrdinal(rel.seasonNumber)} Season`:'TV'} · {rel.year}</div>}
          </div>
        </a>
        {editingRel&&(
          <button onClick={()=>setRelations(prev=>prev.filter(r=>r.slug!==rel.slug))}
            style={{position:'absolute',top:6,right:6,background:'#e53e3e',color:'white',border:'none',borderRadius:'50%',width:20,height:20,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>×</button>
        )}
      </div>
    );
  }

  function RecCard({rec}:{rec:TmdbRec}){
    const t=rec.title||rec.name||'';
    const slug=rec.media_type==='movie'?`movie-${rec.id}`:`tv-${rec.id}-s1`;
    const rs=rec.vote_average>0?rec.vote_average.toFixed(1):null;
    return(
      <a href={`/titles/${slug}`} style={{textDecoration:'none'}}>
        <div className="tp-rec-card" style={{background:CARD,borderRadius:4,overflow:'hidden',cursor:'pointer'}}>
          {rec.poster_path
            ?<img src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`} style={{width:'100%',aspectRatio:'2/3',objectFit:'cover',display:'block'}} alt={t}/>
            :<div style={{width:'100%',aspectRatio:'2/3',background:'#1e1c1c',display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,fontSize:12}}>Sem imagem</div>
          }
          <div style={{padding:8}}>
            <div style={{fontSize:12,fontWeight:700,color:TEXT,lineHeight:1.3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{t}</div>
            <div style={{fontSize:11,color:MUTED,marginTop:3}}>
              {getYear(rec.release_date||rec.first_air_date)}
              {rs&&<span style={{color:scoreColor(+rs),fontWeight:700,marginLeft:6}}>★ {rs}</span>}
            </div>
          </div>
        </div>
      </a>
    );
  }

  // ─── Aba Overview ────────────────────────────────────────────────────────────
  const sectionTitle:React.CSSProperties={fontSize:14,fontWeight:700,color:ACCENT,marginBottom:12,display:'flex',alignItems:'center',gap:8};
  const grid2:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:30};
  const grid3:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:30};
  const grid4:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:30};

  function OverviewTab(){
    const d=(i:number)=>({animationDelay:`${i*.07}s`});
    return(
      <>
        <div className="anim-fade-up" style={{...d(0),background:CARD,borderRadius:4,padding:20,marginBottom:25,lineHeight:1.75,color:TEXT,fontSize:14}}>
          {overview||'Nenhuma sinopse disponível.'}
        </div>

{/* Relations */}
{(relations.length > 0 || editingRel) && (
  <div className="anim-fade-up" style={{...d(1), marginBottom: 25}}>
    <div style={sectionTitle}>
      <span>Relations</span>
      <button
        onClick={async () => {
          if (!entry) {
            if (!createTmdbId) { alert('Erro: ID do título não encontrado.'); return; }
            const addRes = await fetch('/api/add-media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tmdbId: createTmdbId,
                parentTmdbId: isTV ? showId : null,
                seasonNumber: isTV ? seasonNumber : null,
                type: isTV ? 'TV_SEASON' : 'MOVIE',
                title: displayTitle,
                poster_path: rawPosterPath,
                totalEpisodes: episodeCount ?? null,
              }),
            });
            if (addRes.ok) {
              const newEntry = await addRes.json();
              setEntry(newEntry);
              setEditingRel(true);
            } else {
              alert('Erro ao adicionar título à lista. Tente novamente.');
            }
          } else {
            setEditingRel(v => !v);
          }
        }}
        style={{marginLeft:'auto', background:editingRel?'#e53e3e':'rgba(230,125,153,.18)', color:editingRel?'white':ACCENT, border:`1px solid ${editingRel?'#e53e3e':ACCENT}`, borderRadius:3, padding:'3px 10px', fontSize:11, cursor:'pointer', fontWeight:700}}
      >
        {editingRel ? 'Cancelar' : 'Editar'}
      </button>
      {editingRel && (
        <button
          onClick={async () => {
            if (!entry) {
              if (!createTmdbId) { alert('Erro: ID do título não encontrado.'); return; }
              const addRes = await fetch('/api/add-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tmdbId: createTmdbId,
                  parentTmdbId: isTV ? showId : null,
                  seasonNumber: isTV ? seasonNumber : null,
                  type: isTV ? 'TV_SEASON' : 'MOVIE',
                  title: displayTitle,
                  poster_path: rawPosterPath,
                  totalEpisodes: episodeCount ?? null,
                }),
              });
              if (addRes.ok) {
                const newEntry = await addRes.json();
                setEntry(newEntry);
                setShowAddRel(true);
              } else {
                alert('Erro ao adicionar título à lista. Tente novamente.');
              }
            } else {
              setShowAddRel(true);
            }
          }}
          style={{background:'#2ecc71', color:'white', border:'none', borderRadius:3, padding:'3px 10px', fontSize:11, cursor:'pointer', fontWeight:700}}
        >
          + Adicionar
        </button>
      )}
    </div>
    <div style={grid2}>{relations.map(r => <RelCard key={r.slug} rel={r} onRemove={removeRelation} />)}</div>
  </div>
)}

        {/* Characters preview */}
        {cast.length>0&&(
          <div className="anim-fade-up" style={{...d(2),marginBottom:25}}>
            <div style={sectionTitle}>
              <span>Characters</span>
              <span style={{marginLeft:'auto',color:ACCENT,fontSize:12,cursor:'pointer',opacity:.7}} onClick={()=>setActiveTab('characters')}>Ver todos →</span>
            </div>
            <div style={grid2}>{cast.slice(0,6).map(p=><CharCard key={p.id} p={p}/>)}</div>
          </div>
        )}

        {/* Staff preview */}
        {allCrew.length>0&&(
          <div className="anim-fade-up" style={{...d(3),marginBottom:25}}>
            <div style={sectionTitle}>
              <span>Staff</span>
              <span style={{marginLeft:'auto',color:ACCENT,fontSize:12,cursor:'pointer',opacity:.7}} onClick={()=>setActiveTab('staff')}>Ver todos →</span>
            </div>
            <div style={grid3}>{allCrew.slice(0,6).map(p=><StaffCard key={`${p.id}-${p.job}`} p={p}/>)}</div>
          </div>
        )}

        {/* Trailer */}
        {uniqueVideos.length>0&&(
          <div className="anim-fade-up" style={{...d(4),marginBottom:25}}>
            <div style={sectionTitle}>
              <span>Trailer</span>
              <span style={{marginLeft:'auto',color:ACCENT,fontSize:12,cursor:'pointer',opacity:.7}} onClick={()=>setActiveTab('videos')}>Ver todos →</span>
            </div>
            <div style={{position:'relative',paddingBottom:'56.25%',borderRadius:6,overflow:'hidden',background:'#000'}}>
              <iframe src={`https://www.youtube.com/embed/${uniqueVideos[0].key}`} title={uniqueVideos[0].name} allowFullScreen style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}/>
            </div>
          </div>
        )}

        {/* Recomendações */}
        {recommendations.length>0&&(
          <div className="anim-fade-up" style={{...d(5),marginBottom:25}}>
            <div style={sectionTitle}>Recomendações</div>
            <div style={grid4}>{recommendations.slice(0,4).map(r=><RecCard key={r.id} rec={r}/>)}</div>
          </div>
        )}
      </>
    );
  }

  // ─── Aba Staff (completo, por departamento) ──────────────────────────────────
  function StaffTab(){
    return(
      <div className="anim-fade-in">
        {sortedDepts.length===0&&<div style={{textAlign:'center',color:MUTED,padding:40,fontSize:14}}>Nenhum staff disponível.</div>}
        {sortedDepts.map((dept,di)=>(
          <div key={dept} style={{marginBottom:28,animation:`fadeInUp .4s ease ${di*.05}s both`}}>
            <div style={{fontSize:11,fontWeight:800,color:MUTED,textTransform:'uppercase',letterSpacing:'1px',marginBottom:10,paddingBottom:6,borderBottom:'1px solid rgba(255,255,255,.05)'}}>{dept}</div>
            <div style={grid3}>{crewByDept[dept].map(p=><StaffCard key={`${p.id}-${p.job}`} p={p}/>)}</div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return(
    <div style={{background:BG,minHeight:'100vh',fontFamily:'Overpass,sans-serif',color:TEXT}}>
      {/* BANNER */}
      <div style={{width:'100%',height:400,position:'relative',background:'#1a1a2e',overflow:'hidden'}}>
        {banner&&<img src={banner} alt="banner" style={{width:'100%',height:'100%',objectFit:'cover',opacity:.5,animation:'fadeIn .8s ease'}}/>}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,transparent 30%,rgba(58,55,55,.75) 70%,#3a3737 100%)'}}/>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',position:'relative',marginTop:-140,padding:'0 20px 80px'}}>
        <div style={{display:'flex',gap:30,alignItems:'flex-start'}}>

          {/* ── SIDEBAR ── */}
          <div style={{width:215,flexShrink:0,animation:mounted?'slideLeft .45s ease both':'none'}}>

            {/* Poster + botão de editar capa (aparece no hover) */}
            <div className="tp-poster-wrap" style={{position:'relative',marginBottom:8}}>
              {poster
                ?<img src={poster} style={{width:215,borderRadius:4,boxShadow:'0 6px 24px rgba(0,0,0,.5)',display:'block'}} alt="poster"/>
                :<div style={{width:215,height:310,background:CARD,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',color:MUTED,fontSize:13}}>Sem imagem</div>
              }
              {/* Overlay de editar capa (visível no hover via CSS .tp-poster-overlay) */}
              <div className="tp-poster-overlay"
                onClick={()=>setShowCoverEdit(true)}
                style={{position:'absolute',inset:0,background:'rgba(0,0,0,.68)',borderRadius:4,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:0,transition:'opacity .22s ease',gap:6}}>
                <div style={{fontSize:24}}>🖼</div>
                <div style={{fontSize:13,fontWeight:700,color:'white'}}>Alterar Capa</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.6)',textAlign:'center',padding:'0 12px',lineHeight:1.4}}>Salvo em todo o site</div>
              </div>
            </div>

            {/* Status / adicionar à lista */}
            <button className="tp-status-btn"
              onClick={()=>setEditorOpen(true)}
              style={{background:statusColor(entry?.status),color:'white',padding:10,borderRadius:4,textAlign:'center',fontWeight:700,marginBottom:8,cursor:'pointer',fontSize:13,border:'none',width:'100%',letterSpacing:'.3px'}}>
              {entry?.status??'+ ADICIONAR'}
            </button>

            {/* Info panel */}
            <div style={{background:CARD,borderRadius:4,padding:16,fontSize:13,color:TEXT}}>
              {sidebarRows.map(([label,value],i)=>(
                <div key={String(label)} style={{marginBottom:13,padding:'3px 0',animation:mounted?`fadeInUp .4s ease ${.1+i*.04}s both`:'none'}}>
                  <div style={{fontWeight:700,color:MUTED,fontSize:11,textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3}}>{label}</div>
                  <div style={{color:String(label)==='Avg Score'?scoreColor(Number(scoreDisplay??0)):TEXT,lineHeight:1.4,fontWeight:String(label)==='Avg Score'?800:400,fontSize:String(label)==='Avg Score'?16:13}}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAIN ── */}
          <div style={{flex:1,paddingTop:140,minWidth:0,animation:mounted?'fadeInUp .5s ease .1s both':'none'}}>
            <h1 style={{fontSize:26,color:ACCENT,marginBottom:4,fontWeight:700,lineHeight:1.2}}>{displayTitle}</h1>
            <div style={{fontSize:13,color:MUTED,marginBottom:22}}>{year}</div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,.07)',marginBottom:25}}>
              {(['overview','characters','staff','videos']as const).map(tab=>(
                <span key={tab} className="tp-tab"
                  onClick={()=>setActiveTab(tab)}
                  style={{padding:'12px 20px',fontSize:14,cursor:'pointer',fontWeight:activeTab===tab?700:500,color:activeTab===tab?ACCENT:MUTED,borderBottom:activeTab===tab?`2px solid ${ACCENT}`:'2px solid transparent',userSelect:'none',whiteSpace:'nowrap'}}>
                  {tab.charAt(0).toUpperCase()+tab.slice(1)}
                </span>
              ))}
            </div>

            {activeTab==='overview'&&<OverviewTab/>}

            {activeTab==='characters'&&(
              <div className="anim-fade-in">
                <div style={{fontSize:14,fontWeight:700,color:ACCENT,marginBottom:14}}>Elenco Completo</div>
                {!cast.length
                  ?<div style={{textAlign:'center',color:MUTED,padding:40,fontSize:14}}>Nenhum elenco disponível.</div>
                  :<div style={grid2}>{cast.map((p,i)=>(
                    <div key={p.id} style={{animation:`fadeInUp .35s ease ${i*.025}s both`}}><CharCard p={p}/></div>
                  ))}</div>
                }
              </div>
            )}

            {activeTab==='staff'&&<StaffTab/>}

            {activeTab==='videos'&&(
              <div className="anim-fade-in">
                {!uniqueVideos.length
                  ?<div style={{textAlign:'center',color:MUTED,padding:40,fontSize:14}}>Nenhum vídeo disponível.</div>
                  :<div style={{display:'flex',flexDirection:'column',gap:24}}>
                    {uniqueVideos.map((v,i)=>(
                      <div key={v.id} style={{animation:`fadeInUp .38s ease ${i*.06}s both`}}>
                        <div style={{fontSize:13,fontWeight:700,color:TEXT,marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                          {v.name}
                          <span style={{fontWeight:400,color:MUTED,fontSize:12}}>({v.type})</span>
                          {v.official&&<span style={{fontSize:10,background:'rgba(230,125,153,.2)',color:ACCENT,padding:'2px 6px',borderRadius:3,fontWeight:700}}>Official</span>}
                        </div>
                        <div style={{position:'relative',paddingBottom:'56.25%',borderRadius:6,overflow:'hidden',background:'#000'}}>
                          <iframe src={`https://www.youtube.com/embed/${v.key}`} title={v.name} allowFullScreen style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modais ── */}
      {showCoverEdit&&entry&&(
        <CoverModal
          entryId={entry.id}
          current={customPoster??rawPosterPath??null}
          onSaved={p=>{setCustomPoster(p);setShowCoverEdit(false);}}
          onClose={()=>setShowCoverEdit(false)}
        />
      )}
      {showAddRel&&(
        <AddRelModal
          onAdd={addRelation}
          onClose={() => setShowAddRel(false)}
        />
      )}
      {editorOpen&&(
        <ListEditorModal
          entry={entry}
          isTV={isTV}
          showId={showId}
          seasonNumber={seasonNumber}
          displayTitle={displayTitle}
          posterPath={rawPosterPath}
          episodeCount={episodeCount}
          tmdbId={createTmdbId}
          onClose={()=>setEditorOpen(false)}
          onSaved={async u=>{
            if(entry){ setEntry(prev=>prev?{...prev,...u}:prev); setEditorOpen(false); return; }
            // If we created a new entry, refetch it from the API and set state
            const slug = isTV ? `tv-${showId}-s${seasonNumber}` : `movie-${movie?.id ?? (parsed as any).movieId}`;
            try{
              const r = await fetch(`/api/entry/${slug}`);
              if(r.ok){ const newE = await r.json(); setEntry(newE); if(newE.imagePath) setCustomPoster(newE.imagePath); }
            }catch(e){}
            setEditorOpen(false);
          }}
        />
      )}
    </div>
  );
}