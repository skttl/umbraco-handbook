import { Marked } from 'marked';
import GithubSlugger from 'github-slugger';

export async function renderDocument(markdown: string): Promise<HTMLElement> {
  const target = document.createElement('div');
  const escape = (value: string) => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
  const parser = new Marked({gfm:true,renderer:{image:({href,text,title})=>`<img data-handbook-src="${escape(href)}" alt="${escape(text)}" title="${escape(title ?? '')}">`}});
  const html = await parser.parse(markdown, {async:false});
  const tags = ['p','br','hr','h1','h2','h3','h4','h5','h6','a','img','strong','em','del','blockquote','pre','code','ul','ol','li','table','thead','tbody','tr','th','td','input'];
  const attrs = ['href','data-handbook-src','alt','title','class','type','checked','disabled','start','align'];
  if ('setHTML' in target) {
    (target as HTMLElement & {setHTML:(html:string,options:unknown)=>void}).setHTML(html,{sanitizer:{elements:tags,attributes:attrs}});
  } else {
    const {default:purify} = await import('dompurify');
    const fragment = purify.sanitize(html,{ALLOWED_TAGS:[...tags,'#text'],ALLOWED_ATTR:attrs,ALLOW_ARIA_ATTR:false,ALLOW_DATA_ATTR:false,KEEP_CONTENT:false,RETURN_DOM_FRAGMENT:true});
    target.replaceChildren(fragment);
  }
  const slugger = new GithubSlugger();
  target.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => heading.id = slugger.slug(heading.textContent ?? ''));
  target.querySelectorAll('input').forEach(input => { input.disabled = true; input.type = 'checkbox'; });
  return target;
}
