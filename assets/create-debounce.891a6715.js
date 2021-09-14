var e=Object.defineProperty,t=Object.defineProperties,r=Object.getOwnPropertyDescriptors,o=Object.getOwnPropertySymbols,n=Object.prototype.hasOwnProperty,s=Object.prototype.propertyIsEnumerable,i=(t,r,o)=>r in t?e(t,r,{enumerable:!0,configurable:!0,writable:!0,value:o}):t[r]=o,c=("undefined"!=typeof require&&require,(e,t,r)=>(i(e,"symbol"!=typeof t?t+"":t,r),r));const a=(e,t,r,o)=>{if("length"===r||"prototype"===r)return;if("arguments"===r||"caller"===r)return;const n=Object.getOwnPropertyDescriptor(e,r),s=Object.getOwnPropertyDescriptor(t,r);!p(n,s)&&o||Object.defineProperty(e,r,s)},p=function(e,t){return void 0===e||e.configurable||e.writable===t.writable&&e.enumerable===t.enumerable&&e.configurable===t.configurable&&(e.writable||e.value===t.value)},u=(e,t)=>`/* Wrapped ${e}*/\n${t}`,l=Object.getOwnPropertyDescriptor(Function.prototype,"toString"),f=Object.getOwnPropertyDescriptor(Function.prototype.toString,"name"),d=(e,c,a)=>{const p=""===a?"":`with ${a.trim()}() `,d=u.bind(null,p,c.toString());var b;Object.defineProperty(d,"name",f),Object.defineProperty(e,"toString",(b=((e,t)=>{for(var r in t||(t={}))n.call(t,r)&&i(e,r,t[r]);if(o)for(var r of o(t))s.call(t,r)&&i(e,r,t[r]);return e})({},l),t(b,r({value:d}))))};var b=(e,t,{ignoreNonConfigurable:r=!1}={})=>{const{name:o}=e;for(const n of Reflect.ownKeys(t))a(e,t,n,r);return((e,t)=>{const r=Object.getPrototypeOf(t);r!==Object.getPrototypeOf(e)&&Object.setPrototypeOf(e,r)})(e,t),d(e,t,o),e};const y=(e,t={})=>{if("function"!=typeof e)throw new TypeError(`Expected the first argument to be a function, got \`${typeof e}\``);const{wait:r=0,maxWait:o=Number.Infinity,before:n=!1,after:s=!0}=t;if(!n&&!s)throw new Error("Both `before` and `after` are false, function wouldn't be called.");let i,c,a;const p=function(...t){const p=this,u=()=>{c=void 0,i&&(clearTimeout(i),i=void 0),s&&(a=e.apply(p,t))},l=n&&!i;return clearTimeout(i),i=setTimeout((()=>{i=void 0,c&&(clearTimeout(c),c=void 0),s&&(a=e.apply(p,t))}),r),o>0&&o!==Number.Infinity&&!c&&(c=setTimeout(u,o)),l&&(a=e.apply(p,t)),a};return b(p,e),p.cancel=()=>{i&&(clearTimeout(i),i=void 0),c&&(clearTimeout(c),c=void 0)},p};class h{constructor(){c(this,"disposers",new Map),c(this,"disposerIDGenCount",1)}add(e,t=this.genDisposerID()){return this.flush(t),this.disposers.set(t,e()),t}addDisposer(e,t=this.genDisposerID()){return this.add((()=>e),t)}addEventListener(e,t,r,o){e.addEventListener(t,r,o);const n=this.genDisposerID();return this.disposers.set(n,(()=>{e.removeEventListener(t,r)})),n}setTimeout(e,t,r=this.genDisposerID()){const o=window.setTimeout((()=>{e(),this.remove(r)}),t);this.disposers.set(r,(()=>{window.clearTimeout(o)}))}remove(e){const t=this.disposers.get(e);return this.disposers.delete(e),t}flush(e){if(e){const r=this.remove(e);if(r)try{r()}catch(t){console.error(t)}}else this.disposers.forEach((e=>{try{e()}catch(t){console.error(t)}})),this.disposers.clear()}genDisposerID(){return"disposer-"+this.disposerIDGenCount++}}function m(e){return(t,r)=>{const o=y(t,r);return e.addDisposer((()=>o.cancel())),o}}export{h as S,m as c,y as d};
