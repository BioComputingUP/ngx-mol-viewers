import{A as l,B as F,E as q,F as fe,G,H as u,M as y,N as s,O as R,P as V,R as Fe,S as _e,T as U,U as B,V as _,W as b,X as H,a as le,aa as be,b as ae,ba as I,c as de,ca as Ce,d as M,da as Z,e as ue,g as pe,h as ee,i as te,j as me,k as ge,l as ne,m as p,ma as ke,n as T,na as X,p as x,q as f,r as oe,s as he,u as xe,v as D,w as $,x as L,y as K,z as c}from"./chunk-7IXBJGWD.js";import{F as ce,S as N,a as h,b as k,o as Q,w as S}from"./chunk-AIDIBLDN.js";var ve={I:{"background-color":"#CC79A7","text-color":"black"},L:{"background-color":"#CC79A7","text-color":"black"},V:{"background-color":"#CC79A7","text-color":"black"},A:{"background-color":"#CC79A7","text-color":"black"},M:{"background-color":"#CC79A7","text-color":"black"},F:{"background-color":"#E69F00","text-color":"black"},W:{"background-color":"#E69F00","text-color":"black"},Y:{"background-color":"#E69F00","text-color":"black"},K:{"background-color":"#0072B2","text-color":"white"},R:{"background-color":"#0072B2","text-color":"white"},H:{"background-color":"#0072B2","text-color":"white"},D:{"background-color":"#D55E00","text-color":"black"},E:{"background-color":"#D55E00","text-color":"black"},N:{"background-color":"#009E73","text-color":"black"},Q:{"background-color":"#009E73","text-color":"black"},S:{"background-color":"#009E73","text-color":"black"},T:{"background-color":"#009E73","text-color":"black"},P:{"background-color":"#56B4E9","text-color":"black"},G:{"background-color":"#56B4E9","text-color":"black"},C:{"background-color":"#F0E442","text-color":"black"}};me();var A=class{set index(t){this.keys=t.map(r=>""+r),this.values=t.map((r,e)=>e),this._index=this.keys.reduce((r,e,n)=>(r[""+e]=n,r),{})}get index(){return this._index}map(t){let r=this._index[""+t.start],e=this._index[""+t.end];return k(h({},t),{start:r,end:e})}};var J=(()=>{let t=class t{set select(e){this.select$.next(e)}get select(){return this.select$.value}constructor(e){this.indexService=e,this.select$=new Q(null),this.selected$=this.select$,this.selecting=!1}onMouseDown(e,n){this.selecting=!0,this.select={start:n,end:n}}onMouseEnter(e,n){if(this.selecting){let i=this.indexService.index[n];if(this.select){let{start:a,end:d}=this.indexService.map(this.select);i<a?this.select=k(h({},this.select),{start:n}):i>d&&(this.select=k(h({},this.select),{end:n}))}}}onMouseUp(e){this.selecting=!1}};t.\u0275fac=function(n){return new(n||t)(de(A))},t.\u0275prov=le({token:t,factory:t.\u0275fac});let o=t;return o})();var ie=class{parseFile(t){let r=new FileReader;return r.readAsText(t,"utf-8"),new Promise((e,n)=>{r.onload=()=>e(this.parseText(""+r.result)),r.onerror=i=>n(i)})}parse(t){return typeof t!="string"?this.parseFile(t):this.parseText(""+t)}},re=class extends ie{parseText(t){let r=t.split(/[\n\r]+/),e=[],n=-1;for(let i of r)if(i=i.trim(),i.startsWith(">"))e.push({sequence:"",label:i.slice(1)}),n++;else if(n>-1)e[n].sequence+=i;else throw new Error("Provided text is not in fasta format");return e}},Se=new re;var Ae=o=>({j:o}),Ie=(o,t)=>({i:o,j:t}),je=(o,t)=>({i:"index",name:"index",j:o,value:t}),$e=(o,t)=>({i:"consensus",name:"consensus",j:o,value:t}),Le=(o,t)=>({i:o,j:t,name:"residue"}),Ke=o=>["cell",o];function Ge(o,t){o&1&&(c(0,"div",6),s(1,"Consensus"),l())}function Re(o,t){if(o&1&&(c(0,"div",6),s(1),l()),o&2){let r=t.$implicit;p(),R(r||"Sequence")}}function Be(o,t){o&1&&q(0)}function He(o,t){o&1&&q(0)}function Ye(o,t){if(o&1&&x(0,He,1,0,"ng-container",10),o&2){let r=u().$index,e=u().$implicit;u();let n=y(13);f("ngTemplateOutlet",n)("ngTemplateOutletContext",U(2,Ae,e.start+r))}}function We(o,t){o&1&&q(0)}function ze(o,t){if(o&1&&x(0,We,1,0,"ng-container",10),o&2){let r=u().$index,e=u().$index,n=u().$implicit;u();let i=y(15);f("ngTemplateOutlet",i)("ngTemplateOutletContext",B(2,Ie,r,n.start+e))}}function Qe(o,t){if(o&1&&x(0,ze,1,5,"ng-container"),o&2){let r,e=t.$implicit,n=u().$index;D(0,(r=e[n])?0:-1,r)}}function Ue(o,t){if(o&1&&(c(0,"div",9),x(1,Be,1,0,"ng-container",10)(2,Ye,1,4,"ng-container"),L(3,Qe,1,1,null,null,$),l()),o&2){let r=t.$index,e=u().$implicit,n=u(),i=y(11);p(),f("ngTemplateOutlet",i)("ngTemplateOutletContext",U(3,Ae,e.start+r)),p(),D(2,n.sequences.length>1?2:-1),p(),K(n.sequences)}}function Ze(o,t){if(o&1&&(c(0,"div",8),L(1,Ue,5,5,"div",9,$),l()),o&2){let r=t.$implicit,e=u();p(),K(e.first.slice(r.start,r.end))}}function Xe(o,t){o&1&&q(0)}function Je(o,t){if(o&1&&(x(0,Xe,1,0,"ng-container",10),c(1,"div",11),s(2),l()),o&2){let r=t.j,e=u(),n=y(17);f("ngTemplateOutlet",n)("ngTemplateOutletContext",B(3,je,r,e.indexService.keys[r])),p(2),R(e.indexService.keys[r])}}function et(o,t){o&1&&q(0)}function tt(o,t){if(o&1&&x(0,et,1,0,"ng-container",10),o&2){let r=t.j,e=u(),n=y(17);f("ngTemplateOutlet",n)("ngTemplateOutletContext",B(2,$e,r,e.consensus[r][0]))}}function nt(o,t){o&1&&q(0)}function ot(o,t){if(o&1&&x(0,nt,1,0,"ng-container",10),o&2){let r=t.i,e=t.j;u();let n=y(17);f("ngTemplateOutlet",n)("ngTemplateOutletContext",B(2,Le,r,e))}}function it(o,t){if(o&1){let r=fe();c(0,"div",13),G("mouseenter",function(n){ee(r);let i=u(2).j,a=u();return te(a.onMouseEnter(n,a.indexService.keys[i]))})("mousedown",function(n){ee(r);let i=u(2).j,a=u();return te(a.onMouseDown(n,a.indexService.keys[i]))}),s(1),l()}if(o&2){let r=t,e=u(2),n=e.i,i=e.j,a=e.value,d=e.name,g=u();xe(U(10,Ke,d)),oe("background-color",r["background-color"])("border-color",r["border-color"])("color",r.color),f("id","cell-"+n+"-"+i),p(),V(" ",a||g.sequences[n][i]," ")}}function rt(o,t){if(o&1&&x(0,it,2,12,"div",12),o&2){let r,e=u(),n=e.i,i=e.j;D(0,(r=t[n][i])?0:-1,r)}}function st(o,t){if(o&1&&(x(0,rt,1,1),_(1,"async")),o&2){let r,e=u();D(0,(r=b(1,1,e.styles$))?0:-1,r)}}var P=(()=>{let t=class t{set settings(e){this._settings=h(h({},this.settings),e||{});let{"chunk-size":n,"rotate-index":i}=this.settings;this._settings["rotate-index"]=n<0?!0:i,this._settings["split-chunks"]=!(n<0)}get settings(){return this._settings}get split(){return this.settings["chunk-size"]}get cmap(){return this.settings["color-map"]}get first(){return this.sequences[0]}get length(){return this.first.length}set select(e){this.selectionService.select=e}constructor(e,n){this.selectionService=e,this.indexService=n,this._settings={"chunk-size":5,"background-color":"transparent","selection-color":"greenyellow","text-color":"black","rotate-index":!1,"split-chunks":!1,"color-map":ve},this.loci$=new Q({}),this.loci=[],this.selected$=this.selectionService.selected$,this.styles$=this.loci$.pipe(ce(this.selected$),S(([i,a])=>{let d={},W=[this.consensus.map(([m])=>m).join(""),...this.sequences||[]];for(let m=0;m<W.length;m++){let v=m<1?"consensus":m-1;d[v]=[];for(let C=0;C<this.length;C++){let w=W[m][C],E=this.settings["background-color"],O=this.settings["background-color"],z=this.settings["text-color"];if(w in this.settings["color-map"]&&(O=this.settings["color-map"][w]["background-color"]),C in i){let j=i[C];E=j["background-color"]||E,O=j["background-color"]||O,z=j["text-color"]||z}if(a){let{start:j,end:Oe}=this.indexService.map(a);if(j<=C&&C<=Oe){let se=this.settings["selection-color"];E=se,O=se}}w in this.settings["color-map"]&&(E=this.settings["color-map"][w]["background-color"],z=this.settings["color-map"][w]["text-color"]);let Pe={"background-color":E,"border-color":O,color:z};d[v][C]=Pe}}d.index=[];for(let m=0;m<this.length;m++){let v=this.settings["background-color"],C=this.settings["text-color"];if(m in i&&(v=i[m]["background-color"]||v),a){let{start:w,end:E}=this.indexService.map(a);w<=m&&m<=E&&(v=this.settings["selection-color"])}d.index[m]={"background-color":v,"border-color":v,color:C}}return d}),N(1))}onMouseUp(e){this.selectionService.onMouseUp(e)}onMouseDown(e,n){this.selectionService.onMouseDown(e,n),e.preventDefault(),e.stopPropagation()}onMouseDownOut(){this.selectionService.select$.next(null)}onMouseEnter(e,n){this.selectionService.onMouseEnter(e,n)}ngOnChanges(e){e&&(this.setSequences(),this.setChunks(),this.setLogo(),this.setConsensus(),this.setIndex(),this.setLoci())}setSequences(){if(this.sequences&&this.labels){if(this.sequences.length!==this.labels.length)throw new Error("Number of sequences does not match number of labels")}else if(this.fasta){let e=Se.parse(this.fasta);this.sequences=e.map(n=>n.sequence),this.labels=this.labels||e.map(n=>n.label)}else if(this.sequence)this.labels=[this.label||""],this.sequences=[this.sequence];else throw new Error("No single sequence, nor fasta were provided");if(this.labels){let e=this.sequences.length,n=this.sequences[0].length;if(e<1)throw new Error("No sequences were provided");if(this.labels.length!==e)throw new Error("Number of labels does not match number of sequences");if(this.sequences.some(i=>i.length!==n))throw new Error("All sequences must have the same length")}else throw new Error("No labels were provided")}setChunks(){this.chunks=[];let e=this.length,n=this.split>=0?this.split:1;for(let i=0;i<e;i=i+n){let a=Math.min(e,i+n);this.chunks.push({start:i,end:a})}}setLogo(){this.logo=[];let e=this.sequences||[],n=e.length;for(let i=0;i<this.length;i++){let a={};for(let d of e){let g=d[i];g in a?a[g]++:a[g]=1}for(let d in a)a[d]/=n;a=Object.fromEntries(Object.entries(a).sort((d,g)=>g[1]-d[1])),this.logo.push(a)}}setConsensus(){this.consensus=[];for(let e=0;e<this.length;e++){let n=Object.entries(this.logo[e]);this.consensus.push(n[0])}}setIndex(){let e=this.index;e||(e=Array.from({length:this.length},(n,i)=>i+1)),this.indexService.index=e}setLoci(){let e=this.loci.reduce((n,i)=>{let{start:a,end:d}=this.indexService.map(i);for(let g=a;g<=d;g++){let W=this.indexService.values[g];n[W]=i}return n},{});this.loci$.next(e)}asOpacity(e){return`${Math.round(e*100)}%`}};t.\u0275fac=function(n){return new(n||t)(T(J),T(A))},t.\u0275cmp=M({type:t,selectors:[["ngx-sequence-viewer"]],hostBindings:function(n,i){n&1&&G("mouseup",function(d){return i.onMouseUp(d)},!1,ne)("mousedown",function(){return i.onMouseDownOut()},!1,ne)},inputs:{settings:"settings",label:"label",labels:"labels",fasta:"fasta",sequence:"sequence",sequences:"sequences",index:"index",loci:"loci",select:"select"},outputs:{selected$:"selected$"},standalone:!0,features:[Fe([J,A]),pe,_e],decls:18,vars:9,consts:[["indexCellTemplate",""],["consensusCellTemplate",""],["residueCellTemplate",""],["cellTemplate",""],[1,"scaffold"],[1,"labels"],[1,"label"],[1,"chunks"],[1,"chunk"],[1,"position"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],[1,"placeholder","index"],[3,"id","class","background-color","border-color","color"],[3,"mouseenter","mousedown","id"]],template:function(n,i){n&1&&(c(0,"div",4)(1,"div",5)(2,"div",6),s(3,"Index"),l(),x(4,Ge,2,0,"div",6),L(5,Re,2,1,"div",6,$),l(),c(7,"div",7),L(8,Ze,3,0,"div",8,$),l()(),x(10,Je,3,6,"ng-template",null,0,H)(12,tt,1,5,"ng-template",null,1,H)(14,ot,1,5,"ng-template",null,2,H)(16,st,2,3,"ng-template",null,3,H)),n&2&&(oe("background-color",i.settings["background-color"])("color",i.settings["text-color"]),he("split-chunks",i.settings["split-chunks"])("rotate-index",i.settings["rotate-index"]),p(4),D(4,i.sequences.length>1?4:-1),p(),K(i.labels),p(3),K(i.chunks))},dependencies:[Z,be,I],styles:["[_nghost-%COMP%]{position:relative;display:block;height:auto;width:100%;overflow:hidden;font-family:monospace,monospace;-webkit-user-select:none;user-select:none;cursor:default}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:start;align-items:stretch;overflow:auto;gap:.25rem}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .labels[_ngcontent-%COMP%]{display:flex;flex-direction:column;justify-content:end;align-items:end;position:sticky;left:0;z-index:999;padding-right:.25rem;background-color:inherit;color:inherit}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .chunks[_ngcontent-%COMP%]{display:flex;flex-direction:row;flex-shrink:0;flex-grow:1}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .chunk[_ngcontent-%COMP%]{display:flex;flex-direction:row;flex-wrap:nowrap;overflow:hidden;gap:0}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .position[_ngcontent-%COMP%]{display:flex;flex-direction:column;justify-content:end;align-items:center;position:relative}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .position[_ngcontent-%COMP%]   .placeholder.index[_ngcontent-%COMP%]{position:absolute;right:0;top:0;display:none;pointer-events:none}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .position[_ngcontent-%COMP%]   .residue[_ngcontent-%COMP%], [_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .position[_ngcontent-%COMP%]   .consensus[_ngcontent-%COMP%]{width:100%;text-align:center}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .label[_ngcontent-%COMP%], [_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .cell.index[_ngcontent-%COMP%], [_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .cell.residue[_ngcontent-%COMP%], [_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .cell.consensus[_ngcontent-%COMP%]{border-color:transparent;border-width:1px;border-style:solid}[_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .cell.index[_ngcontent-%COMP%], [_nghost-%COMP%]   .scaffold[_ngcontent-%COMP%]   .placeholder.index[_ngcontent-%COMP%]{font-size:.75em}[_nghost-%COMP%]   .scaffold.rotate-index[_ngcontent-%COMP%]   .cell.index[_ngcontent-%COMP%]{display:block;flex-grow:1;position:relative!important;height:auto;text-align:left;transform:rotate(-180deg);writing-mode:vertical-rl;white-space:nowrap;padding-bottom:.25rem;padding-top:.25rem}[_nghost-%COMP%]   .scaffold.split-chunks[_ngcontent-%COMP%]   .chunks[_ngcontent-%COMP%]{gap:.25rem}[_nghost-%COMP%]   .scaffold.split-chunks[_ngcontent-%COMP%]   .cell.index[_ngcontent-%COMP%]{font-size:0;height:100%;width:100%}[_nghost-%COMP%]   .scaffold.split-chunks[_ngcontent-%COMP%]   .position[_ngcontent-%COMP%]:last-child   .placeholder.index[_ngcontent-%COMP%]{display:block;opacity:unset;background:inherit}"],changeDetection:0});let o=t;return o})();var lt=`>unit.1.fasta
RFSIAYWHTFTADGTDQFGKATMQRPWNHYTDPMDIA---KARVEAAFEFFDKIN-----
--------
>unit.7.fasta
----GV------LGSIDANTGDMLLGWDTDQFPTDIRMT----TLAMYEVIKMGG-----
--------
>unit.2.fasta
---APY-FCFH-DRDIAPEGDTLRET------------------------NKNLDTIVAM
IKDYLKTS
>unit.3.fasta
-KTKVLWGTAN-----LFSNPRFVHGAS-TSCNADVFAYSAAQVKKALEITKELG-----
--------
>unit.6.fasta
-DKY------------FKVNIEANH----ATLAFHDF------QH-ELRYARIN------
--------
>unit.5.fasta
----------F-EGQFLIE-PKPKEP---TK---HQY---DFDVANVLAFLRKYDL----
--------
>unit.4.fasta
GENYVFWGGREGYETLLNTDMEFE------LDNFARF------LHMAVDYAKEIG-----
--------
>unit.8.fasta
---------FD-KGGLNFD-AKVRRA---SFEPEDLF---LGHIAGMDAFAKGFKVAYKL
VKD-----`,Te=(()=>{let t=class t{constructor(e){this.themeSelectorService=e,this.fasta=lt,this.settings={"background-color":"#FFFFFF","text-color":"black","chunk-size":5,"rotate-index":!1},this.loci=[{start:20,end:30,"background-color":"#648FFF"},{start:40,end:50,"background-color":"#FE6100"},{start:60,end:70,"background-color":"#648FFF"}],this.selected$=new ge;let n=this.themeSelectorService.theme$;this.settings$=n.pipe(S(()=>document.documentElement.getAttribute("data-bs-theme")),S(i=>i==="dark"?k(h({},this.settings),{"background-color":"#212529","text-color":"white"}):this.settings),N(1))}onSelected(e){this.selected$.emit(e)}};t.\u0275fac=function(n){return new(n||t)(T(X))},t.\u0275cmp=M({type:t,selectors:[["app-multiple-sequence-alignment"]],decls:68,vars:19,consts:[[1,"mb-3"],[1,"mb-1"],[1,"mb-0"],[3,"selected$","fasta","loci","settings"]],template:function(n,i){n&1&&(c(0,"div",0)(1,"h2"),s(2,"Mutliple sequence alignment"),l(),c(3,"div",0)(4,"p",1),s(5," This sequence viewer allows to visualize a multiple sequence alignment (MSA). "),c(6,"b"),s(7,"Index"),l(),s(8," can be shown for each position in the alignment. Otherwise, positions can be grouped in chunks. Hence, onlythe index of the last position in each chunk is shown."),F(9,"br"),l(),c(10,"p",1),s(11," For each position in the alignment, logo is computed."),F(12,"br"),s(13,"The "),c(14,"b"),s(15,"logo"),l(),s(16," is the relative frequency of a each amino-acid within a specific position. "),c(17,"b"),s(18,"Consensus"),l(),s(19," is shown in the first row: the most frequent amino-acid in each specific position. "),l(),c(20,"p",2),s(21," Custom "),c(22,"b"),s(23,"color map"),l(),s(24," can be defined for each residue. However, by default we offer a color map based on the broadly adopted ZAPPO scheme. Such scheme has been implemented using the Wong et al. palette for color blindness. "),l()(),c(25,"div",0)(26,"ngx-sequence-viewer",3),_(27,"async"),G("selected$",function(d){return i.onSelected(d)}),l()(),c(28,"div",0)(29,"p",1),s(30," The tool allows to "),c(31,"b"),s(32,"highlight"),l(),s(33," one or more loci. A "),c(34,"b"),s(35,"locus"),l(),s(36," is defined as one or more contiguous positions. It is identified by its start and end positions. "),l(),c(37,"p",1),s(38," Each locus allows to define a custom "),c(39,"code"),s(40,"background-color"),l(),s(41," property which is then applied to the border of cells within locus' boundaries, as well as the background for those cells for which the selected color map does not have an associated color (e.g. gaps) and index. "),l(),c(42,"p",2),s(43," Currently highlighted loci are: "),c(44,"code"),s(45," ["),F(46,"br"),s(47),_(48,"json"),F(49,"br"),s(50),_(51,"json"),F(52,"br"),s(53),_(54,"json"),F(55,"br"),s(56," ] "),l()()(),c(57,"div",0)(58,"p",1)(59,"b"),s(60,"Selection"),l(),s(61," functionality is provided by the component. An event is emitted when a locus is selected. Selected locus applies `selection-color`, defined in settings, to the border of cells within selected locus boundaries, to the background of those cells for which the selected color map does not have an associated color (e.g. gaps) and index. This overrides the style applied by other loci beforehand. "),l(),c(62,"p",2),s(63," Currently selected locus is: "),c(64,"code"),s(65),_(66,"async"),_(67,"json"),l()()()()),n&2&&(p(26),f("fasta",i.fasta)("loci",i.loci)("settings",b(27,7,i.settings$)),p(21),V(" \xA0\xA0\xA0\xA0",b(48,9,i.loci[0]),""),p(3),V(" \xA0\xA0\xA0\xA0",b(51,11,i.loci[1]),""),p(3),V(" \xA0\xA0\xA0\xA0",b(54,13,i.loci[2]),""),p(12),R(b(67,17,b(66,15,i.selected$))))},dependencies:[P,I,Ce]});let o=t;return o})();var qe=(()=>{let t=class t{constructor(e){this.themeSelectorService=e,this.settings={"background-color":"#FFFFFF","text-color":"black","rotate-index":!0,"chunk-size":-1},this.sequence="MTEITAAMVKELRESTGAGMMDCKNALSETNGDFDKAVQLLREKGLGKAAKKADRLAAEG",this.index=this.sequence.split("").map((i,a)=>{let d=""+a;return["A","E","I","O","U"].includes(i)&&(d=d+i),a%2===1&&(d="-"+d),d}),this.loci=[{start:"-1",end:"10E","background-color":"#648FFF",text:"Region 1"},{start:"-23",end:"36A","background-color":"#DC267F",text:"Region 2"}];let n=this.themeSelectorService.theme$;this.settings$=n.pipe(S(()=>document.documentElement.getAttribute("data-bs-theme")),S(i=>i==="dark"?k(h({},this.settings),{"background-color":"#212529","text-color":"white"}):this.settings),N(1))}};t.\u0275fac=function(n){return new(n||t)(T(X))},t.\u0275cmp=M({type:t,selectors:[["app-single-sequence-viewer"]],decls:20,vars:6,consts:[[1,"mb-3"],[3,"sequence","index","loci","settings"],[1,"mb-1"],[1,"mb-0"]],template:function(n,i){n&1&&(c(0,"div",0)(1,"h2"),s(2,"Single sequence viewer"),l(),c(3,"div",0),F(4,"ngx-sequence-viewer",1),_(5,"async"),l(),c(6,"div",0)(7,"p",2),s(8," In this case, a single sequence is shown by the sequence viewer. No split parameter has been set for chunks, so no chunk is visible. Instead, the "),c(9,"b"),s(10,"index"),l(),s(11," of each position is visualized. Each index is "),c(12,"b"),s(13,"rotated"),l(),s(14,", in order for each position to mantain the same width. "),l(),c(15,"p",3),s(16," A custom index has been set in this specific example. Doing so, not only we allow to show sequences with a numeric index (e.g. protein sequences from the UniProtKB). Instead, we allow also other kind of sequences, such as those underlying protein structures from the PDB to be represented. In fact, those have a particular "),c(17,"b"),s(18,"alpha-numeric"),l(),s(19," index. "),l()()()),n&2&&(p(4),f("sequence",i.sequence)("index",i.index)("loci",i.loci)("settings",b(5,4,i.settings$)))},dependencies:[P,I]});let o=t;return o})();var ye=(()=>{let t=class t{};t.\u0275fac=function(n){return new(n||t)},t.\u0275cmp=M({type:t,selectors:[["app-page-sequence-viewer"]],decls:3,vars:0,consts:[[1,"container","pt-3"]],template:function(n,i){n&1&&(c(0,"div",0),F(1,"app-multiple-sequence-alignment")(2,"app-single-sequence-viewer"),l())},dependencies:[Te,qe]});let o=t;return o})();var ut=[{path:"",component:ye}],Lt=(()=>{let t=class t{};t.\u0275fac=function(n){return new(n||t)},t.\u0275mod=ue({type:t}),t.\u0275inj=ae({imports:[P,ke.forChild(ut),Z]});let o=t;return o})();export{Lt as PageSequenceViewerModule};
