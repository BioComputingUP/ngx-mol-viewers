import{a as s}from"./chunk-SAL4EXGL.js";import{n as o}from"./chunk-T4BLILQN.js";var m=(()=>{let t=class t{constructor(){this.theme$=new o(this.getStoredTheme()),this._theme=this.theme$.subscribe(e=>{this.setStoredTheme(e),e==="auto"&&(e=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),document.documentElement.setAttribute("data-bs-theme",e)})}getStoredTheme(){return localStorage.getItem("theme")||"auto"}setStoredTheme(e){localStorage.setItem("theme",e)}ngOnDestroy(){this._theme.unsubscribe()}};t.\u0275fac=function(i){return new(i||t)},t.\u0275prov=s({token:t,factory:t.\u0275fac,providedIn:"root"});let r=t;return r})();export{m as a};
