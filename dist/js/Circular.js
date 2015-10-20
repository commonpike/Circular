var Circular = {
	
	/* ----------------------
		config
	----------------------- */
	
	config	: {
		version					: '0.0.9'		
	},
	
	// status
	dead	: false,
	

	/* ----------------------
		modules 
	----------------------- */
	
	modules : {
		
		stack	: [
			// this is where the circularmodules are stored
			// the order matters
		],
		
		attr2idx					: {
			// map attribute names to modules
		},
		
		name2idx					: {
			// map module names to modules
		},
		
		add	: function(mod) {
		
			if (Circular.debug) {
				Circular.debug.write('Circular.modules.add',mod.name);
			}
			
			if (!Circular.dead) {

				valid = true;
				
				if (Circular[mod.name]) {
					if (Circular.log) {
						Circular.log.error('Circular.modules.add','mod.'+mod.name+' namespace already taken');
					}
					valid = false;
				}
				
				if (mod.requires) {
					mod.requires.forEach(function(name) {
						if (this.name2idx[name]===undefined) {
							if (Circular.log) {
								Circular.log.error('Circular.modules.add','mod.'+mod.name+' requires mod.'+name);
							}
							valid=false;
						}
					},this);
				}
				
				if (valid) {
					this.stack.push(mod);
					var idx = this.stack.length-1;
					this.name2idx[mod.name]=idx;
					this.attr2idx['cc-'+mod.name]=idx;
					this.attr2idx['data-cc-'+mod.name]=idx;
					
					if (Circular[mod.name]===undefined) {
						// this is usefull for in templating,
						// eg use @loop to access Circular.modules.stack.loop
						Circular[mod.name]=this.stack[idx];
					} else {
						Circular.log.warn('@global "'+mod.name+'" is taken: @'+mod.name+' wont work');
					}
					
					if (mod.name=="debug" && Circular.config.debugging) {
						Circular.debug.on();
					}
					
				} else {
					//crucial
					if (Circular.log) Circular.log.fatal('Circular.modules.add','fatal error');
					Circular.die();
				}
			}

		},
		
		init	: function() {
			
			if (Circular.debug) Circular.debug.write('Circular.modules.init');
			
			// create a stylesheet, add all css
			var css = '';
			this.stack.forEach(function(mod) {
				if (mod.css) css += mod.css;
				if (mod.config) $.extend(Circular.config,mod.config);
			});
			
			if (css) {
				var styleElement = document.createElement("style");
				styleElement.type = "text/css";
				document.head.appendChild(styleElement);
				
				// ruff stuff. probs in ie<9
				styleElement.appendChild(document.createTextNode(css));
			}
			
			for (var dc=0; dc < this.stack.length; dc++) {
				if (this.stack[dc].init) {
					this.stack[dc].init();
				}
			}
				
			
		}
		
		
		
	},


	/* ----------------------
		init 
	----------------------- */

	init 		: function(config) {
		$(document).ready(function() {
			Circular.modules.init();
			$.extend(Circular.config,config);
			if (Circular.engine) {
				Circular.engine.cycle();	
			} else if (Circular.log) {
				Circular.log.fatal('Circular mod.engine not found');
			} else {
				alert('Circular mod.engine and mod.log not found');
				this.die();
			}
		});
	},
	
	die		: function() {
		this.dead = true;
	}


}

function CircularModule(def) {
	if (def.name) {
		if (!def.init) 	def.init	= null;
		if (!def.css)		def.css	= '';
		if (!def.in)		def.in 	= function(attr,node,props) { return true; }
		if (!def.out) 	def.out = function(attr,node,props) { return true; }	
		Circular.modules.add(def);
	} 
}

/*! jQuery v2.1.4 | (c) 2005, 2015 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k={},l=a.document,m="2.1.4",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return n.each(this,a,b)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(n.isPlainObject(d)||(e=n.isArray(d)))?(e?(e=!1,f=c&&n.isArray(c)?c:[]):f=c&&n.isPlainObject(c)?c:{},g[b]=n.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){return!n.isArray(a)&&a-parseFloat(a)+1>=0},isPlainObject:function(a){return"object"!==n.type(a)||a.nodeType||n.isWindow(a)?!1:a.constructor&&!j.call(a.constructor.prototype,"isPrototypeOf")?!1:!0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(a){var b,c=eval;a=n.trim(a),a&&(1===a.indexOf("use strict")?(b=l.createElement("script"),b.text=a,l.head.appendChild(b).parentNode.removeChild(b)):c(a))},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=s(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:g.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=s(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(c=a[b],b=a,a=c),n.isFunction(a)?(e=d.call(arguments,2),f=function(){return a.apply(b||this,e.concat(d.call(arguments)))},f.guid=a.guid=a.guid||n.guid++,f):void 0},now:Date.now,support:k}),n.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function s(a){var b="length"in a&&a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ha(),z=ha(),A=ha(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N=M.replace("w","w#"),O="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+N+"))|)"+L+"*\\]",P=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+O+")*)|.*)\\)|)",Q=new RegExp(L+"+","g"),R=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),S=new RegExp("^"+L+"*,"+L+"*"),T=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),U=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),V=new RegExp(P),W=new RegExp("^"+N+"$"),X={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M.replace("w","w*")+")"),ATTR:new RegExp("^"+O),PSEUDO:new RegExp("^"+P),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/^[^{]+\{\s*\[native \w/,_=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,aa=/[+~]/,ba=/'|\\/g,ca=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),da=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},ea=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(fa){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function ga(a,b,d,e){var f,h,j,k,l,o,r,s,w,x;if((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,d=d||[],k=b.nodeType,"string"!=typeof a||!a||1!==k&&9!==k&&11!==k)return d;if(!e&&p){if(11!==k&&(f=_.exec(a)))if(j=f[1]){if(9===k){if(h=b.getElementById(j),!h||!h.parentNode)return d;if(h.id===j)return d.push(h),d}else if(b.ownerDocument&&(h=b.ownerDocument.getElementById(j))&&t(b,h)&&h.id===j)return d.push(h),d}else{if(f[2])return H.apply(d,b.getElementsByTagName(a)),d;if((j=f[3])&&c.getElementsByClassName)return H.apply(d,b.getElementsByClassName(j)),d}if(c.qsa&&(!q||!q.test(a))){if(s=r=u,w=b,x=1!==k&&a,1===k&&"object"!==b.nodeName.toLowerCase()){o=g(a),(r=b.getAttribute("id"))?s=r.replace(ba,"\\$&"):b.setAttribute("id",s),s="[id='"+s+"'] ",l=o.length;while(l--)o[l]=s+ra(o[l]);w=aa.test(a)&&pa(b.parentNode)||b,x=o.join(",")}if(x)try{return H.apply(d,w.querySelectorAll(x)),d}catch(y){}finally{r||b.removeAttribute("id")}}}return i(a.replace(R,"$1"),b,d,e)}function ha(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ia(a){return a[u]=!0,a}function ja(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ka(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function la(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function na(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function oa(a){return ia(function(b){return b=+b,ia(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function pa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=ga.support={},f=ga.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=ga.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=g.documentElement,e=g.defaultView,e&&e!==e.top&&(e.addEventListener?e.addEventListener("unload",ea,!1):e.attachEvent&&e.attachEvent("onunload",ea)),p=!f(g),c.attributes=ja(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ja(function(a){return a.appendChild(g.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=$.test(g.getElementsByClassName),c.getById=ja(function(a){return o.appendChild(a).id=u,!g.getElementsByName||!g.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=$.test(g.querySelectorAll))&&(ja(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\f]' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ja(function(a){var b=g.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=$.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ja(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",P)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=$.test(o.compareDocumentPosition),t=b||$.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===g||a.ownerDocument===v&&t(v,a)?-1:b===g||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,h=[a],i=[b];if(!e||!f)return a===g?-1:b===g?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return la(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)i.unshift(c);while(h[d]===i[d])d++;return d?la(h[d],i[d]):h[d]===v?-1:i[d]===v?1:0},g):n},ga.matches=function(a,b){return ga(a,null,null,b)},ga.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(U,"='$1']"),!(!c.matchesSelector||!p||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return ga(b,n,null,[a]).length>0},ga.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},ga.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ga.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ga.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=ga.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ga.selectors={cacheLength:50,createPseudo:ia,match:X,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ca,da),a[3]=(a[3]||a[4]||a[5]||"").replace(ca,da),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ga.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ga.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return X.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&V.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ca,da).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ga.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(Q," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===w&&j[1],m=j[0]===w&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[w,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===w)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(s&&((l[u]||(l[u]={}))[a]=[w,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ga.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ia(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ia(function(a){var b=[],c=[],d=h(a.replace(R,"$1"));return d[u]?ia(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ia(function(a){return function(b){return ga(a,b).length>0}}),contains:ia(function(a){return a=a.replace(ca,da),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ia(function(a){return W.test(a||"")||ga.error("unsupported lang: "+a),a=a.replace(ca,da).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:oa(function(){return[0]}),last:oa(function(a,b){return[b-1]}),eq:oa(function(a,b,c){return[0>c?c+b:c]}),even:oa(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:oa(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:oa(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:oa(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ma(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=na(b);function qa(){}qa.prototype=d.filters=d.pseudos,d.setFilters=new qa,g=ga.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=S.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=T.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(R," ")}),h=h.slice(c.length));for(g in d.filter)!(e=X[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ga.error(a):z(a,i).slice(0)};function ra(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function sa(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[u]||(b[u]={}),(h=i[d])&&h[0]===w&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function ta(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ua(a,b,c){for(var d=0,e=b.length;e>d;d++)ga(a,b[d],c);return c}function va(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function wa(a,b,c,d,e,f){return d&&!d[u]&&(d=wa(d)),e&&!e[u]&&(e=wa(e,f)),ia(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ua(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:va(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=va(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=va(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function xa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=sa(function(a){return a===b},h,!0),l=sa(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[sa(ta(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return wa(i>1&&ta(m),i>1&&ra(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(R,"$1"),c,e>i&&xa(a.slice(i,e)),f>e&&xa(a=a.slice(e)),f>e&&ra(a))}m.push(c)}return ta(m)}function ya(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,m,o,p=0,q="0",r=f&&[],s=[],t=j,u=f||e&&d.find.TAG("*",k),v=w+=null==t?1:Math.random()||.1,x=u.length;for(k&&(j=g!==n&&g);q!==x&&null!=(l=u[q]);q++){if(e&&l){m=0;while(o=a[m++])if(o(l,g,h)){i.push(l);break}k&&(w=v)}c&&((l=!o&&l)&&p--,f&&r.push(l))}if(p+=q,c&&q!==p){m=0;while(o=b[m++])o(r,s,g,h);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=F.call(i));s=va(s)}H.apply(i,s),k&&!f&&s.length>0&&p+b.length>1&&ga.uniqueSort(i)}return k&&(w=v,j=t),r};return c?ia(f):f}return h=ga.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=xa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,ya(e,d)),f.selector=a}return f},i=ga.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ca,da),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=X.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ca,da),aa.test(j[0].type)&&pa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&ra(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,aa.test(a)&&pa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ja(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ja(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ka("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ja(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ka("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ja(function(a){return null==a.getAttribute("disabled")})||ka(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ga}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=n.expr.match.needsContext,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^.[^:#\[\.,]*$/;function x(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(w.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return g.call(b,a)>=0!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=this.length,d=[],e=this;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;c>b;b++)if(n.contains(e[b],this))return!0}));for(b=0;c>b;b++)n.find(a,e[b],d);return d=this.pushStack(c>1?n.unique(d):d),d.selector=this.selector?this.selector+" "+a:a,d},filter:function(a){return this.pushStack(x(this,a||[],!1))},not:function(a){return this.pushStack(x(this,a||[],!0))},is:function(a){return!!x(this,"string"==typeof a&&u.test(a)?n(a):a||[],!1).length}});var y,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=n.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||y).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:l,!0)),v.test(c[1])&&n.isPlainObject(b))for(c in b)n.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}return d=l.getElementById(c[2]),d&&d.parentNode&&(this.length=1,this[0]=d),this.context=l,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?"undefined"!=typeof y.ready?y.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};A.prototype=n.fn,y=n(l);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};n.extend({dir:function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a)}return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),n.fn.extend({has:function(a){var b=n(a,this),c=b.length;return this.filter(function(){for(var a=0;c>a;a++)if(n.contains(this,b[a]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=u.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.unique(f):f)},index:function(a){return a?"string"==typeof a?g.call(n(a),this[0]):g.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.unique(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){while((a=a[b])&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return n.dir(a,"parentNode")},parentsUntil:function(a,b,c){return n.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return n.dir(a,"nextSibling")},prevAll:function(a){return n.dir(a,"previousSibling")},nextUntil:function(a,b,c){return n.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return n.dir(a,"previousSibling",c)},siblings:function(a){return n.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return n.sibling(a.firstChild)},contents:function(a){return a.contentDocument||n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(C[a]||n.unique(e),B.test(a)&&e.reverse()),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return n.each(a.match(E)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):n.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(b=a.memory&&l,c=!0,g=e||0,e=0,f=h.length,d=!0;h&&f>g;g++)if(h[g].apply(l[0],l[1])===!1&&a.stopOnFalse){b=!1;break}d=!1,h&&(i?i.length&&j(i.shift()):b?h=[]:k.disable())},k={add:function(){if(h){var c=h.length;!function g(b){n.each(b,function(b,c){var d=n.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&g(c)})}(arguments),d?f=h.length:b&&(e=c,j(b))}return this},remove:function(){return h&&n.each(arguments,function(a,b){var c;while((c=n.inArray(b,h,c))>-1)h.splice(c,1),d&&(f>=c&&f--,g>=c&&g--)}),this},has:function(a){return a?n.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],f=0,this},disable:function(){return h=i=b=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,b||k.disable(),this},locked:function(){return!i},fireWith:function(a,b){return!h||c&&!i||(b=b||[],b=[a,b.slice?b.slice():b],d?i.push(b):j(b)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!c}};return k},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&n.isFunction(a.promise)?e:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){(a===!0?--n.readyWait:n.isReady)||(n.isReady=!0,a!==!0&&--n.readyWait>0||(H.resolveWith(l,[n]),n.fn.triggerHandler&&(n(l).triggerHandler("ready"),n(l).off("ready"))))}});function I(){l.removeEventListener("DOMContentLoaded",I,!1),a.removeEventListener("load",I,!1),n.ready()}n.ready.promise=function(b){return H||(H=n.Deferred(),"complete"===l.readyState?setTimeout(n.ready):(l.addEventListener("DOMContentLoaded",I,!1),a.addEventListener("load",I,!1))),H.promise(b)},n.ready.promise();var J=n.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)n.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f};n.acceptData=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function K(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=n.expando+K.uid++}K.uid=1,K.accepts=n.acceptData,K.prototype={key:function(a){if(!K.accepts(a))return 0;var b={},c=a[this.expando];if(!c){c=K.uid++;try{b[this.expando]={value:c},Object.defineProperties(a,b)}catch(d){b[this.expando]=c,n.extend(a,b)}}return this.cache[c]||(this.cache[c]={}),c},set:function(a,b,c){var d,e=this.key(a),f=this.cache[e];if("string"==typeof b)f[b]=c;else if(n.isEmptyObject(f))n.extend(this.cache[e],b);else for(d in b)f[d]=b[d];return f},get:function(a,b){var c=this.cache[this.key(a)];return void 0===b?c:c[b]},access:function(a,b,c){var d;return void 0===b||b&&"string"==typeof b&&void 0===c?(d=this.get(a,b),void 0!==d?d:this.get(a,n.camelCase(b))):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d,e,f=this.key(a),g=this.cache[f];if(void 0===b)this.cache[f]={};else{n.isArray(b)?d=b.concat(b.map(n.camelCase)):(e=n.camelCase(b),b in g?d=[b,e]:(d=e,d=d in g?[d]:d.match(E)||[])),c=d.length;while(c--)delete g[d[c]]}},hasData:function(a){return!n.isEmptyObject(this.cache[a[this.expando]]||{})},discard:function(a){a[this.expando]&&delete this.cache[a[this.expando]]}};var L=new K,M=new K,N=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,O=/([A-Z])/g;function P(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(O,"-$1").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:N.test(c)?n.parseJSON(c):c}catch(e){}M.set(a,b,c)}else c=void 0;return c}n.extend({hasData:function(a){return M.hasData(a)||L.hasData(a)},data:function(a,b,c){
return M.access(a,b,c)},removeData:function(a,b){M.remove(a,b)},_data:function(a,b,c){return L.access(a,b,c)},_removeData:function(a,b){L.remove(a,b)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=M.get(f),1===f.nodeType&&!L.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),P(f,d,e[d])));L.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){M.set(this,a)}):J(this,function(b){var c,d=n.camelCase(a);if(f&&void 0===b){if(c=M.get(f,a),void 0!==c)return c;if(c=M.get(f,d),void 0!==c)return c;if(c=P(f,d,void 0),void 0!==c)return c}else this.each(function(){var c=M.get(this,d);M.set(this,d,b),-1!==a.indexOf("-")&&void 0!==c&&M.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){M.remove(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=L.get(a,b),c&&(!d||n.isArray(c)?d=L.access(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return L.get(a,c)||L.access(a,c,{empty:n.Callbacks("once memory").add(function(){L.remove(a,[b+"queue",c])})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=L.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var Q=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,R=["Top","Right","Bottom","Left"],S=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)},T=/^(?:checkbox|radio)$/i;!function(){var a=l.createDocumentFragment(),b=a.appendChild(l.createElement("div")),c=l.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),k.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",k.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var U="undefined";k.focusinBubbles="onfocusin"in a;var V=/^key/,W=/^(?:mouse|pointer|contextmenu)|click/,X=/^(?:focusinfocus|focusoutblur)$/,Y=/^([^.]*)(?:\.(.+)|)$/;function Z(){return!0}function $(){return!1}function _(){try{return l.activeElement}catch(a){}}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.get(a);if(r){c.handler&&(f=c,c=f.handler,e=f.selector),c.guid||(c.guid=n.guid++),(i=r.events)||(i=r.events={}),(g=r.handle)||(g=r.handle=function(b){return typeof n!==U&&n.event.triggered!==b.type?n.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(E)||[""],j=b.length;while(j--)h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o&&(l=n.event.special[o]||{},o=(e?l.delegateType:l.bindType)||o,l=n.event.special[o]||{},k=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},f),(m=i[o])||(m=i[o]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,p,g)!==!1||a.addEventListener&&a.addEventListener(o,g,!1)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),n.event.global[o]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.hasData(a)&&L.get(a);if(r&&(i=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=i[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&q!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete i[o])}else for(o in i)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(i)&&(delete r.handle,L.remove(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,m,o,p=[d||l],q=j.call(b,"type")?b.type:b,r=j.call(b,"namespace")?b.namespace.split("."):[];if(g=h=d=d||l,3!==d.nodeType&&8!==d.nodeType&&!X.test(q+n.event.triggered)&&(q.indexOf(".")>=0&&(r=q.split("."),q=r.shift(),r.sort()),k=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=r.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:n.makeArray(c,[b]),o=n.event.special[q]||{},e||!o.trigger||o.trigger.apply(d,c)!==!1)){if(!e&&!o.noBubble&&!n.isWindow(d)){for(i=o.delegateType||q,X.test(i+q)||(g=g.parentNode);g;g=g.parentNode)p.push(g),h=g;h===(d.ownerDocument||l)&&p.push(h.defaultView||h.parentWindow||a)}f=0;while((g=p[f++])&&!b.isPropagationStopped())b.type=f>1?i:o.bindType||q,m=(L.get(g,"events")||{})[b.type]&&L.get(g,"handle"),m&&m.apply(g,c),m=k&&g[k],m&&m.apply&&n.acceptData(g)&&(b.result=m.apply(g,c),b.result===!1&&b.preventDefault());return b.type=q,e||b.isDefaultPrevented()||o._default&&o._default.apply(p.pop(),c)!==!1||!n.acceptData(d)||k&&n.isFunction(d[q])&&!n.isWindow(d)&&(h=d[k],h&&(d[k]=null),n.event.triggered=q,d[q](),n.event.triggered=void 0,h&&(d[k]=h)),b.result}},dispatch:function(a){a=n.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(L.get(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(g.namespace))&&(a.handleObj=g,a.data=g.data,e=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(a.result=e)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!==this;i=i.parentNode||this)if(i.disabled!==!0||"click"!==a.type){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>=0:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button;return null==a.pageX&&null!=b.clientX&&(c=a.target.ownerDocument||l,d=c.documentElement,e=c.body,a.pageX=b.clientX+(d&&d.scrollLeft||e&&e.scrollLeft||0)-(d&&d.clientLeft||e&&e.clientLeft||0),a.pageY=b.clientY+(d&&d.scrollTop||e&&e.scrollTop||0)-(d&&d.clientTop||e&&e.clientTop||0)),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},fix:function(a){if(a[n.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=W.test(e)?this.mouseHooks:V.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new n.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=l),3===a.target.nodeType&&(a.target=a.target.parentNode),g.filter?g.filter(a,f):a},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==_()&&this.focus?(this.focus(),!1):void 0},delegateType:"focusin"},blur:{trigger:function(){return this===_()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&n.nodeName(this,"input")?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=n.extend(new n.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?n.event.trigger(e,null,b):n.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},n.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?Z:$):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={isDefaultPrevented:$,isPropagationStopped:$,isImmediatePropagationStopped:$,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=Z,a&&a.preventDefault&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=Z,a&&a.stopPropagation&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=Z,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!n.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),k.focusinBubbles||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a),!0)};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=L.access(d,b);e||d.addEventListener(a,c,!0),L.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=L.access(d,b)-1;e?L.access(d,b,e):(d.removeEventListener(a,c,!0),L.remove(d,b))}}}),n.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(g in a)this.on(g,b,c,a[g],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=$;else if(!d)return this;return 1===e&&(f=d,d=function(a){return n().off(a),f.apply(this,arguments)},d.guid=f.guid||(f.guid=n.guid++)),this.each(function(){n.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=$),this.each(function(){n.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}});var aa=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,ba=/<([\w:]+)/,ca=/<|&#?\w+;/,da=/<(?:script|style|link)/i,ea=/checked\s*(?:[^=]|=\s*.checked.)/i,fa=/^$|\/(?:java|ecma)script/i,ga=/^true\/(.*)/,ha=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ia={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ia.optgroup=ia.option,ia.tbody=ia.tfoot=ia.colgroup=ia.caption=ia.thead,ia.th=ia.td;function ja(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function ka(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function la(a){var b=ga.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function ma(a,b){for(var c=0,d=a.length;d>c;c++)L.set(a[c],"globalEval",!b||L.get(b[c],"globalEval"))}function na(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(L.hasData(a)&&(f=L.access(a),g=L.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;d>c;c++)n.event.add(b,e,j[e][c])}M.hasData(a)&&(h=M.access(a),i=n.extend({},h),M.set(b,i))}}function oa(a,b){var c=a.getElementsByTagName?a.getElementsByTagName(b||"*"):a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&n.nodeName(a,b)?n.merge([a],c):c}function pa(a,b){var c=b.nodeName.toLowerCase();"input"===c&&T.test(a.type)?b.checked=a.checked:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}n.extend({clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=n.contains(a.ownerDocument,a);if(!(k.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(g=oa(h),f=oa(a),d=0,e=f.length;e>d;d++)pa(f[d],g[d]);if(b)if(c)for(f=f||oa(a),g=g||oa(h),d=0,e=f.length;e>d;d++)na(f[d],g[d]);else na(a,h);return g=oa(h,"script"),g.length>0&&ma(g,!i&&oa(a,"script")),h},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,k=b.createDocumentFragment(),l=[],m=0,o=a.length;o>m;m++)if(e=a[m],e||0===e)if("object"===n.type(e))n.merge(l,e.nodeType?[e]:e);else if(ca.test(e)){f=f||k.appendChild(b.createElement("div")),g=(ba.exec(e)||["",""])[1].toLowerCase(),h=ia[g]||ia._default,f.innerHTML=h[1]+e.replace(aa,"<$1></$2>")+h[2],j=h[0];while(j--)f=f.lastChild;n.merge(l,f.childNodes),f=k.firstChild,f.textContent=""}else l.push(b.createTextNode(e));k.textContent="",m=0;while(e=l[m++])if((!d||-1===n.inArray(e,d))&&(i=n.contains(e.ownerDocument,e),f=oa(k.appendChild(e),"script"),i&&ma(f),c)){j=0;while(e=f[j++])fa.test(e.type||"")&&c.push(e)}return k},cleanData:function(a){for(var b,c,d,e,f=n.event.special,g=0;void 0!==(c=a[g]);g++){if(n.acceptData(c)&&(e=c[L.expando],e&&(b=L.cache[e]))){if(b.events)for(d in b.events)f[d]?n.event.remove(c,d):n.removeEvent(c,d,b.handle);L.cache[e]&&delete L.cache[e]}delete M.cache[c[M.expando]]}}}),n.fn.extend({text:function(a){return J(this,function(a){return void 0===a?n.text(this):this.empty().each(function(){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&(this.textContent=a)})},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=ja(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=ja(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?n.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||n.cleanData(oa(c)),c.parentNode&&(b&&n.contains(c.ownerDocument,c)&&ma(oa(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(n.cleanData(oa(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return J(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!da.test(a)&&!ia[(ba.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(aa,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(oa(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,n.cleanData(oa(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,l=this.length,m=this,o=l-1,p=a[0],q=n.isFunction(p);if(q||l>1&&"string"==typeof p&&!k.checkClone&&ea.test(p))return this.each(function(c){var d=m.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(l&&(c=n.buildFragment(a,this[0].ownerDocument,!1,this),d=c.firstChild,1===c.childNodes.length&&(c=d),d)){for(f=n.map(oa(c,"script"),ka),g=f.length;l>j;j++)h=c,j!==o&&(h=n.clone(h,!0,!0),g&&n.merge(f,oa(h,"script"))),b.call(this[j],h,j);if(g)for(i=f[f.length-1].ownerDocument,n.map(f,la),j=0;g>j;j++)h=f[j],fa.test(h.type||"")&&!L.access(h,"globalEval")&&n.contains(i,h)&&(h.src?n._evalUrl&&n._evalUrl(h.src):n.globalEval(h.textContent.replace(ha,"")))}return this}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=[],e=n(a),g=e.length-1,h=0;g>=h;h++)c=h===g?this:this.clone(!0),n(e[h])[b](c),f.apply(d,c.get());return this.pushStack(d)}});var qa,ra={};function sa(b,c){var d,e=n(c.createElement(b)).appendTo(c.body),f=a.getDefaultComputedStyle&&(d=a.getDefaultComputedStyle(e[0]))?d.display:n.css(e[0],"display");return e.detach(),f}function ta(a){var b=l,c=ra[a];return c||(c=sa(a,b),"none"!==c&&c||(qa=(qa||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=qa[0].contentDocument,b.write(),b.close(),c=sa(a,b),qa.detach()),ra[a]=c),c}var ua=/^margin/,va=new RegExp("^("+Q+")(?!px)[a-z%]+$","i"),wa=function(b){return b.ownerDocument.defaultView.opener?b.ownerDocument.defaultView.getComputedStyle(b,null):a.getComputedStyle(b,null)};function xa(a,b,c){var d,e,f,g,h=a.style;return c=c||wa(a),c&&(g=c.getPropertyValue(b)||c[b]),c&&(""!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),va.test(g)&&ua.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function ya(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d=l.documentElement,e=l.createElement("div"),f=l.createElement("div");if(f.style){f.style.backgroundClip="content-box",f.cloneNode(!0).style.backgroundClip="",k.clearCloneStyle="content-box"===f.style.backgroundClip,e.style.cssText="border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;position:absolute",e.appendChild(f);function g(){f.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute",f.innerHTML="",d.appendChild(e);var g=a.getComputedStyle(f,null);b="1%"!==g.top,c="4px"===g.width,d.removeChild(e)}a.getComputedStyle&&n.extend(k,{pixelPosition:function(){return g(),b},boxSizingReliable:function(){return null==c&&g(),c},reliableMarginRight:function(){var b,c=f.appendChild(l.createElement("div"));return c.style.cssText=f.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",c.style.marginRight=c.style.width="0",f.style.width="1px",d.appendChild(e),b=!parseFloat(a.getComputedStyle(c,null).marginRight),d.removeChild(e),f.removeChild(c),b}})}}(),n.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var za=/^(none|table(?!-c[ea]).+)/,Aa=new RegExp("^("+Q+")(.*)$","i"),Ba=new RegExp("^([+-])=("+Q+")","i"),Ca={position:"absolute",visibility:"hidden",display:"block"},Da={letterSpacing:"0",fontWeight:"400"},Ea=["Webkit","O","Moz","ms"];function Fa(a,b){if(b in a)return b;var c=b[0].toUpperCase()+b.slice(1),d=b,e=Ea.length;while(e--)if(b=Ea[e]+c,b in a)return b;return d}function Ga(a,b,c){var d=Aa.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Ha(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+R[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+R[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+R[f]+"Width",!0,e))):(g+=n.css(a,"padding"+R[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+R[f]+"Width",!0,e)));return g}function Ia(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=wa(a),g="border-box"===n.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=xa(a,b,f),(0>e||null==e)&&(e=a.style[b]),va.test(e))return e;d=g&&(k.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Ha(a,b,c||(g?"border":"content"),d,f)+"px"}function Ja(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=L.get(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&S(d)&&(f[g]=L.access(d,"olddisplay",ta(d.nodeName)))):(e=S(d),"none"===c&&e||L.set(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=xa(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;return b=n.cssProps[h]||(n.cssProps[h]=Fa(i,h)),g=n.cssHooks[b]||n.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=Ba.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(n.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||n.cssNumber[h]||(c+="px"),k.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=Fa(a.style,h)),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=xa(a,b,d)),"normal"===e&&b in Da&&(e=Da[b]),""===c||c?(f=parseFloat(e),c===!0||n.isNumeric(f)?f||0:e):e}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?za.test(n.css(a,"display"))&&0===a.offsetWidth?n.swap(a,Ca,function(){return Ia(a,b,d)}):Ia(a,b,d):void 0},set:function(a,c,d){var e=d&&wa(a);return Ga(a,c,d?Ha(a,b,d,"border-box"===n.css(a,"boxSizing",!1,e),e):0)}}}),n.cssHooks.marginRight=ya(k.reliableMarginRight,function(a,b){return b?n.swap(a,{display:"inline-block"},xa,[a,"marginRight"]):void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+R[d]+b]=f[d]||f[d-2]||f[0];return e}},ua.test(a)||(n.cssHooks[a+b].set=Ga)}),n.fn.extend({css:function(a,b){return J(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=wa(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return Ja(this,!0)},hide:function(){return Ja(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){S(this)?n(this).show():n(this).hide()})}});function Ka(a,b,c,d,e){return new Ka.prototype.init(a,b,c,d,e)}n.Tween=Ka,Ka.prototype={constructor:Ka,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=Ka.propHooks[this.prop];return a&&a.get?a.get(this):Ka.propHooks._default.get(this)},run:function(a){var b,c=Ka.propHooks[this.prop];return this.options.duration?this.pos=b=n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Ka.propHooks._default.set(this),this}},Ka.prototype.init.prototype=Ka.prototype,Ka.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[n.cssProps[a.prop]]||n.cssHooks[a.prop])?n.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Ka.propHooks.scrollTop=Ka.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},n.fx=Ka.prototype.init,n.fx.step={};var La,Ma,Na=/^(?:toggle|show|hide)$/,Oa=new RegExp("^(?:([+-])=|)("+Q+")([a-z%]*)$","i"),Pa=/queueHooks$/,Qa=[Va],Ra={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=Oa.exec(b),f=e&&e[3]||(n.cssNumber[a]?"":"px"),g=(n.cssNumber[a]||"px"!==f&&+d)&&Oa.exec(n.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,n.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function Sa(){return setTimeout(function(){La=void 0}),La=n.now()}function Ta(a,b){var c,d=0,e={height:a};for(b=b?1:0;4>d;d+=2-b)c=R[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function Ua(a,b,c){for(var d,e=(Ra[b]||[]).concat(Ra["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function Va(a,b,c){var d,e,f,g,h,i,j,k,l=this,m={},o=a.style,p=a.nodeType&&S(a),q=L.get(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,l.always(function(){l.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=n.css(a,"display"),k="none"===j?L.get(a,"olddisplay")||ta(a.nodeName):j,"inline"===k&&"none"===n.css(a,"float")&&(o.display="inline-block")),c.overflow&&(o.overflow="hidden",l.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],Na.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}m[d]=q&&q[d]||n.style(a,d)}else j=void 0;if(n.isEmptyObject(m))"inline"===("none"===j?ta(a.nodeName):j)&&(o.display=j);else{q?"hidden"in q&&(p=q.hidden):q=L.access(a,"fxshow",{}),f&&(q.hidden=!p),p?n(a).show():l.done(function(){n(a).hide()}),l.done(function(){var b;L.remove(a,"fxshow");for(b in m)n.style(a,b,m[b])});for(d in m)g=Ua(p?q[d]:0,d,l),d in q||(q[d]=g.start,p&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function Wa(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function Xa(a,b,c){var d,e,f=0,g=Qa.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=La||Sa(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:La||Sa(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(Wa(k,j.opts.specialEasing);g>f;f++)if(d=Qa[f].call(j,a,k,j.opts))return d;return n.map(k,Ua,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(Xa,{tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],Ra[c]=Ra[c]||[],Ra[c].unshift(b)},prefilter:function(a,b){b?Qa.unshift(a):Qa.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(S).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=Xa(this,n.extend({},a),f);(e||L.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=L.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&Pa.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=L.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(Ta(b,!0),a,d,e)}}),n.each({slideDown:Ta("show"),slideUp:Ta("hide"),slideToggle:Ta("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=0,c=n.timers;for(La=n.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||n.fx.stop(),La=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){Ma||(Ma=setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){clearInterval(Ma),Ma=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(a,b){return a=n.fx?n.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a=l.createElement("input"),b=l.createElement("select"),c=b.appendChild(l.createElement("option"));a.type="checkbox",k.checkOn=""!==a.value,k.optSelected=c.selected,b.disabled=!0,k.optDisabled=!c.disabled,a=l.createElement("input"),a.value="t",a.type="radio",k.radioValue="t"===a.value}();var Ya,Za,$a=n.expr.attrHandle;n.fn.extend({attr:function(a,b){return J(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===U?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),d=n.attrHooks[b]||(n.expr.match.bool.test(b)?Za:Ya)),
void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=n.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void n.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)&&(a[d]=!1),a.removeAttribute(c)},attrHooks:{type:{set:function(a,b){if(!k.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),Za={set:function(a,b,c){return b===!1?n.removeAttr(a,c):a.setAttribute(c,c),c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=$a[b]||n.find.attr;$a[b]=function(a,b,d){var e,f;return d||(f=$a[b],$a[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,$a[b]=f),e}});var _a=/^(?:input|select|textarea|button)$/i;n.fn.extend({prop:function(a,b){return J(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[n.propFix[a]||a]})}}),n.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!n.isXMLDoc(a),f&&(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){return a.hasAttribute("tabindex")||_a.test(a.nodeName)||a.href?a.tabIndex:-1}}}}),k.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this});var ab=/[\t\r\n\f]/g;n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h="string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ab," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=n.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0===arguments.length||"string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ab," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?n.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(n.isFunction(a)?function(c){n(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=n(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===U||"boolean"===c)&&(this.className&&L.set(this,"__className__",this.className),this.className=this.className||a===!1?"":L.get(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(ab," ").indexOf(b)>=0)return!0;return!1}});var bb=/\r/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(bb,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.trim(n.text(a))}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(k.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=n.inArray(d.value,f)>=0)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>=0:void 0}},k.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var cb=n.now(),db=/\?/;n.parseJSON=function(a){return JSON.parse(a+"")},n.parseXML=function(a){var b,c;if(!a||"string"!=typeof a)return null;try{c=new DOMParser,b=c.parseFromString(a,"text/xml")}catch(d){b=void 0}return(!b||b.getElementsByTagName("parsererror").length)&&n.error("Invalid XML: "+a),b};var eb=/#.*$/,fb=/([?&])_=[^&]*/,gb=/^(.*?):[ \t]*([^\r\n]*)$/gm,hb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,ib=/^(?:GET|HEAD)$/,jb=/^\/\//,kb=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,lb={},mb={},nb="*/".concat("*"),ob=a.location.href,pb=kb.exec(ob.toLowerCase())||[];function qb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(n.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function rb(a,b,c,d){var e={},f=a===mb;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function sb(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&n.extend(!0,a,d),a}function tb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function ub(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:ob,type:"GET",isLocal:hb.test(pb[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":nb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?sb(sb(a,n.ajaxSettings),b):sb(n.ajaxSettings,a)},ajaxPrefilter:qb(lb),ajaxTransport:qb(mb),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=n.ajaxSetup({},b),l=k.context||k,m=k.context&&(l.nodeType||l.jquery)?n(l):n.event,o=n.Deferred(),p=n.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!f){f={};while(b=gb.exec(e))f[b[1].toLowerCase()]=b[2]}b=f[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?e:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return c&&c.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||ob)+"").replace(eb,"").replace(jb,pb[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=n.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(h=kb.exec(k.url.toLowerCase()),k.crossDomain=!(!h||h[1]===pb[1]&&h[2]===pb[2]&&(h[3]||("http:"===h[1]?"80":"443"))===(pb[3]||("http:"===pb[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=n.param(k.data,k.traditional)),rb(lb,k,b,v),2===t)return v;i=n.event&&k.global,i&&0===n.active++&&n.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!ib.test(k.type),d=k.url,k.hasContent||(k.data&&(d=k.url+=(db.test(d)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=fb.test(d)?d.replace(fb,"$1_="+cb++):d+(db.test(d)?"&":"?")+"_="+cb++)),k.ifModified&&(n.lastModified[d]&&v.setRequestHeader("If-Modified-Since",n.lastModified[d]),n.etag[d]&&v.setRequestHeader("If-None-Match",n.etag[d])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+nb+"; q=0.01":""):k.accepts["*"]);for(j in k.headers)v.setRequestHeader(j,k.headers[j]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(j in{success:1,error:1,complete:1})v[j](k[j]);if(c=rb(mb,k,b,v)){v.readyState=1,i&&m.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,c.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,f,h){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),c=void 0,e=h||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,f&&(u=tb(k,v,f)),u=ub(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(n.lastModified[d]=w),w=v.getResponseHeader("etag"),w&&(n.etag[d]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,i&&m.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),i&&(m.trigger("ajaxComplete",[v,k]),--n.active||n.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){var b;return n.isFunction(a)?this.each(function(b){n(this).wrapAll(a.call(this,b))}):(this[0]&&(b=n(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this)},wrapInner:function(a){return this.each(n.isFunction(a)?function(b){n(this).wrapInner(a.call(this,b))}:function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}}),n.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0},n.expr.filters.visible=function(a){return!n.expr.filters.hidden(a)};var vb=/%20/g,wb=/\[\]$/,xb=/\r?\n/g,yb=/^(?:submit|button|image|reset|file)$/i,zb=/^(?:input|select|textarea|keygen)/i;function Ab(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||wb.test(a)?d(a,e):Ab(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)Ab(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)Ab(c,a[c],b,e);return d.join("&").replace(vb,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&zb.test(this.nodeName)&&!yb.test(a)&&(this.checked||!T.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(xb,"\r\n")}}):{name:b.name,value:c.replace(xb,"\r\n")}}).get()}}),n.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(a){}};var Bb=0,Cb={},Db={0:200,1223:204},Eb=n.ajaxSettings.xhr();a.attachEvent&&a.attachEvent("onunload",function(){for(var a in Cb)Cb[a]()}),k.cors=!!Eb&&"withCredentials"in Eb,k.ajax=Eb=!!Eb,n.ajaxTransport(function(a){var b;return k.cors||Eb&&!a.crossDomain?{send:function(c,d){var e,f=a.xhr(),g=++Bb;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)f.setRequestHeader(e,c[e]);b=function(a){return function(){b&&(delete Cb[g],b=f.onload=f.onerror=null,"abort"===a?f.abort():"error"===a?d(f.status,f.statusText):d(Db[f.status]||f.status,f.statusText,"string"==typeof f.responseText?{text:f.responseText}:void 0,f.getAllResponseHeaders()))}},f.onload=b(),f.onerror=b("error"),b=Cb[g]=b("abort");try{f.send(a.hasContent&&a.data||null)}catch(h){if(b)throw h}},abort:function(){b&&b()}}:void 0}),n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(d,e){b=n("<script>").prop({async:!0,charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&e("error"===a.type?404:200,a.type)}),l.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Fb=[],Gb=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Fb.pop()||n.expando+"_"+cb++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Gb.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Gb.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Gb,"$1"+e):b.jsonp!==!1&&(b.url+=(db.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Fb.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||l;var d=v.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=n.buildFragment([a],b,e),e&&e.length&&n(e).remove(),n.merge([],d.childNodes))};var Hb=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&Hb)return Hb.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=n.trim(a.slice(h)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e,dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,f||[a.responseText,b,a])}),this},n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};var Ib=a.document.documentElement;function Jb(a){return n.isWindow(a)?a:9===a.nodeType&&a.defaultView}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d=this[0],e={top:0,left:0},f=d&&d.ownerDocument;if(f)return b=f.documentElement,n.contains(b,d)?(typeof d.getBoundingClientRect!==U&&(e=d.getBoundingClientRect()),c=Jb(f),{top:e.top+c.pageYOffset-b.clientTop,left:e.left+c.pageXOffset-b.clientLeft}):e},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===n.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(d=a.offset()),d.top+=n.css(a[0],"borderTopWidth",!0),d.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-d.top-n.css(c,"marginTop",!0),left:b.left-d.left-n.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||Ib;while(a&&!n.nodeName(a,"html")&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Ib})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(b,c){var d="pageYOffset"===c;n.fn[b]=function(e){return J(this,function(b,e,f){var g=Jb(b);return void 0===f?g?g[c]:b[e]:void(g?g.scrollTo(d?a.pageXOffset:f,d?f:a.pageYOffset):b[e]=f)},b,e,arguments.length,null)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=ya(k.pixelPosition,function(a,c){return c?(c=xa(a,b),va.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return J(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.size=function(){return this.length},n.fn.andSelf=n.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return n});var Kb=a.jQuery,Lb=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=Lb),b&&a.jQuery===n&&(a.jQuery=Kb),n},typeof b===U&&(a.jQuery=a.$=n),n});
//# sourceMappingURL=jquery.min.map

/* ----------------------
	root
----------------------- */

new CircularModule({
	name:	'root'
});

/* ----------------------
	log
----------------------- */

new CircularModule({

	name	: 'log',
	
	in		: function(attr,node,props) {
		this.write(attr.value);
	},
	
	write		: function() {
		console.log.apply(console,arguments);
	},
	info	: function() {
		console.info.apply(console,arguments);
	},
	warn	: function() {
		console.warn.apply(console,arguments);
	},
	error	: function() {
		console.error.apply(console,arguments);
	},
	fatal:	function() {
		this.error(arguments);
		Circular.die();
	}
});
/* ----------------------
	debug
----------------------- */

new CircularModule({

	name			: 'debug',
	enabled		: false,
	requires	: ['log'],
	config		: {
		debugging	: false,
	},
	
	in	: function(attr,node,props) {
		this.write('mod.debug',node);
		attr.outer = this.enabled;
		if (!attr.original || attr.result) {
			this.on();
		} else {
			this.off();
		}
	},
	
	out	: function(attr,node,props) {
		if (!attr.outer) this.write('mod.debug - off');
		this.enabled=attr.outer;
		if (attr.outer) this.write('mod.debug - on');
	},
	
	toggle: function(on) 	{ 
		if (!on) this.write('mod.debug - off');
		this.enabled=on; 
		if (on) this.write('mod.debug - on');
	},
	on		: function() 		{ this.toggle(true); },
	off		: function() 		{ this.toggle(false); },
	
	write	: function() {
		if (this.enabled) Circular.log.write(arguments);
	}
	
	
});
/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PlaceHolders,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        hasLineTerminator,
        lastIndex,
        lastLineNumber,
        lastLineStart,
        startIndex,
        startLineNumber,
        startLineStart,
        scanning,
        length,
        lookahead,
        state,
        extra,
        isBindingElement,
        isAssignmentTarget,
        firstCoverInitializedNameError;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9,
        Template: 10
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    TokenName[Token.Template] = 'Template';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForOfStatement: 'ForOfStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    PlaceHolders = {
        ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken: 'Unexpected token %0',
        UnexpectedNumber: 'Unexpected number',
        UnexpectedString: 'Unexpected string',
        UnexpectedIdentifier: 'Unexpected identifier',
        UnexpectedReserved: 'Unexpected reserved word',
        UnexpectedTemplate: 'Unexpected quasi %0',
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
        InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally: 'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith: 'Strict mode code may not include a with statement',
        StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
        StrictVarName: 'Variable name may not be eval or arguments in strict mode',
        StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
        StrictDelete: 'Delete of an unqualified identifier in strict mode.',
        StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord: 'Use of future reserved word in strict mode',
        TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
        ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
        DefaultRestParameter: 'Unexpected token =',
        ObjectPatternAsRestParameter: 'Unexpected token {',
        DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
        ConstructorSpecialMethod: 'Class constructor may not be an accessor',
        DuplicateConstructor: 'A class may only have one constructor',
        StaticPrototype: 'Classes may not have static property named prototype',
        MissingFromClause: 'Unexpected token',
        NoAsAfterImportNamespace: 'Unexpected token',
        InvalidModuleSpecifier: 'Unexpected token',
        IllegalImportDeclaration: 'Unexpected token',
        IllegalExportDeclaration: 'Unexpected token',
        DuplicateBinding: 'Duplicate binding %0'
    };

    // See also tools/generate-unicode-regex.js.
    Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,

        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 0x30 && ch <= 0x39);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }

    function octalToDecimal(ch) {
        // \0 is not octal escape sequence
        var octal = (ch !== '0'), code = '01234567'.indexOf(ch);

        if (index < length && isOctalDigit(source[index])) {
            octal = true;
            code = code * 8 + '01234567'.indexOf(source[index++]);

            // 3 digits are only allowed when string starts
            // with 0, 1, 2, 3
            if ('0123'.indexOf(ch) >= 0 &&
                    index < length &&
                    isOctalDigit(source[index])) {
                code = code * 8 + '01234567'.indexOf(source[index++]);
            }
        }

        return {
            code: code,
            octal: octal
        };
    }

    // ECMA-262 11.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // ECMA-262 11.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // ECMA-262 11.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        return (cp < 0x10000) ? String.fromCharCode(cp) :
            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
            String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
    }

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch)));
    }

    // ECMA-262 11.6.2.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'enum':
        case 'export':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // ECMA-262 11.6.2.1 Keywords

    function isKeyword(id) {

        // 'const' is specialized as Keyword in V8.
        // 'yield' and 'let' are for compatibility with SpiderMonkey and ES.next.
        // Some others are from future reserved words.

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // ECMA-262 11.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                hasLineTerminator = true;
                ++lineNumber;
                ++index;
                lineStart = index;
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        // Ran off the end of the file - the whole thing is a comment
        if (extra.comments) {
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            comment = source.slice(start + 2, index);
            addComment('Block', comment, start, index, loc);
        }
        tolerateUnexpectedToken();
    }

    function skipComment() {
        var ch, start;
        hasLineTerminator = false;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwUnexpectedToken();
        }

        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwUnexpectedToken();
        }

        return fromCodePoint(code);
    }

    function codePointAt(i) {
        var cp, first, second;

        cp = source.charCodeAt(i);
        if (cp >= 0xD800 && cp <= 0xDBFF) {
            second = source.charCodeAt(i + 1);
            if (second >= 0xDC00 && second <= 0xDFFF) {
                first = cp;
                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            }
        }

        return cp;
    }

    function getComplexIdentifier() {
        var cp, ch, id;

        cp = codePointAt(index);
        id = fromCodePoint(cp);
        index += id.length;

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (cp === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            if (source[index] === '{') {
                ++index;
                ch = scanUnicodeCodePointEscape();
            } else {
                ch = scanHexEscape('u');
                cp = ch.charCodeAt(0);
                if (!ch || ch === '\\' || !isIdentifierStart(cp)) {
                    throwUnexpectedToken();
                }
            }
            id = ch;
        }

        while (index < length) {
            cp = codePointAt(index);
            if (!isIdentifierPart(cp)) {
                break;
            }
            ch = fromCodePoint(cp);
            id += ch;
            index += ch.length;

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (cp === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                if (source[index] === '{') {
                    ++index;
                    ch = scanUnicodeCodePointEscape();
                } else {
                    ch = scanHexEscape('u');
                    cp = ch.charCodeAt(0);
                    if (!ch || ch === '\\' || !isIdentifierPart(cp)) {
                        throwUnexpectedToken();
                    }
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getComplexIdentifier();
            } else if (ch >= 0xD800 && ch < 0xDFFF) {
                // Need to handle surrogate pairs.
                index = start;
                return getComplexIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getComplexIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // ECMA-262 11.7 Punctuators

    function scanPunctuator() {
        var token, str;

        token = {
            type: Token.Punctuator,
            value: '',
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: index,
            end: index
        };

        // Check for most common single-character punctuators.
        str = source[index];
        switch (str) {

        case '(':
            if (extra.tokenize) {
                extra.openParenToken = extra.tokens.length;
            }
            ++index;
            break;

        case '{':
            if (extra.tokenize) {
                extra.openCurlyToken = extra.tokens.length;
            }
            state.curlyStack.push('{');
            ++index;
            break;

        case '.':
            ++index;
            if (source[index] === '.' && source[index + 1] === '.') {
                // Spread operator: ...
                index += 2;
                str = '...';
            }
            break;

        case '}':
            ++index;
            state.curlyStack.pop();
            break;
        case ')':
        case ';':
        case ',':
        case '[':
        case ']':
        case ':':
        case '?':
        case '~':
            ++index;
            break;

        default:
            // 4-character punctuator.
            str = source.substr(index, 4);
            if (str === '>>>=') {
                index += 4;
            } else {

                // 3-character punctuators.
                str = str.substr(0, 3);
                if (str === '===' || str === '!==' || str === '>>>' ||
                    str === '<<=' || str === '>>=') {
                    index += 3;
                } else {

                    // 2-character punctuators.
                    str = str.substr(0, 2);
                    if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
                        str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
                        str === '++' || str === '--' || str === '<<' || str === '>>' ||
                        str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
                        str === '<=' || str === '>=' || str === '=>') {
                        index += 2;
                    } else {

                        // 1-character punctuators.
                        str = source[index];
                        if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
                            ++index;
                        }
                    }
                }
            }
        }

        if (index === token.start) {
            throwUnexpectedToken();
        }

        token.end = index;
        token.value = str;
        return token;
    }

    // ECMA-262 11.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanBinaryLiteral(start) {
        var ch, number;

        number = '';

        while (index < length) {
            ch = source[index];
            if (ch !== '0' && ch !== '1') {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            // only 0b or 0B
            throwUnexpectedToken();
        }

        if (index < length) {
            ch = source.charCodeAt(index);
            /* istanbul ignore else */
            if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                throwUnexpectedToken();
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 2),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(prefix, start) {
        var number, octal;

        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        } else {
            octal = false;
            ++index;
            number = '';
        }

        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function isImplicitOctalLiteral() {
        var i, ch;

        // Implicit octal, unless there is a non-octal digit.
        // (Annex B.1.1 on Numeric Literals)
        for (i = index + 1; i < length; ++i) {
            ch = source[i];
            if (ch === '8' || ch === '9') {
                return false;
            }
            if (!isOctalDigit(ch)) {
                return true;
            }
        }

        return true;
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    return scanBinaryLiteral(start);
                }
                if (ch === 'o' || ch === 'O') {
                    return scanOctalLiteral(ch, start);
                }

                if (isOctalDigit(ch)) {
                    if (isImplicitOctalLiteral()) {
                        return scanOctalLiteral(ch, start);
                    }
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwUnexpectedToken();
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, unescaped, octToDec, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            unescaped = scanHexEscape(ch);
                            if (!unescaped) {
                                throw throwUnexpectedToken();
                            }
                            str += unescaped;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;
                    case '8':
                    case '9':
                        str += ch;
                        tolerateUnexpectedToken();
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            octToDec = octalToDecimal(ch);

                            octal = octToDec.octal || octal;
                            str += String.fromCharCode(octToDec.code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwUnexpectedToken();
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: startLineNumber,
            lineStart: startLineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.6 Template Literal Lexical Components

    function scanTemplate() {
        var cooked = '', ch, start, rawOffset, terminated, head, tail, restore, unescaped;

        terminated = false;
        tail = false;
        start = index;
        head = (source[index] === '`');
        rawOffset = 2;

        ++index;

        while (index < length) {
            ch = source[index++];
            if (ch === '`') {
                rawOffset = 1;
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    state.curlyStack.push('${');
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (ch === '0') {
                            if (isDecimalDigit(source.charCodeAt(index))) {
                                // Illegal: \01 \02 and so on
                                throwError(Messages.TemplateOctalLiteral);
                            }
                            cooked += '\0';
                        } else if (isOctalDigit(ch)) {
                            // Illegal: \1 \2
                            throwError(Messages.TemplateOctalLiteral);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch === '\r' && source[index] === '\n') {
                    ++index;
                }
                lineStart = index;
                cooked += '\n';
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwUnexpectedToken();
        }

        if (!head) {
            state.curlyStack.pop();
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - rawOffset)
            },
            head: head,
            tail: tail,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.5 Regular Expression Literals

    function testRegExp(pattern, flags) {
        // The BMP character to use as a replacement for astral symbols when
        // translating an ES6 "u"-flagged pattern to an ES5-compatible
        // approximation.
        // Note: replacing with '\uFFFF' enables false positives in unlikely
        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
        // pattern that would not be detected by this substitution.
        var astralSubstitute = '\uFFFF',
            tmp = pattern;

        if (flags.indexOf('u') >= 0) {
            tmp = tmp
                // Replace every Unicode escape sequence with the equivalent
                // BMP character or a constant ASCII code point in the case of
                // astral symbols. (See the above note on `astralSubstitute`
                // for more information.)
                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
                    var codePoint = parseInt($1 || $2, 16);
                    if (codePoint > 0x10FFFF) {
                        throwUnexpectedToken(null, Messages.InvalidRegExp);
                    }
                    if (codePoint <= 0xFFFF) {
                        return String.fromCharCode(codePoint);
                    }
                    return astralSubstitute;
                })
                // Replace each paired surrogate with a single ASCII symbol to
                // avoid throwing on regular expressions that are only valid in
                // combination with the "u" flag.
                .replace(
                    /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
                    astralSubstitute
                );
        }

        // First, detect invalid regular expressions.
        try {
            RegExp(tmp);
        } catch (e) {
            throwUnexpectedToken(null, Messages.InvalidRegExp);
        }

        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            return new RegExp(pattern, flags);
        } catch (exception) {
            return null;
        }
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwUnexpectedToken(null, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwUnexpectedToken(null, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwUnexpectedToken(null, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    tolerateUnexpectedToken();
                } else {
                    str += '\\';
                    tolerateUnexpectedToken();
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, value;
        scanning = true;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);
        scanning = false;
        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: body.value,
                    flags: flags.value
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();

        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advanceSlash() {
        var prevToken,
            checkToken;
        // Using the following algorithm:
        // https://github.com/mozilla/sweet.js/wiki/design
        prevToken = extra.tokens[extra.tokens.length - 1];
        if (!prevToken) {
            // Nothing before that: it cannot be a division.
            return collectRegex();
        }
        if (prevToken.type === 'Punctuator') {
            if (prevToken.value === ']') {
                return scanPunctuator();
            }
            if (prevToken.value === ')') {
                checkToken = extra.tokens[extra.openParenToken - 1];
                if (checkToken &&
                        checkToken.type === 'Keyword' &&
                        (checkToken.value === 'if' ||
                         checkToken.value === 'while' ||
                         checkToken.value === 'for' ||
                         checkToken.value === 'with')) {
                    return collectRegex();
                }
                return scanPunctuator();
            }
            if (prevToken.value === '}') {
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                if (extra.tokens[extra.openCurlyToken - 3] &&
                        extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                    // Anonymous function.
                    checkToken = extra.tokens[extra.openCurlyToken - 4];
                    if (!checkToken) {
                        return scanPunctuator();
                    }
                } else if (extra.tokens[extra.openCurlyToken - 4] &&
                        extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                    // Named function.
                    checkToken = extra.tokens[extra.openCurlyToken - 5];
                    if (!checkToken) {
                        return collectRegex();
                    }
                } else {
                    return scanPunctuator();
                }
                // checkToken determines whether the function is
                // a declaration or an expression.
                if (FnExprTokens.indexOf(checkToken.value) >= 0) {
                    // It is an expression.
                    return scanPunctuator();
                }
                // It is a declaration.
                return collectRegex();
            }
            return collectRegex();
        }
        if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
            return collectRegex();
        }
        return scanPunctuator();
    }

    function advance() {
        var cp, token;

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        cp = source.charCodeAt(index);

        if (isIdentifierStart(cp)) {
            token = scanIdentifier();
            if (strict && isStrictModeReservedWord(token.value)) {
                token.type = Token.Keyword;
            }
            return token;
        }

        // Very common: ( and ) and ;
        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (cp === 0x27 || cp === 0x22) {
            return scanStringLiteral();
        }

        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (cp === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(cp)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && cp === 0x2F) {
            return advanceSlash();
        }

        // Template literals start with ` (U+0060) for template head
        // or } (U+007D) for template middle or template tail.
        if (cp === 0x60 || (cp === 0x7D && state.curlyStack[state.curlyStack.length - 1] === '${')) {
            return scanTemplate();
        }

        // Possible identifier start in a surrogate pair.
        if (cp >= 0xD800 && cp < 0xDFFF) {
            cp = codePointAt(index);
            if (isIdentifierStart(cp)) {
                return scanIdentifier();
            }
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, value, entry;

        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            extra.tokens.push(entry);
        }

        return token;
    }

    function lex() {
        var token;
        scanning = true;

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        skipComment();

        token = lookahead;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
        return token;
    }

    function peek() {
        scanning = true;

        skipComment();

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
    }

    function Position() {
        this.line = startLineNumber;
        this.column = startIndex - startLineStart;
    }

    function SourceLocation() {
        this.start = new Position();
        this.end = null;
    }

    function WrappingSourceLocation(startToken) {
        this.start = {
            line: startToken.lineNumber,
            column: startToken.start - startToken.lineStart
        };
        this.end = null;
    }

    function Node() {
        if (extra.range) {
            this.range = [startIndex, 0];
        }
        if (extra.loc) {
            this.loc = new SourceLocation();
        }
    }

    function WrappingNode(startToken) {
        if (extra.range) {
            this.range = [startToken.start, 0];
        }
        if (extra.loc) {
            this.loc = new WrappingSourceLocation(startToken);
        }
    }

    WrappingNode.prototype = Node.prototype = {

        processComment: function () {
            var lastChild,
                leadingComments,
                trailingComments,
                bottomRight = extra.bottomRightStack,
                i,
                comment,
                last = bottomRight[bottomRight.length - 1];

            if (this.type === Syntax.Program) {
                if (this.body.length > 0) {
                    return;
                }
            }

            if (extra.trailingComments.length > 0) {
                trailingComments = [];
                for (i = extra.trailingComments.length - 1; i >= 0; --i) {
                    comment = extra.trailingComments[i];
                    if (comment.range[0] >= this.range[1]) {
                        trailingComments.unshift(comment);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                extra.trailingComments = [];
            } else {
                if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                    trailingComments = last.trailingComments;
                    delete last.trailingComments;
                }
            }

            // Eating the stack.
            while (last && last.range[0] >= this.range[0]) {
                lastChild = bottomRight.pop();
                last = bottomRight[bottomRight.length - 1];
            }

            if (lastChild) {
                if (lastChild.leadingComments) {
                    leadingComments = [];
                    for (i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                        comment = lastChild.leadingComments[i];
                        if (comment.range[1] <= this.range[0]) {
                            leadingComments.unshift(comment);
                            lastChild.leadingComments.splice(i, 1);
                        }
                    }

                    if (!lastChild.leadingComments.length) {
                        lastChild.leadingComments = undefined;
                    }
                }
            } else if (extra.leadingComments.length > 0) {
                leadingComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                    }
                }
            }


            if (leadingComments && leadingComments.length > 0) {
                this.leadingComments = leadingComments;
            }
            if (trailingComments && trailingComments.length > 0) {
                this.trailingComments = trailingComments;
            }

            bottomRight.push(this);
        },

        finish: function () {
            if (extra.range) {
                this.range[1] = lastIndex;
            }
            if (extra.loc) {
                this.loc.end = {
                    line: lastLineNumber,
                    column: lastIndex - lastLineStart
                };
                if (extra.source) {
                    this.loc.source = extra.source;
                }
            }

            if (extra.attachComment) {
                this.processComment();
            }
        },

        finishArrayExpression: function (elements) {
            this.type = Syntax.ArrayExpression;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrayPattern: function (elements) {
            this.type = Syntax.ArrayPattern;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrowFunctionExpression: function (params, defaults, body, expression) {
            this.type = Syntax.ArrowFunctionExpression;
            this.id = null;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishAssignmentExpression: function (operator, left, right) {
            this.type = Syntax.AssignmentExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishAssignmentPattern: function (left, right) {
            this.type = Syntax.AssignmentPattern;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBinaryExpression: function (operator, left, right) {
            this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBlockStatement: function (body) {
            this.type = Syntax.BlockStatement;
            this.body = body;
            this.finish();
            return this;
        },

        finishBreakStatement: function (label) {
            this.type = Syntax.BreakStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishCallExpression: function (callee, args) {
            this.type = Syntax.CallExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishCatchClause: function (param, body) {
            this.type = Syntax.CatchClause;
            this.param = param;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassBody: function (body) {
            this.type = Syntax.ClassBody;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassDeclaration: function (id, superClass, body) {
            this.type = Syntax.ClassDeclaration;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassExpression: function (id, superClass, body) {
            this.type = Syntax.ClassExpression;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishConditionalExpression: function (test, consequent, alternate) {
            this.type = Syntax.ConditionalExpression;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishContinueStatement: function (label) {
            this.type = Syntax.ContinueStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishDebuggerStatement: function () {
            this.type = Syntax.DebuggerStatement;
            this.finish();
            return this;
        },

        finishDoWhileStatement: function (body, test) {
            this.type = Syntax.DoWhileStatement;
            this.body = body;
            this.test = test;
            this.finish();
            return this;
        },

        finishEmptyStatement: function () {
            this.type = Syntax.EmptyStatement;
            this.finish();
            return this;
        },

        finishExpressionStatement: function (expression) {
            this.type = Syntax.ExpressionStatement;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishForStatement: function (init, test, update, body) {
            this.type = Syntax.ForStatement;
            this.init = init;
            this.test = test;
            this.update = update;
            this.body = body;
            this.finish();
            return this;
        },

        finishForOfStatement: function (left, right, body) {
            this.type = Syntax.ForOfStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.finish();
            return this;
        },

        finishForInStatement: function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        },

        finishFunctionDeclaration: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishFunctionExpression: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishIdentifier: function (name) {
            this.type = Syntax.Identifier;
            this.name = name;
            this.finish();
            return this;
        },

        finishIfStatement: function (test, consequent, alternate) {
            this.type = Syntax.IfStatement;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishLabeledStatement: function (label, body) {
            this.type = Syntax.LabeledStatement;
            this.label = label;
            this.body = body;
            this.finish();
            return this;
        },

        finishLiteral: function (token) {
            this.type = Syntax.Literal;
            this.value = token.value;
            this.raw = source.slice(token.start, token.end);
            if (token.regex) {
                this.regex = token.regex;
            }
            this.finish();
            return this;
        },

        finishMemberExpression: function (accessor, object, property) {
            this.type = Syntax.MemberExpression;
            this.computed = accessor === '[';
            this.object = object;
            this.property = property;
            this.finish();
            return this;
        },

        finishMetaProperty: function (meta, property) {
            this.type = Syntax.MetaProperty;
            this.meta = meta;
            this.property = property;
            this.finish();
            return this;
        },

        finishNewExpression: function (callee, args) {
            this.type = Syntax.NewExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishObjectExpression: function (properties) {
            this.type = Syntax.ObjectExpression;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishObjectPattern: function (properties) {
            this.type = Syntax.ObjectPattern;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishPostfixExpression: function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        },

        finishProgram: function (body, sourceType) {
            this.type = Syntax.Program;
            this.body = body;
            this.sourceType = sourceType;
            this.finish();
            return this;
        },

        finishProperty: function (kind, key, computed, value, method, shorthand) {
            this.type = Syntax.Property;
            this.key = key;
            this.computed = computed;
            this.value = value;
            this.kind = kind;
            this.method = method;
            this.shorthand = shorthand;
            this.finish();
            return this;
        },

        finishRestElement: function (argument) {
            this.type = Syntax.RestElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishReturnStatement: function (argument) {
            this.type = Syntax.ReturnStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSequenceExpression: function (expressions) {
            this.type = Syntax.SequenceExpression;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishSpreadElement: function (argument) {
            this.type = Syntax.SpreadElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSwitchCase: function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
            this.finish();
            return this;
        },

        finishSuper: function () {
            this.type = Syntax.Super;
            this.finish();
            return this;
        },

        finishSwitchStatement: function (discriminant, cases) {
            this.type = Syntax.SwitchStatement;
            this.discriminant = discriminant;
            this.cases = cases;
            this.finish();
            return this;
        },

        finishTaggedTemplateExpression: function (tag, quasi) {
            this.type = Syntax.TaggedTemplateExpression;
            this.tag = tag;
            this.quasi = quasi;
            this.finish();
            return this;
        },

        finishTemplateElement: function (value, tail) {
            this.type = Syntax.TemplateElement;
            this.value = value;
            this.tail = tail;
            this.finish();
            return this;
        },

        finishTemplateLiteral: function (quasis, expressions) {
            this.type = Syntax.TemplateLiteral;
            this.quasis = quasis;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishThisExpression: function () {
            this.type = Syntax.ThisExpression;
            this.finish();
            return this;
        },

        finishThrowStatement: function (argument) {
            this.type = Syntax.ThrowStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishTryStatement: function (block, handler, finalizer) {
            this.type = Syntax.TryStatement;
            this.block = block;
            this.guardedHandlers = [];
            this.handlers = handler ? [handler] : [];
            this.handler = handler;
            this.finalizer = finalizer;
            this.finish();
            return this;
        },

        finishUnaryExpression: function (operator, argument) {
            this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = true;
            this.finish();
            return this;
        },

        finishVariableDeclaration: function (declarations) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = 'var';
            this.finish();
            return this;
        },

        finishLexicalDeclaration: function (declarations, kind) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = kind;
            this.finish();
            return this;
        },

        finishVariableDeclarator: function (id, init) {
            this.type = Syntax.VariableDeclarator;
            this.id = id;
            this.init = init;
            this.finish();
            return this;
        },

        finishWhileStatement: function (test, body) {
            this.type = Syntax.WhileStatement;
            this.test = test;
            this.body = body;
            this.finish();
            return this;
        },

        finishWithStatement: function (object, body) {
            this.type = Syntax.WithStatement;
            this.object = object;
            this.body = body;
            this.finish();
            return this;
        },

        finishExportSpecifier: function (local, exported) {
            this.type = Syntax.ExportSpecifier;
            this.exported = exported || local;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportDefaultSpecifier: function (local) {
            this.type = Syntax.ImportDefaultSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportNamespaceSpecifier: function (local) {
            this.type = Syntax.ImportNamespaceSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishExportNamedDeclaration: function (declaration, specifiers, src) {
            this.type = Syntax.ExportNamedDeclaration;
            this.declaration = declaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishExportDefaultDeclaration: function (declaration) {
            this.type = Syntax.ExportDefaultDeclaration;
            this.declaration = declaration;
            this.finish();
            return this;
        },

        finishExportAllDeclaration: function (src) {
            this.type = Syntax.ExportAllDeclaration;
            this.source = src;
            this.finish();
            return this;
        },

        finishImportSpecifier: function (local, imported) {
            this.type = Syntax.ImportSpecifier;
            this.local = local || imported;
            this.imported = imported;
            this.finish();
            return this;
        },

        finishImportDeclaration: function (specifiers, src) {
            this.type = Syntax.ImportDeclaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishYieldExpression: function (argument, delegate) {
            this.type = Syntax.YieldExpression;
            this.argument = argument;
            this.delegate = delegate;
            this.finish();
            return this;
        }
    };


    function recordError(error) {
        var e, existing;

        for (e = 0; e < extra.errors.length; e++) {
            existing = extra.errors[e];
            // Prevent duplicated error.
            /* istanbul ignore next */
            if (existing.index === error.index && existing.message === error.message) {
                return;
            }
        }

        extra.errors.push(error);
    }

    function constructError(msg, column) {
        var error = new Error(msg);
        try {
            throw error;
        } catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        } finally {
            return error;
        }
    }

    function createError(line, pos, description) {
        var msg, column, error;

        msg = 'Line ' + line + ': ' + description;
        column = pos - (scanning ? lineStart : lastLineStart) + 1;
        error = constructError(msg, column);
        error.lineNumber = line;
        error.description = description;
        error.index = pos;
        return error;
    }

    // Throw an exception

    function throwError(messageFormat) {
        var args, msg;

        args = Array.prototype.slice.call(arguments, 1);
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        throw createError(lastLineNumber, lastIndex, msg);
    }

    function tolerateError(messageFormat) {
        var args, msg, error;

        args = Array.prototype.slice.call(arguments, 1);
        /* istanbul ignore next */
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        error = createError(lineNumber, lastIndex, msg);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Throw an exception because of the token.

    function unexpectedTokenError(token, message) {
        var value, msg = message || Messages.UnexpectedToken;

        if (token) {
            if (!message) {
                msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                    (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                    (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                    (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                    (token.type === Token.Template) ? Messages.UnexpectedTemplate :
                    Messages.UnexpectedToken;

                if (token.type === Token.Keyword) {
                    if (isFutureReservedWord(token.value)) {
                        msg = Messages.UnexpectedReserved;
                    } else if (strict && isStrictModeReservedWord(token.value)) {
                        msg = Messages.StrictReservedWord;
                    }
                }
            }

            value = (token.type === Token.Template) ? token.value.raw : token.value;
        } else {
            value = 'ILLEGAL';
        }

        msg = msg.replace('%0', value);

        return (token && typeof token.lineNumber === 'number') ?
            createError(token.lineNumber, token.start, msg) :
            createError(scanning ? lineNumber : lastLineNumber, scanning ? index : lastIndex, msg);
    }

    function throwUnexpectedToken(token, message) {
        throw unexpectedTokenError(token, message);
    }

    function tolerateUnexpectedToken(token, message) {
        var error = unexpectedTokenError(token, message);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpectedToken(token);
        }
    }

    /**
     * @name expectCommaSeparator
     * @description Quietly expect a comma when in tolerant mode, otherwise delegates
     * to <code>expect(value)</code>
     * @since 2.0
     */
    function expectCommaSeparator() {
        var token;

        if (extra.errors) {
            token = lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                lex();
            } else if (token.type === Token.Punctuator && token.value === ';') {
                lex();
                tolerateUnexpectedToken(token);
            } else {
                tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        } else {
            expect(',');
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpectedToken(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword
    // (where an identifier is sometimes a keyword depending on the context)

    function matchContextualKeyword(keyword) {
        return lookahead.type === Token.Identifier && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(startIndex) === 0x3B || match(';')) {
            lex();
            return;
        }

        if (hasLineTerminator) {
            return;
        }

        // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
        lastIndex = startIndex;
        lastLineNumber = startLineNumber;
        lastLineStart = startLineStart;

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpectedToken(lookahead);
        }
    }

    // Cover grammar support.
    //
    // When an assignment expression position starts with an left parenthesis, the determination of the type
    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
    //
    // There are three productions that can be parsed in a parentheses pair that needs to be determined
    // after the outermost pair is closed. They are:
    //
    //   1. AssignmentExpression
    //   2. BindingElements
    //   3. AssignmentTargets
    //
    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
    // binding element or assignment target.
    //
    // The three productions have the relationship:
    //
    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
    //
    // with a single exception that CoverInitializedName when used directly in an Expression, generates
    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
    //
    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
    // the CoverInitializedName check is conducted.
    //
    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
    // pattern. The CoverInitializedName check is deferred.
    function isolateCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        if (firstCoverInitializedNameError !== null) {
            throwUnexpectedToken(firstCoverInitializedNameError);
        }
        isBindingElement = oldIsBindingElement;
        isAssignmentTarget = oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError;
        return result;
    }

    function inheritCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        isBindingElement = isBindingElement && oldIsBindingElement;
        isAssignmentTarget = isAssignmentTarget && oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError || firstCoverInitializedNameError;
        return result;
    }

    // ECMA-262 13.3.3 Destructuring Binding Patterns

    function parseArrayPattern(params, kind) {
        var node = new Node(), elements = [], rest, restNode;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                if (match('...')) {
                    restNode = new Node();
                    lex();
                    params.push(lookahead);
                    rest = parseVariableIdentifier(params, kind);
                    elements.push(restNode.finishRestElement(rest));
                    break;
                } else {
                    elements.push(parsePatternWithDefault(params, kind));
                }
                if (!match(']')) {
                    expect(',');
                }
            }

        }

        expect(']');

        return node.finishArrayPattern(elements);
    }

    function parsePropertyPattern(params, kind) {
        var node = new Node(), key, keyToken, computed = match('['), init;
        if (lookahead.type === Token.Identifier) {
            keyToken = lookahead;
            key = parseVariableIdentifier();
            if (match('=')) {
                params.push(keyToken);
                lex();
                init = parseAssignmentExpression();

                return node.finishProperty(
                    'init', key, false,
                    new WrappingNode(keyToken).finishAssignmentPattern(key, init), false, false);
            } else if (!match(':')) {
                params.push(keyToken);
                return node.finishProperty('init', key, false, key, false, true);
            }
        } else {
            key = parseObjectPropertyKey(params, kind);
        }
        expect(':');
        init = parsePatternWithDefault(params, kind);
        return node.finishProperty('init', key, computed, init, false, false);
    }

    function parseObjectPattern(params, kind) {
        var node = new Node(), properties = [];

        expect('{');

        while (!match('}')) {
            properties.push(parsePropertyPattern(params, kind));
            if (!match('}')) {
                expect(',');
            }
        }

        lex();

        return node.finishObjectPattern(properties);
    }

    function parsePattern(params, kind) {
        if (match('[')) {
            return parseArrayPattern(params, kind);
        } else if (match('{')) {
            return parseObjectPattern(params, kind);
        }
        params.push(lookahead);
        return parseVariableIdentifier(kind);
    }

    function parsePatternWithDefault(params, kind) {
        var startToken = lookahead, pattern, previousAllowYield, right;
        pattern = parsePattern(params, kind);
        if (match('=')) {
            lex();
            previousAllowYield = state.allowYield;
            state.allowYield = true;
            right = isolateCoverGrammar(parseAssignmentExpression);
            state.allowYield = previousAllowYield;
            pattern = new WrappingNode(startToken).finishAssignmentPattern(pattern, right);
        }
        return pattern;
    }

    // ECMA-262 12.2.5 Array Initializer

    function parseArrayInitializer() {
        var elements = [], node = new Node(), restSpread;

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else if (match('...')) {
                restSpread = new Node();
                lex();
                restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    isAssignmentTarget = isBindingElement = false;
                    expect(',');
                }
                elements.push(restSpread);
            } else {
                elements.push(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return node.finishArrayExpression(elements);
    }

    // ECMA-262 12.2.6 Object Initializer

    function parsePropertyFunction(node, paramInfo, isGenerator) {
        var previousStrict, body;

        isAssignmentTarget = isBindingElement = false;

        previousStrict = strict;
        body = isolateCoverGrammar(parseFunctionSourceElements);

        if (strict && paramInfo.firstRestricted) {
            tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
        }
        if (strict && paramInfo.stricted) {
            tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
        }

        strict = previousStrict;
        return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
    }

    function parsePropertyMethodFunction() {
        var params, method, node = new Node(),
            previousAllowYield = state.allowYield;

        state.allowYield = false;
        params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        method = parsePropertyFunction(node, params, false);
        state.allowYield = previousAllowYield;

        return method;
    }

    function parseObjectPropertyKey() {
        var token, node = new Node(), expr;

        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return node.finishIdentifier(token.value);
        case Token.Punctuator:
            if (token.value === '[') {
                expr = isolateCoverGrammar(parseAssignmentExpression);
                expect(']');
                return expr;
            }
            break;
        }
        throwUnexpectedToken(token);
    }

    function lookaheadPropertyName() {
        switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return lookahead.value === '[';
        }
        return false;
    }

    // This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
    // it might be called at a position where there is in fact a short hand identifier pattern or a data property.
    // This can only be determined after we consumed up to the left parentheses.
    //
    // In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
    // is responsible to visit other options.
    function tryParseMethodDefinition(token, key, computed, node) {
        var value, options, methodNode, params,
            previousAllowYield = state.allowYield;

        if (token.type === Token.Identifier) {
            // check for `get` and `set`;

            if (token.value === 'get' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, {
                    params: [],
                    defaults: [],
                    stricted: null,
                    firstRestricted: null,
                    message: null
                }, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('get', key, computed, value, false, false);
            } else if (token.value === 'set' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');

                options = {
                    params: [],
                    defaultCount: 0,
                    defaults: [],
                    firstRestricted: null,
                    paramSet: {}
                };
                if (match(')')) {
                    tolerateUnexpectedToken(lookahead);
                } else {
                    state.allowYield = false;
                    parseParam(options);
                    state.allowYield = previousAllowYield;
                    if (options.defaultCount === 0) {
                        options.defaults = [];
                    }
                }
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, options, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('set', key, computed, value, false, false);
            }
        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            methodNode = new Node();

            state.allowYield = true;
            params = parseParams();
            state.allowYield = previousAllowYield;

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, params, true);
            state.allowYield = previousAllowYield;

            return node.finishProperty('init', key, computed, value, true, false);
        }

        if (key && match('(')) {
            value = parsePropertyMethodFunction();
            return node.finishProperty('init', key, computed, value, true, false);
        }

        // Not a MethodDefinition.
        return null;
    }

    function parseObjectProperty(hasProto) {
        var token = lookahead, node = new Node(), computed, key, maybeMethod, proto, value;

        computed = match('[');
        if (match('*')) {
            lex();
        } else {
            key = parseObjectPropertyKey();
        }
        maybeMethod = tryParseMethodDefinition(token, key, computed, node);
        if (maybeMethod) {
            return maybeMethod;
        }

        if (!key) {
            throwUnexpectedToken(lookahead);
        }

        // Check for duplicated __proto__
        if (!computed) {
            proto = (key.type === Syntax.Identifier && key.name === '__proto__') ||
                (key.type === Syntax.Literal && key.value === '__proto__');
            if (hasProto.value && proto) {
                tolerateError(Messages.DuplicateProtoProperty);
            }
            hasProto.value |= proto;
        }

        if (match(':')) {
            lex();
            value = inheritCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed, value, false, false);
        }

        if (token.type === Token.Identifier) {
            if (match('=')) {
                firstCoverInitializedNameError = lookahead;
                lex();
                value = isolateCoverGrammar(parseAssignmentExpression);
                return node.finishProperty('init', key, computed,
                    new WrappingNode(token).finishAssignmentPattern(key, value), false, true);
            }
            return node.finishProperty('init', key, computed, key, false, true);
        }

        throwUnexpectedToken(lookahead);
    }

    function parseObjectInitializer() {
        var properties = [], hasProto = {value: false}, node = new Node();

        expect('{');

        while (!match('}')) {
            properties.push(parseObjectProperty(hasProto));

            if (!match('}')) {
                expectCommaSeparator();
            }
        }

        expect('}');

        return node.finishObjectExpression(properties);
    }

    function reinterpretExpressionAsPattern(expr) {
        var i;
        switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
            break;
        case Syntax.SpreadElement:
            expr.type = Syntax.RestElement;
            reinterpretExpressionAsPattern(expr.argument);
            break;
        case Syntax.ArrayExpression:
            expr.type = Syntax.ArrayPattern;
            for (i = 0; i < expr.elements.length; i++) {
                if (expr.elements[i] !== null) {
                    reinterpretExpressionAsPattern(expr.elements[i]);
                }
            }
            break;
        case Syntax.ObjectExpression:
            expr.type = Syntax.ObjectPattern;
            for (i = 0; i < expr.properties.length; i++) {
                reinterpretExpressionAsPattern(expr.properties[i].value);
            }
            break;
        case Syntax.AssignmentExpression:
            expr.type = Syntax.AssignmentPattern;
            reinterpretExpressionAsPattern(expr.left);
            break;
        default:
            // Allow other node type for tolerant parsing.
            break;
        }
    }

    // ECMA-262 12.2.9 Template Literals

    function parseTemplateElement(option) {
        var node, token;

        if (lookahead.type !== Token.Template || (option.head && !lookahead.head)) {
            throwUnexpectedToken();
        }

        node = new Node();
        token = lex();

        return node.finishTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail);
    }

    function parseTemplateLiteral() {
        var quasi, quasis, expressions, node = new Node();

        quasi = parseTemplateElement({ head: true });
        quasis = [quasi];
        expressions = [];

        while (!quasi.tail) {
            expressions.push(parseExpression());
            quasi = parseTemplateElement({ head: false });
            quasis.push(quasi);
        }

        return node.finishTemplateLiteral(quasis, expressions);
    }

    // ECMA-262 12.2.10 The Grouping Operator

    function parseGroupExpression() {
        var expr, expressions, startToken, i, params = [];

        expect('(');

        if (match(')')) {
            lex();
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [],
                rawParams: []
            };
        }

        startToken = lookahead;
        if (match('...')) {
            expr = parseRestElement(params);
            expect(')');
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        isBindingElement = true;
        expr = inheritCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            isAssignmentTarget = false;
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();

                if (match('...')) {
                    if (!isBindingElement) {
                        throwUnexpectedToken(lookahead);
                    }
                    expressions.push(parseRestElement(params));
                    expect(')');
                    if (!match('=>')) {
                        expect('=>');
                    }
                    isBindingElement = false;
                    for (i = 0; i < expressions.length; i++) {
                        reinterpretExpressionAsPattern(expressions[i]);
                    }
                    return {
                        type: PlaceHolders.ArrowParameterPlaceHolder,
                        params: expressions
                    };
                }

                expressions.push(inheritCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }


        expect(')');

        if (match('=>')) {
            if (expr.type === Syntax.Identifier && expr.name === 'yield') {
                return {
                    type: PlaceHolders.ArrowParameterPlaceHolder,
                    params: [expr]
                };
            }

            if (!isBindingElement) {
                throwUnexpectedToken(lookahead);
            }

            if (expr.type === Syntax.SequenceExpression) {
                for (i = 0; i < expr.expressions.length; i++) {
                    reinterpretExpressionAsPattern(expr.expressions[i]);
                }
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            expr = {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]
            };
        }
        isBindingElement = false;
        return expr;
    }


    // ECMA-262 12.2 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, node;

        if (match('(')) {
            isBindingElement = false;
            return inheritCoverGrammar(parseGroupExpression);
        }

        if (match('[')) {
            return inheritCoverGrammar(parseArrayInitializer);
        }

        if (match('{')) {
            return inheritCoverGrammar(parseObjectInitializer);
        }

        type = lookahead.type;
        node = new Node();

        if (type === Token.Identifier) {
            if (state.sourceType === 'module' && lookahead.value === 'await') {
                tolerateUnexpectedToken(lookahead);
            }
            expr = node.finishIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            isAssignmentTarget = isBindingElement = false;
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        } else if (type === Token.Keyword) {
            if (!strict && state.allowYield && matchKeyword('yield')) {
                return parseNonComputedProperty();
            }
            isAssignmentTarget = isBindingElement = false;
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                return node.finishThisExpression();
            }
            if (matchKeyword('class')) {
                return parseClassExpression();
            }
            throwUnexpectedToken(lex());
        } else if (type === Token.BooleanLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        } else if (type === Token.NullLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        } else if (match('/') || match('/=')) {
            isAssignmentTarget = isBindingElement = false;
            index = startIndex;

            if (typeof extra.tokens !== 'undefined') {
                token = collectRegex();
            } else {
                token = scanRegExp();
            }
            lex();
            expr = node.finishLiteral(token);
        } else if (type === Token.Template) {
            expr = parseTemplateLiteral();
        } else {
            throwUnexpectedToken(lex());
        }

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], expr;

        expect('(');

        if (!match(')')) {
            while (startIndex < length) {
                if (match('...')) {
                    expr = new Node();
                    lex();
                    expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
                } else {
                    expr = isolateCoverGrammar(parseAssignmentExpression);
                }
                args.push(expr);
                if (match(')')) {
                    break;
                }
                expectCommaSeparator();
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, node = new Node();

        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = isolateCoverGrammar(parseExpression);

        expect(']');

        return expr;
    }

    // ECMA-262 12.3.3 The new Operator

    function parseNewExpression() {
        var callee, args, node = new Node();

        expectKeyword('new');

        if (match('.')) {
            lex();
            if (lookahead.type === Token.Identifier && lookahead.value === 'target') {
                if (state.inFunctionBody) {
                    lex();
                    return node.finishMetaProperty('new', 'target');
                }
            }
            throwUnexpectedToken(lookahead);
        }

        callee = isolateCoverGrammar(parseLeftHandSideExpression);
        args = match('(') ? parseArguments() : [];

        isAssignmentTarget = isBindingElement = false;

        return node.finishNewExpression(callee, args);
    }

    // ECMA-262 12.3.4 Function Calls

    function parseLeftHandSideExpressionAllowCall() {
        var quasi, expr, args, property, startToken, previousAllowIn = state.allowIn;

        startToken = lookahead;
        state.allowIn = true;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('(') && !match('.') && !match('[')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (match('(')) {
                isBindingElement = false;
                isAssignmentTarget = false;
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            } else if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        state.allowIn = previousAllowIn;

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseLeftHandSideExpression() {
        var quasi, expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');

        startToken = lookahead;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('[') && !match('.')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        return expr;
    }

    // ECMA-262 12.4 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

        if (!hasLineTerminator && lookahead.type === Token.Punctuator) {
            if (match('++') || match('--')) {
                // ECMA-262 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }

                if (!isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }

                isAssignmentTarget = isBindingElement = false;

                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }

        return expr;
    }

    // ECMA-262 12.5 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            // ECMA-262 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }

            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
            }
            isAssignmentTarget = isBindingElement = false;
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // ECMA-262 12.6 Multiplicative Operators
    // ECMA-262 12.7 Additive Operators
    // ECMA-262 12.8 Bitwise Shift Operators
    // ECMA-262 12.9 Relational Operators
    // ECMA-262 12.10 Equality Operators
    // ECMA-262 12.11 Binary Bitwise Operators
    // ECMA-262 12.12 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = inheritCoverGrammar(parseUnaryExpression);

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        isAssignmentTarget = isBindingElement = false;
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = isolateCoverGrammar(parseUnaryExpression);

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                markers.pop();
                expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = isolateCoverGrammar(parseUnaryExpression);
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
        }

        return expr;
    }


    // ECMA-262 12.13 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = inheritCoverGrammar(parseBinaryExpression);
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = isolateCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = isolateCoverGrammar(parseAssignmentExpression);

            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
            isAssignmentTarget = isBindingElement = false;
        }

        return expr;
    }

    // ECMA-262 14.2 Arrow Function Definitions

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return isolateCoverGrammar(parseAssignmentExpression);
    }

    function checkPatternParam(options, param) {
        var i;
        switch (param.type) {
        case Syntax.Identifier:
            validateParam(options, param, param.name);
            break;
        case Syntax.RestElement:
            checkPatternParam(options, param.argument);
            break;
        case Syntax.AssignmentPattern:
            checkPatternParam(options, param.left);
            break;
        case Syntax.ArrayPattern:
            for (i = 0; i < param.elements.length; i++) {
                if (param.elements[i] !== null) {
                    checkPatternParam(options, param.elements[i]);
                }
            }
            break;
        case Syntax.YieldExpression:
            break;
        default:
            assert(param.type === Syntax.ObjectPattern, 'Invalid type');
            for (i = 0; i < param.properties.length; i++) {
                checkPatternParam(options, param.properties[i].value);
            }
            break;
        }
    }
    function reinterpretAsCoverFormalsList(expr) {
        var i, len, param, params, defaults, defaultCount, options, token;

        defaults = [];
        defaultCount = 0;
        params = [expr];

        switch (expr.type) {
        case Syntax.Identifier:
            break;
        case PlaceHolders.ArrowParameterPlaceHolder:
            params = expr.params;
            break;
        default:
            return null;
        }

        options = {
            paramSet: {}
        };

        for (i = 0, len = params.length; i < len; i += 1) {
            param = params[i];
            switch (param.type) {
            case Syntax.AssignmentPattern:
                params[i] = param.left;
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        throwUnexpectedToken(lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
                defaults.push(param.right);
                ++defaultCount;
                checkPatternParam(options, param.left);
                break;
            default:
                checkPatternParam(options, param);
                params[i] = param;
                defaults.push(null);
                break;
            }
        }

        if (strict || !state.allowYield) {
            for (i = 0, len = params.length; i < len; i += 1) {
                param = params[i];
                if (param.type === Syntax.YieldExpression) {
                    throwUnexpectedToken(lookahead);
                }
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            token = strict ? options.stricted : options.firstRestricted;
            throwUnexpectedToken(token, options.message);
        }

        if (defaultCount === 0) {
            defaults = [];
        }

        return {
            params: params,
            defaults: defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseArrowFunctionExpression(options, node) {
        var previousStrict, previousAllowYield, body;

        if (hasLineTerminator) {
            tolerateUnexpectedToken(lookahead);
        }
        expect('=>');

        previousStrict = strict;
        previousAllowYield = state.allowYield;
        state.allowYield = true;

        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }

    // ECMA-262 14.4 Yield expression

    function parseYieldExpression() {
        var argument, expr, delegate, previousAllowYield;

        argument = null;
        expr = new Node();

        expectKeyword('yield');

        if (!hasLineTerminator) {
            previousAllowYield = state.allowYield;
            state.allowYield = false;
            delegate = match('*');
            if (delegate) {
                lex();
                argument = parseAssignmentExpression();
            } else {
                if (!match(';') && !match('}') && !match(')') && lookahead.type !== Token.EOF) {
                    argument = parseAssignmentExpression();
                }
            }
            state.allowYield = previousAllowYield;
        }

        return expr.finishYieldExpression(argument, delegate);
    }

    // ECMA-262 12.14 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr, right, list, startToken;

        startToken = lookahead;
        token = lookahead;

        if (!state.allowYield && matchKeyword('yield')) {
            return parseYieldExpression();
        }

        expr = parseConditionalExpression();

        if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            isAssignmentTarget = isBindingElement = false;
            list = reinterpretAsCoverFormalsList(expr);

            if (list) {
                firstCoverInitializedNameError = null;
                return parseArrowFunctionExpression(list, new WrappingNode(startToken));
            }

            return expr;
        }

        if (matchAssign()) {
            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            // ECMA-262 12.1.1
            if (strict && expr.type === Syntax.Identifier) {
                if (isRestrictedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
                }
                if (isStrictModeReservedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictReservedWord);
                }
            }

            if (!match('=')) {
                isAssignmentTarget = isBindingElement = false;
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            token = lex();
            right = isolateCoverGrammar(parseAssignmentExpression);
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
            firstCoverInitializedNameError = null;
        }

        return expr;
    }

    // ECMA-262 12.15 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead, expressions;

        expr = isolateCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(isolateCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }

        return expr;
    }

    // ECMA-262 13.2 Block

    function parseStatementListItem() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case 'const':
            case 'let':
                return parseLexicalDeclaration({inFor: false});
            case 'function':
                return parseFunctionDeclaration(new Node());
            case 'class':
                return parseClassDeclaration();
            }
        }

        return parseStatement();
    }

    function parseStatementList() {
        var list = [];
        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            list.push(parseStatementListItem());
        }

        return list;
    }

    function parseBlock() {
        var block, node = new Node();

        expect('{');

        block = parseStatementList();

        expect('}');

        return node.finishBlockStatement(block);
    }

    // ECMA-262 13.3.2 Variable Statement

    function parseVariableIdentifier(kind) {
        var token, node = new Node();

        token = lex();

        if (token.type === Token.Keyword && token.value === 'yield') {
            if (strict) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } if (!state.allowYield) {
                throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (strict || token.value !== 'let' || kind !== 'var') {
                    throwUnexpectedToken(token);
                }
            }
        } else if (state.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
            tolerateUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseVariableDeclaration(options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, 'var');

        // ECMA-262 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (match('=')) {
            lex();
            init = isolateCoverGrammar(parseAssignmentExpression);
        } else if (id.type !== Syntax.Identifier && !options.inFor) {
            expect('=');
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseVariableDeclarationList(options) {
        var list = [];

        do {
            list.push(parseVariableDeclaration({ inFor: options.inFor }));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseVariableStatement(node) {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList({ inFor: false });

        consumeSemicolon();

        return node.finishVariableDeclaration(declarations);
    }

    // ECMA-262 13.3.1 Let and Const Declarations

    function parseLexicalBinding(kind, options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, kind);

        // ECMA-262 12.2.1
        if (strict && id.type === Syntax.Identifier && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (kind === 'const') {
            if (!matchKeyword('in') && !matchContextualKeyword('of')) {
                expect('=');
                init = isolateCoverGrammar(parseAssignmentExpression);
            }
        } else if ((!options.inFor && id.type !== Syntax.Identifier) || match('=')) {
            expect('=');
            init = isolateCoverGrammar(parseAssignmentExpression);
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseBindingList(kind, options) {
        var list = [];

        do {
            list.push(parseLexicalBinding(kind, options));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseLexicalDeclaration(options) {
        var kind, declarations, node = new Node();

        kind = lex().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        declarations = parseBindingList(kind, options);

        consumeSemicolon();

        return node.finishLexicalDeclaration(declarations, kind);
    }

    function parseRestElement(params) {
        var param, node = new Node();

        lex();

        if (match('{')) {
            throwError(Messages.ObjectPatternAsRestParameter);
        }

        params.push(lookahead);

        param = parseVariableIdentifier();

        if (match('=')) {
            throwError(Messages.DefaultRestParameter);
        }

        if (!match(')')) {
            throwError(Messages.ParameterAfterRestParameter);
        }

        return node.finishRestElement(param);
    }

    // ECMA-262 13.4 Empty Statement

    function parseEmptyStatement(node) {
        expect(';');
        return node.finishEmptyStatement();
    }

    // ECMA-262 12.4 Expression Statement

    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 13.6 If statement

    function parseIfStatement(node) {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return node.finishIfStatement(test, consequent, alternate);
    }

    // ECMA-262 13.7 Iteration Statements

    function parseDoWhileStatement(node) {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return node.finishDoWhileStatement(body, test);
    }

    function parseWhileStatement(node) {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return node.finishWhileStatement(test, body);
    }

    function parseForStatement(node) {
        var init, forIn, initSeq, initStartToken, test, update, left, right, kind, declarations,
            body, oldInIteration, previousAllowIn = state.allowIn;

        init = test = update = null;
        forIn = true;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var')) {
                init = new Node();
                lex();

                state.allowIn = false;
                declarations = parseVariableDeclarationList({ inFor: true });
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && matchKeyword('in')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    init = init.finishVariableDeclaration(declarations);
                    expect(';');
                }
            } else if (matchKeyword('const') || matchKeyword('let')) {
                init = new Node();
                kind = lex().value;

                state.allowIn = false;
                declarations = parseBindingList(kind, {inFor: true});
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    consumeSemicolon();
                    init = init.finishLexicalDeclaration(declarations, kind);
                }
            } else {
                initStartToken = lookahead;
                state.allowIn = false;
                init = inheritCoverGrammar(parseAssignmentExpression);
                state.allowIn = previousAllowIn;

                if (matchKeyword('in')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchContextualKeyword('of')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForLoop);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    if (match(',')) {
                        initSeq = [init];
                        while (match(',')) {
                            lex();
                            initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                        }
                        init = new WrappingNode(initStartToken).finishSequenceExpression(initSeq);
                    }
                    expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = isolateCoverGrammar(parseStatement);

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                node.finishForStatement(init, test, update, body) :
                forIn ? node.finishForInStatement(left, right, body) :
                    node.finishForOfStatement(left, right, body);
    }

    // ECMA-262 13.8 The continue statement

    function parseContinueStatement(node) {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(startIndex) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (hasLineTerminator) {
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(label);
    }

    // ECMA-262 13.9 The break statement

    function parseBreakStatement(node) {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(lastIndex) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (hasLineTerminator) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(label);
    }

    // ECMA-262 13.10 The return statement

    function parseReturnStatement(node) {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            tolerateError(Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(lastIndex) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(lastIndex + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return node.finishReturnStatement(argument);
            }
        }

        if (hasLineTerminator) {
            // HACK
            return node.finishReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return node.finishReturnStatement(argument);
    }

    // ECMA-262 13.11 The with statement

    function parseWithStatement(node) {
        var object, body;

        if (strict) {
            tolerateError(Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return node.finishWithStatement(object, body);
    }

    // ECMA-262 13.12 The switch statement

    function parseSwitchCase() {
        var test, consequent = [], statement, node = new Node();

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (startIndex < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatementListItem();
            consequent.push(statement);
        }

        return node.finishSwitchCase(test, consequent);
    }

    function parseSwitchStatement(node) {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return node.finishSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return node.finishSwitchStatement(discriminant, cases);
    }

    // ECMA-262 13.14 The throw statement

    function parseThrowStatement(node) {
        var argument;

        expectKeyword('throw');

        if (hasLineTerminator) {
            throwError(Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return node.finishThrowStatement(argument);
    }

    // ECMA-262 13.15 The try statement

    function parseCatchClause() {
        var param, params = [], paramMap = {}, key, i, body, node = new Node();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }

        param = parsePattern(params);
        for (i = 0; i < params.length; i++) {
            key = '$' + params[i].value;
            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
                tolerateError(Messages.DuplicateBinding, params[i].value);
            }
            paramMap[key] = true;
        }

        // ECMA-262 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            tolerateError(Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return node.finishCatchClause(param, body);
    }

    function parseTryStatement(node) {
        var block, handler = null, finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handler = parseCatchClause();
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (!handler && !finalizer) {
            throwError(Messages.NoCatchOrFinally);
        }

        return node.finishTryStatement(block, handler, finalizer);
    }

    // ECMA-262 13.16 The debugger statement

    function parseDebuggerStatement(node) {
        expectKeyword('debugger');

        consumeSemicolon();

        return node.finishDebuggerStatement();
    }

    // 13 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            node;

        if (type === Token.EOF) {
            throwUnexpectedToken(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }
        isAssignmentTarget = isBindingElement = true;
        node = new Node();

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
            }
        } else if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return parseBreakStatement(node);
            case 'continue':
                return parseContinueStatement(node);
            case 'debugger':
                return parseDebuggerStatement(node);
            case 'do':
                return parseDoWhileStatement(node);
            case 'for':
                return parseForStatement(node);
            case 'function':
                return parseFunctionDeclaration(node);
            case 'if':
                return parseIfStatement(node);
            case 'return':
                return parseReturnStatement(node);
            case 'switch':
                return parseSwitchStatement(node);
            case 'throw':
                return parseThrowStatement(node);
            case 'try':
                return parseTryStatement(node);
            case 'var':
                return parseVariableStatement(node);
            case 'while':
                return parseWhileStatement(node);
            case 'with':
                return parseWithStatement(node);
            default:
                break;
            }
        }

        expr = parseExpression();

        // ECMA-262 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return node.finishLabeledStatement(expr, labeledBody);
        }

        consumeSemicolon();

        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 14.1 Function Definition

    function parseFunctionSourceElements() {
        var statement, body = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesisCount,
            node = new Node();

        expect('{');

        while (startIndex < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        oldParenthesisCount = state.parenthesizedCount;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        state.parenthesizedCount = 0;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            body.push(parseStatementListItem());
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        state.parenthesizedCount = oldParenthesisCount;

        return node.finishBlockStatement(body);
    }

    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var token, param, params = [], i, def;

        token = lookahead;
        if (token.value === '...') {
            param = parseRestElement(params);
            validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            options.defaults.push(null);
            return false;
        }

        param = parsePatternWithDefault(params);
        for (i = 0; i < params.length; i++) {
            validateParam(options, params[i], params[i].value);
        }

        if (param.type === Syntax.AssignmentPattern) {
            def = param.right;
            param = param.left;
            ++options.defaultCount;
        }

        options.params.push(param);
        options.defaults.push(def);

        return !match(')');
    }

    function parseParams(firstRestricted) {
        var options;

        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            firstRestricted: firstRestricted
        };

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (startIndex < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        if (options.defaultCount === 0) {
            options.defaults = [];
        }

        return {
            params: options.params,
            defaults: options.defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseFunctionDeclaration(node, identifierIsOptional) {
        var id = null, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict,
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        if (!identifierIsOptional || !match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        state.allowYield = !isGenerator;
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }


        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp,
            params = [], defaults = [], body, previousStrict, node = new Node(),
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        state.allowYield = !isGenerator;
        if (!match('(')) {
            token = lookahead;
            id = (!strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
    }

    // ECMA-262 14.5 Class Definitions

    function parseClassBody() {
        var classBody, token, isStatic, hasConstructor = false, body, method, computed, key;

        classBody = new Node();

        expect('{');
        body = [];
        while (!match('}')) {
            if (match(';')) {
                lex();
            } else {
                method = new Node();
                token = lookahead;
                isStatic = false;
                computed = match('[');
                if (match('*')) {
                    lex();
                } else {
                    key = parseObjectPropertyKey();
                    if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                        token = lookahead;
                        isStatic = true;
                        computed = match('[');
                        if (match('*')) {
                            lex();
                        } else {
                            key = parseObjectPropertyKey();
                        }
                    }
                }
                method = tryParseMethodDefinition(token, key, computed, method);
                if (method) {
                    method['static'] = isStatic; // jscs:ignore requireDotNotation
                    if (method.kind === 'init') {
                        method.kind = 'method';
                    }
                    if (!isStatic) {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'constructor') {
                            if (method.kind !== 'method' || !method.method || method.value.generator) {
                                throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                            }
                            if (hasConstructor) {
                                throwUnexpectedToken(token, Messages.DuplicateConstructor);
                            } else {
                                hasConstructor = true;
                            }
                            method.kind = 'constructor';
                        }
                    } else {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'prototype') {
                            throwUnexpectedToken(token, Messages.StaticPrototype);
                        }
                    }
                    method.type = Syntax.MethodDefinition;
                    delete method.method;
                    delete method.shorthand;
                    body.push(method);
                } else {
                    throwUnexpectedToken(lookahead);
                }
            }
        }
        lex();
        return classBody.finishClassBody(body);
    }

    function parseClassDeclaration(identifierIsOptional) {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (!identifierIsOptional || lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassDeclaration(id, superClass, classBody);
    }

    function parseClassExpression() {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassExpression(id, superClass, classBody);
    }

    // ECMA-262 15.2 Modules

    function parseModuleSpecifier() {
        var node = new Node();

        if (lookahead.type !== Token.StringLiteral) {
            throwError(Messages.InvalidModuleSpecifier);
        }
        return node.finishLiteral(lex());
    }

    // ECMA-262 15.2.3 Exports

    function parseExportSpecifier() {
        var exported, local, node = new Node(), def;
        if (matchKeyword('default')) {
            // export {default} from 'something';
            def = new Node();
            lex();
            local = def.finishIdentifier('default');
        } else {
            local = parseVariableIdentifier();
        }
        if (matchContextualKeyword('as')) {
            lex();
            exported = parseNonComputedProperty();
        }
        return node.finishExportSpecifier(local, exported);
    }

    function parseExportNamedDeclaration(node) {
        var declaration = null,
            isExportFromIdentifier,
            src = null, specifiers = [];

        // non-default export
        if (lookahead.type === Token.Keyword) {
            // covers:
            // export var f = 1;
            switch (lookahead.value) {
                case 'let':
                case 'const':
                case 'var':
                case 'class':
                case 'function':
                    declaration = parseStatementListItem();
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
            }
        }

        expect('{');
        while (!match('}')) {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
            specifiers.push(parseExportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');

        if (matchContextualKeyword('from')) {
            // covering:
            // export {default} from 'foo';
            // export {foo} from 'foo';
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
        } else if (isExportFromIdentifier) {
            // covering:
            // export {default}; // missing fromClause
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        } else {
            // cover
            // export {foo};
            consumeSemicolon();
        }
        return node.finishExportNamedDeclaration(declaration, specifiers, src);
    }

    function parseExportDefaultDeclaration(node) {
        var declaration = null,
            expression = null;

        // covers:
        // export default ...
        expectKeyword('default');

        if (matchKeyword('function')) {
            // covers:
            // export default function foo () {}
            // export default function () {}
            declaration = parseFunctionDeclaration(new Node(), true);
            return node.finishExportDefaultDeclaration(declaration);
        }
        if (matchKeyword('class')) {
            declaration = parseClassDeclaration(true);
            return node.finishExportDefaultDeclaration(declaration);
        }

        if (matchContextualKeyword('from')) {
            throwError(Messages.UnexpectedToken, lookahead.value);
        }

        // covers:
        // export default {};
        // export default [];
        // export default (1 + 2);
        if (match('{')) {
            expression = parseObjectInitializer();
        } else if (match('[')) {
            expression = parseArrayInitializer();
        } else {
            expression = parseAssignmentExpression();
        }
        consumeSemicolon();
        return node.finishExportDefaultDeclaration(expression);
    }

    function parseExportAllDeclaration(node) {
        var src;

        // covers:
        // export * from 'foo';
        expect('*');
        if (!matchContextualKeyword('from')) {
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();

        return node.finishExportAllDeclaration(src);
    }

    function parseExportDeclaration() {
        var node = new Node();
        if (state.inFunctionBody) {
            throwError(Messages.IllegalExportDeclaration);
        }

        expectKeyword('export');

        if (matchKeyword('default')) {
            return parseExportDefaultDeclaration(node);
        }
        if (match('*')) {
            return parseExportAllDeclaration(node);
        }
        return parseExportNamedDeclaration(node);
    }

    // ECMA-262 15.2.2 Imports

    function parseImportSpecifier() {
        // import {<foo as bar>} ...;
        var local, imported, node = new Node();

        imported = parseNonComputedProperty();
        if (matchContextualKeyword('as')) {
            lex();
            local = parseVariableIdentifier();
        }

        return node.finishImportSpecifier(local, imported);
    }

    function parseNamedImports() {
        var specifiers = [];
        // {foo, bar as bas}
        expect('{');
        while (!match('}')) {
            specifiers.push(parseImportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');
        return specifiers;
    }

    function parseImportDefaultSpecifier() {
        // import <foo> ...;
        var local, node = new Node();

        local = parseNonComputedProperty();

        return node.finishImportDefaultSpecifier(local);
    }

    function parseImportNamespaceSpecifier() {
        // import <* as foo> ...;
        var local, node = new Node();

        expect('*');
        if (!matchContextualKeyword('as')) {
            throwError(Messages.NoAsAfterImportNamespace);
        }
        lex();
        local = parseNonComputedProperty();

        return node.finishImportNamespaceSpecifier(local);
    }

    function parseImportDeclaration() {
        var specifiers = [], src, node = new Node();

        if (state.inFunctionBody) {
            throwError(Messages.IllegalImportDeclaration);
        }

        expectKeyword('import');

        if (lookahead.type === Token.StringLiteral) {
            // import 'foo';
            src = parseModuleSpecifier();
        } else {

            if (match('{')) {
                // import {bar}
                specifiers = specifiers.concat(parseNamedImports());
            } else if (match('*')) {
                // import * as foo
                specifiers.push(parseImportNamespaceSpecifier());
            } else if (isIdentifierName(lookahead) && !matchKeyword('default')) {
                // import foo
                specifiers.push(parseImportDefaultSpecifier());
                if (match(',')) {
                    lex();
                    if (match('*')) {
                        // import foo, * as foo
                        specifiers.push(parseImportNamespaceSpecifier());
                    } else if (match('{')) {
                        // import foo, {bar}
                        specifiers = specifiers.concat(parseNamedImports());
                    } else {
                        throwUnexpectedToken(lookahead);
                    }
                }
            } else {
                throwUnexpectedToken(lex());
            }

            if (!matchContextualKeyword('from')) {
                throwError(lookahead.value ?
                        Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
        }

        consumeSemicolon();
        return node.finishImportDeclaration(specifiers, src);
    }

    // ECMA-262 15.1 Scripts

    function parseScriptBody() {
        var statement, body = [], token, directive, firstRestricted;

        while (startIndex < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (startIndex < length) {
            statement = parseStatementListItem();
            /* istanbul ignore if */
            if (typeof statement === 'undefined') {
                break;
            }
            body.push(statement);
        }
        return body;
    }

    function parseProgram() {
        var body, node;

        peek();
        node = new Node();

        body = parseScriptBody();
        return node.finishProgram(body, state.sourceType);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options) {
        var toString,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: []
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenize = true;
        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    lex();
                } catch (lexError) {
                    if (extra.errors) {
                        recordError(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            filterTokenLocation();
            tokens = extra.tokens;
            if (typeof extra.comments !== 'undefined') {
                tokens.comments = extra.comments;
            }
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: [],
            sourceType: 'script'
        };
        strict = false;

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
            if (options.sourceType === 'module') {
                // very restrictive condition for now
                state.sourceType = options.sourceType;
                strict = true;
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '2.6.0';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */



/* ----------------------
	parser
----------------------- */

new CircularModule({
	
	name			: 'parser',
	requires	: ['log','debug'],
	config		: {
		exprregex				:	/{{([^}]*?)}}/g,
		evalfail				: undefined,
		rootscope				: 'window' // bad idea
	},
	
	// requires esprima.
	// @see http://esprima.org/demo/parse.html
	
	
	getPaths :	function(expression) {
		Circular.debug.write('Circular.parser.getPaths',expression);
		var ast = esprima.parse(expression);
		if (ast) {
			Circular.debug.write('Circular.parser.getPaths',ast);
			var paths = new Array();
			this.recursePaths(ast,paths);
			return paths;
		} else return false;
	},
	
	recursePaths	: function(tree,paths,path) {
	
		Circular.debug.write('Circular.parser.recursePaths',paths,path);
		
		if (!tree || !paths) return false;
		if (tree.type =='Identifier') {

			// some sort of global
			Circular.debug.write('Circular.parser.recursePaths','adding identifier '+tree.name);
			paths.push(Circular.config.rootscope+'.'+tree.name);

		} else if (tree.type =='MemberExpression') {
		
			// member expression
			
			
			if (tree.property.type=='Identifier' || tree.property.type=='Literal') {
			
				// like foo[bar][24].quz ; the property is 'quz'
				// dabble down the object to get the path
				
				if (tree.property.type=='Identifier') {
					path = (path)?'.'+tree.property.name+path:'.'+tree.property.name;
				} else {
					path = (path)?'['+tree.property.raw+']'+path:'['+tree.property.raw+']';
				}
				
				if (tree.object.type=='Identifier') {
					
					// like foo.bar ; were done with this path - push !
					Circular.debug.write('Circular.parser.recursePaths','adding path '+tree.object.name+path);
					
					if (path.indexOf('.')===0) {
						paths.push(tree.object.name+'.'+path.substring(1));
					} else {
						paths.push(Circular.config.rootscope+'.'+tree.object.name+path);
					}
					
				} else {
					if (tree.object.type=='MemberExpression') {
						
						// like foo.bar.quz ; recurse the object
						Circular.debug.write('Circular.parser.recursePaths','recursing member expression ..');
						this.recursePaths(tree.object,paths,path);						
					
					} else {
						
						// like foo(bar).quz ; the object is something weird. 
						// ignore the property .. but recurse the object
						this.recursePaths(tree.object,paths);	
					
					}
				}
			} else {
			
				// the property is some sort of thing itself:
				
				if (tree.object.type=='Identifier') {
					
					// like foo[bar.quz] - push the object, recurse the property
					Circular.debug.write('Circular.parser.recursePaths','adding identifier '+tree.object.name);
					paths.push(Circular.config.rootscope+'.'+tree.object.name);
					this.recursePaths(tree.property);	
					
				} else {
				
					// like foo.bar[quz(raz)] ; recurse both
					Circular.debug.write('Circular.parser.recursePaths','recursing member expression ..');
					this.recursePaths(tree.object,paths);	
					this.recursePaths(tree.property,paths);	
				
					
				}
				
			}
			
		} else if (tree.type=="CallExpression") {
		
			// like foo.bar(quz.baz) ;
			this.recursePaths(tree.arguments,paths);
			
			// think .toUpperCase()
			if (tree.callee && tree.callee.object) {
				this.recursePaths(tree.callee.object,paths);
			}
			
		} else if (tree.type=="AssignmentExpression") {
		
			// like foo.bar=baz*quz ; we only want the right hand
			this.recursePaths(tree.right,paths);
			
		} else {
		
			// unknown garbage. dig deeper.
			var props = Object.getOwnPropertyNames(tree);
			for (var pc=0; pc<props.length; pc++) {
				var key = props[pc];
				if (typeof tree[key] == 'object') {
					if (Array.isArray(tree[key])) {
						for (var kc=0;kc<tree[key].length;kc++) {
							Circular.debug.write('Circular.parser.recursePaths','recursing '+key+':'+kc);
							this.recursePaths(tree[key][kc],paths);
						}
					} else {
						Circular.debug.write('Circular.parser.recursePaths','recursing '+key,tree[key]);
						this.recursePaths(tree[key],paths);
						
					}
				} else {
					Circular.debug.write('Circular.parser.recursePaths','ignoring '+key);
				}
				
			}
		}
		
	},
	
	
	match	: function(x) {
		// returns an array of matches or false
		Circular.debug.write('Circular.parser.match',x);
		return x.match(Circular.config.exprregex);
	},
	
	// split a text into an array
	// of plain text string and {{expressions}}
	split	: function(text) {
		Circular.debug.write('Circular.parser.split',text);
		var exec; var result = []; 
		var cursor = 0;
		while (exec = Circular.config.exprregex.exec(text)) {
			if (cursor<exec.index) {
				result.push({text:text.substring(cursor,exec.index)});
			}
			result.push({expression:exec[0]});
			cursor = exec.index + exec[0].length;
		}
		if (cursor<text.length) {
			result.push({text:text.substring(cursor,text.length)});
		}
		return result;
	},
	
	// parse a string including {{moustaches}}, returning a
	// qualified expression without {{moustaches}} in which
	// context expressions have been replaced.
	parse	: function(expr,ctx) {
		Circular.debug.write('Circular.parser.parse',expr);
		matches = expr.match(Circular.config.exprregex);
		if (matches) {
			//console.log(matches[0],expr);
			if (matches[0]===expr) {
				// this is a single full expression "{{#foo}}"
				parsed = expr.substring(2,expr.length-2);
				parsed = parsed.replace(/#/g,ctx+'.');
				parsed = parsed.replace(/@/g,'Circular.');
			} else {
				// this is a stringlike thing, "foo {{#bar}}"
				var parsed = expr.replace(Circular.config.exprregex,function(match,inner) {
					inner = inner.replace(/#/g,ctx+'.');
					inner = inner.replace(/@/g,'Circular.');
					return '"+('+inner+')+"';
				});
				// tell eval that this is a stringthing
				parsed = '"'+parsed+'"';
			}
			Circular.debug.write("Circular.parser.parse",expr,ctx,parsed);
			return parsed;
		} 
		return '';
	},
	
	
	// evaluates a qualified expression.
	// this does nothing special, but try,catch.
	eval	: function(expr) {
		Circular.debug.write('Circular.parser.eval');
		try {
				var value = eval(expr);
				Circular.debug.write("Circular.parser.eval",expr,value);
				return value;
		} catch (err) {
				Circular.log.error("Circular.parser.eval",expr,'fail');
				return Circular.config.evalfail;
		}
	}
});
	
/* ----------------------
	registry
----------------------- */

new CircularModule({

	name		: 'registry',
	requires	: ['log','debug'],
	counter	: 0,
	
	newProperties 	: function() {
		return {
			'flags'	: {
				'registered'				: false,
				'processing'				: false,
				'contentchanged'		: true,
				'contentchanged:p'	: 0,
				'contentchanged:i'	: false,
				'contentchanged'		: true,
				'contextchanged'		: true,
				'attrdomchanged'		: true,
				'attrdatachanged'		: true
			},
			'outercontext'	: '',
			'innercontext'	: '',
			'attributes'		: [],		// todo: reverse naming
			'name2attr'			: {}		// todo: reverse naming
		};
	} ,
	
	newAttribute 	: function(name) {
		return {
			'name'				: name,
			'module'			: '',
			'original'		: '',
			'expression'	: '',
			'result'			: undefined,
			'value'				: '',
			'paths'				: [],		// todo: rename to watch
			'flags'			: {
				'registered'				: false,
				'attrdomchanged'		: true,
				'attrdomchanged:p'	: 0,
				'attrdomchanged:i'	: false,
				'attrdatachanged'		: true,
				'attrdatachanged:p'	: 0,
				'attrdatachanged:i'	: false,
				'breaking'					: false
			}
		}
	} ,

	processed			: function(node,props) {
		Circular.debug.write('Circular.registry.processed');
		props.flags = {
			'registered'				: true,
			'processing'				: false,
			'contentchanged'		: false,
			'contextchanged'		: false,
			'attrdomchanged'		: false,
			'attrdatachanged'		: false
		};
		for (var ac=0; ac<props.attributes.length; ac++) {
			props.attributes[ac].flags = {
				'attrdomchanged'	: false,
				'attrdatachanged'	: false,
				'breaking'				: false
			};
		}
	},
	
	add	: function(node,props) {
		Circular.debug.write('Circular.registry.add');
		if (props.flags.registered) {
			return this.update(node,props);
		}
		this.counter++;
		props.flags.registered=true;
		this.processed(node,props);
		$(node).data('cc-properties',props);
		// notify the watchdog of changes
		if (Circular.watchdog) {
			Circular.watchdog.watch(node,props);
		}
		return props;
	},
	
	update	: function(node,props) {
		Circular.debug.write('Circular.registry.update',node,props);
		if (!props.flags.registered) {
			return this.add(node,props);
		}
		this.processed(node,props);
		$(node).data('cc-properties',props);
		// notify the watchdog of changes
		if (Circular.watchdog) {
			Circular.watchdog.watch(node,props);
		}
		return props;
	},
	
	
	set	: function(node,props) {
		//Circular.debug.write('Circular.registry.set');
		$(node).data('cc-properties',props);
	},
	
	get	: function(node) {
		//Circular.debug.write('Circular.registry.get');
		var props = $(node).data('cc-properties');
		if (!props) props = this.newProperties();
		return props;
	}
	
	
	
});
	
/* ----------------------
	engine
----------------------- */

new CircularModule({

	name				: 'engine',	
	requires		: ['log','debug','registry'],
	config			: {
		rootcontext		: 'window'
	},
	
	counter			: 0,
	genid				: 0,
	$queued		: $({}),	
	
	queue			: function(func) {
		Circular.debug.write("Circular.engine.queue",this.$queued.size()+1);
		// an event queue. if we are digesting the
		// registry, push events up the queue instead
		// of running them concurently
		this.$queued.queue('circular',function(next) {
			func();
			next();
		})
		this.$queued.dequeue('circular'); 
	},
	
	cycle				: function() {
		Circular.debug.write('Circular.engine.cycle ');
		Circular.context.set(Circular.config.rootcontext);
		var $root = $('[cc-root]');
		if (!$root.size()) $root = $('[cc-context]');
		$root.each(function() {
			var root = this;
			Circular.engine.queue(function() {
				Circular.engine.process(root); 
			});
		});
	},
	
	recycle	: function(nodes,now) {
		Circular.debug.write('Circular.engine.recycle ');
		if (nodes instanceof jQuery) {
			nodes = nodes.toArray();
		}
		
		if (!nodes) return this.cycle();
		
		if (!now) {
			Circular.engine.queue(function() {
				Circular.engine.recycle(nodes,true);
			});
			return true;
		}
		//alert('recycle');
		
		this.sort(nodes);
		
		nodes.forEach(function(node) {
			// set processing flag
			var props = Circular.registry.get(node);
			props.flags.processing=true;
			Circular.registry.set(node,props);
		});
		
		nodes.forEach(function(node) {
			var props = Circular.registry.get(node);
			if (props.flags.processing) {
				this.process(node);
			} else {
				Circular.debug.write('Circular.engine.recycle ','Node already processed',node,props);
			}
		},this);

		
		return true;
	},
	
	sort 				: function(nodes) {
		var sorted = [];
		if (nodes.length) {
			for (var nc=0; nc<nodes.length;nc++) {
				// create sorted array
				var inside = false;
				for (var sc=0; sc<sorted.length;sc++) {
					//console.log(nc,sc);
					if (sorted[sc].contains(nodes[nc])) {
						inside = true;
					} else {
						if (inside) {
							// bottom. insert before
							//console.log('bottom',nc,sc);
							sorted.splice(sc,0,nodes[nc]);
							break;
						} else if (nodes[nc].contains(sorted[sc])) {
							// middle. insert before
							//console.log('middle/top',nc,sc);
							sorted.splice(sc,0,nodes[nc]);
							break;
						}
					}
				}
				if (sc==sorted.length) {
					//console.log('append',nc,sc);
					sorted.push(nodes[nc]);
				}
			}
		}
		nodes=sorted;
		return sorted;
		
	},
	
	process			: function (node,context) {
		Circular.debug.write('Circular.engine.process',node.nodeName,context);
		if (!node) {
			Circular.log.fatal('Circular.engine.process','no node given');
		}
		if (Circular.dead) {
			Circular.log.fatal('Circular died.');
			return false;
		}
		
		this.counter++;
		
		var props = Circular.registry.get(node);
		
		if (context) {
			if (context != props.outercontext) {
				props.outercontext = context;
				props.flags.contextchanged=true;
			}
		} else {
			if (!props.outercontext) {
				props.outercontext = Circular.context.current;
			}
		}
		
		
		switch(node.nodeType) {
		
			case Node.ELEMENT_NODE:
			
				if (this.processElementNode(node,props)) {
					Circular.debug.write('Circular.engine.process','processed',Circular.registry.get(node));
				}

				break;
				
			case Node.TEXT_NODE:
			
				if (this.processTextNode(node,props)) {
					Circular.debug.write('Circular.engine.process','processed',node);
				}
				
				break;
				
			case Node.COMMENT_NODE:
			
				Circular.debug.write('Circular.engine.process ','ignoring comments '+node.nodeType);
				break;
				
			default:
			
				Circular.debug.write('Circular.engine.process ','ignoring node type '+node.nodeType);
		}
		
		
	},

	processElementNode				: function(node,props) {
		Circular.debug.write('Circular.engine.processElementNode');

		var newcontext = false;
		
		if (props.flags.contextchanged || props.flags.attrdomchanged || props.flags.attrdatachanged) {
		
			this.indexAttributes(node,props);
			
			if (props.attributes.length) {
			
				// evaluate and fill out attrs, execute modules
				// this will return false if one of the modules
				// return false to interrupt the cycle
				
				var recurse = this.processAttributesIn(node,props);
				
				var innercontext = Circular.context.get();
				if (props.innercontext!=innercontext) {
					newcontext = props.innercontext = innercontext;
				}
									
				if ( recurse &&  ( newcontext || props.flags.contentchanged ) ) {
					this.processChildren(node,newcontext);
				} 
				
				this.processAttributesOut(node,props);
				
				
				// store a clean result in the registry 
				Circular.registry.update(node,props);
				
				return true;
				
			} else {
				
				// after looking at the attributes,
				// there was nothing particular, but
				
				var innercontext = Circular.context.get();
				if (props.innercontext!=innercontext) {
					newcontext = props.innercontext = innercontext;
				}
				
				if (newcontext || props.flags.contentchanged) {
					
					this.processChildren(node,newcontext);
					
					// if this was already registered and it changed here,
					// remember that. otherwise, nothing much to remember
					
					if (props.flags.registered) {
						Circular.registry.update(node,props);
						return true;
					} else {
						return false;
					}
					
					
				} else {
					// no important attr, 
					// no new content, 
					// inner context didnt change
					// stop
					return false;
				}
					
			}
			
		} else {
		
			// the node didnt have any attributes. but
			var innercontext = Circular.context.get();
			if (props.innercontext!=innercontext) {
				newcontext = props.innercontext = innercontext;
			}
			
			if (newcontext || props.flags.contentchanged) {
				this.processChildren(node,newcontext);
				
				// if this was already registered and it changed here,
				// remember that. otherwise, nothing much to remember
				
				if (props.flags.registered) {
					Circular.registry.update(node,props);
					return true;
				} else {
					return false;
				}
				
			} else {
				// no attributes
				// no new content
				// inner context didnt change
				// stop
				return false;
			}
			
		}
		
	},
	
	indexAttributes	: function(node,props) {
		Circular.debug.write('Circular.engine.indexAttributes');
		
		// loop all the nodes attributes
		// see if they contain expression or 
		// if they are modules. other attributes
		// are ignored.

		// the order is important here. 
		// modules should go first, so there are
		// executed before normal attributes. also,
		// the mods need to be sorted in the
		// order they were created ..
		
		// if the node was registered in a previous
		// cycle, use the original values from there
		
		var regattrs = props.attributes;
		var attrs = [], plain = [], mods = [];
		
		for(var ac=0; ac<node.attributes.length;ac++) {
			var attr = null;
			var attrname = node.attributes[ac].name;
			
			// see if it was registered
			for (var ri=0;ri<regattrs.length;ri++) {
				if (regattrs[ri].name==attrname) {
					attr=regattrs[ri];
					break;
				}
			}
			
			// else, create a new property from this attribute
			if (!attr) attr = Circular.registry.newAttribute(attrname);
			
			var modidx = Circular.modules.attr2idx[attrname];
			if (modidx || modidx===0) {
				var modname = Circular.modules.stack[modidx].name;
				if (this.indexModuleAttribute(node,attr,modname)) {
					mods[modidx]=attr;
				}
			} else {
				if (this.indexAttribute(node,attr)) {
					plain.push(attr);
				}
			}
		}
		
		// stack these up in the right order:
		for (var idx in mods) attrs.push(mods[idx]);
		props.attributes = attrs.concat(plain);
		
		// map them by name - youll need it
		for (var idx in props.attributes) {
			props.name2attr[props.attributes[idx].name] = props.attributes[idx];
		}
	},
	

	indexModuleAttribute			: function(node,attr,modname) {
		Circular.debug.write('Circular.engine.indexModule',modname);
		
		
		if (this.indexAttribute(node,attr)) {
		
			attr.module=modname;
			return true;
			
		} else {
		
			// even if its not an expression, a module
			// is always registered for just being one. 
			
			if (!attr.registered) {
				var original 	= node.getAttribute(attr.name);
				attr.module 	= modname;
				attr.original = original;
				attr.result		= original;
				
			}
			return true;
			
		}
		
	},
	
	indexAttribute			: function(node,attr) {
		Circular.debug.write('Circular.engine.indexAttribute',attr.name);
		
		// check if the attribute is an expression
		// update the properties of attr, but
		// dont evaluate it yet - this will happen in
		// processAttributesIn
		
		// return true if it should be registered
		// false if it shouldnt
		
		if (attr.flags.attrdomchanged) {
		
			var expression = '', original = '';
			
			if (attr.name.indexOf('-debug')==-1) { // hm
			
				original = node.getAttribute(attr.name);
				
				// parse returns an expression without {{}},
				// or an empty string if there is no expression	
				
				if (expression = Circular.parser.parse(original,Circular.context.get())) {
					
					if (!attr.flags.registered) {
					
						// create a registry entry from scratch
						attr.original		= original;
						attr.expression	= expression;
						attr.paths 			= Circular.parser.getPaths(expression);
						
					} else {
						
						// the dom changed, so 
						// the expression probably changed
						
						if (attr.expression != expression) {
							attr.expression = expression;
							attr.paths 			= Circular.parser.getPaths(expression);
						}
						
					}
					
					if (Circular.debug.on) {
						if (attr.name.indexOf('cc-')==0) node.setAttribute('cc-'+attr.name.substring(3)+'-debug',attr.original);
						else node.setAttribute('cc-'+attr.name+'-debug',attr.original);
					}

					return true;
					
				} else {
				
					// so its not an expression (anymore)
					// ignore it or forget it
					
					if (Circular.debug.on) {
						if (attr.name.indexOf('cc-')==0) node.removeAttribute('cc-'+attr.name.substring(3)+'-debug');
						else node.removeAttribute('cc-'+attr.name+'-debug');
					}
					return false;

				}
			} else {
				// dont register debug attributes
				return false;
			}
		} else {
		
			// nothing changed, so do nothing,
			// but if it was registered, remember it
			return attr.flags.registered;
			
		}
		
	},
	
	processAttributesIn	: function(node,props) {
		Circular.debug.write('Circular.engine.processAttributesIn');
		// loop all attributes forward
		// evaluate optional expressions
		// if its a module, execute mod.in. 
		// if it returns false, break
		
		//console.log('processAttributesIn',node,attrs);
		
		for (dc=0; dc<props.attributes.length; dc++) {
		
			var attr = props.attributes[dc];
			
			if (attr.flags.attrdomchanged || attr.flags.attrdatachanged) {
				
				// (re-)eval this attribute, be it a full match
				// or  a string containing matches 
				
				var result = Circular.parser.eval(attr.expression);
				
				if (result!=attr.result) {
				
					attr.result = result;
					Circular.debug.write('Circular.engine.processAttributesIn','changed',attr.name,attr.expression,attr.result);
					try {
						if (result===undefined) attr.value = ''; 
						else attr.value = attr.result.toString();
					} catch (x) {
						attr.value = '';
						Circular.log.warn(x);
					}
					if (Circular.watchdog) {
						Circular.watchdog.pass(node,'attrdomchanged',attr.name);
					}
					node.setAttribute(attr.name,attr.value);
					//alert(attr.value);
				}
			}

			// even if it didnt change, you need to execute it
			// because it could change things for other attributes
			if (attr.module) {
				Circular.debug.write('Circular.engine.processAttributesIn','executing',attr.module);
				var mod = Circular.modules.stack[Circular.modules.name2idx[attr.module]];
				var func = mod.in;
				if (func) {
					var ok = func.call(mod,attr,node,props);
					if (ok===false) {
						attr.flags.breaking=true;
						break;
					} else {
						attr.flags.breaking=false;
					}
				}
			} 
				
		}
		
		// return true if none (or only the last one)
		// is breaking. returning false will stop
		// recursion down the node.
		return dc==props.attributes.length;
			
		
	},
	
	processAttributesOut	: function(node,props) {
		Circular.debug.write('Circular.engine.processAttributesOut');
		// loop all modules backwards
		// starting with the last break, if any
		for (var dc=0; dc<props.attributes.length; dc++) {
			if (props.attributes[dc].flags.breaking) {
				dc++;
				break;
			}
		}
		for (var dc=dc-1; dc>=0; dc--) {
			var attr = props.attributes[dc];
			if (attr.module) {
				Circular.debug.write('Circular.engine.processAttributesOut','executing',attr.module);
				var mod = Circular.modules.stack[Circular.modules.name2idx[attr.module]];
				var func = mod.out;
				if (func) {
					func.call(mod,attr,node,props);
				}
			}
		}
		
	},
	
	processChildren	: function(node,context) {
		Circular.debug.write('Circular.engine.processChildren');
		
		// traverse node depth first looking
		// for modules or expressions,
		// using the new context
		var contents = $(node).contents();
		$(contents).each(function() {
			Circular.engine.process(this,context);
		});
		
	},
	
	
	processTextNode	: function(node,props) {
		Circular.debug.write('Circular.engine.processTextNode');
		
		if (props.flags.contentchanged) {
		
			var val = node.textContent;
			var match, exec, nodes = [];
			if (matches = Circular.parser.match(val)) {
													
				if (matches.length==1) {
					// this is a full match
					//if (!node.parentNode.hasAttribute('cc-content')) {
					//	node.parentNode.setAttribute('cc-content',val);
					//	Circular.engine.queue(function() {
					//		Circular.registry.mark(node.parentNode,{flags:{attrdomchanged:true}});
					//		Circular.engine.process(node.parentNode);
					//	});
					//} else {
						Circular.debug.write('Circular.engine.processTextNode','replacing content with single span');
						var span = document.createElement('span');
						span.setAttribute('id','cc-'+this.genid++);
						span.setAttribute('cc-content',val);
						if (Circular.watchdog) {
							Circular.watchdog.pass(node.parentNode,'contentchanged');
						}
						node.parentNode.insertBefore(span, node);
						this.process(span,props.outercontext);
					//}
					if (Circular.watchdog) {
						Circular.watchdog.pass(node.parentNode,'contentchanged');
					}
					node.parentNode.removeChild(node);
					
				} else {
				
					// start splitting up nodes
					Circular.debug.write('replacing content with text and spans');
					
					var vals = Circular.parser.split(val);
					for (var vc=0; vc<vals.length;vc++) {
							if (vals[vc].expression) {
								Circular.debug.write('Circular.engine.processTextNode','inserting span '+vals[vc].expression);
								var span = document.createElement('span');
								span.setAttribute('id','cc-'+this.genid++);
								span.setAttribute('cc-content',vals[vc].expression);
								nodes.push(span);
							} else {
								Circular.debug.write('Circular.engine.processTextNode','inserting text '+vals[vc].text);
								nodes.push(document.createTextNode(vals[vc].text));
							}
					}
					
					for (var nc=0; nc < nodes.length; nc++) {
						if (Circular.watchdog) {
							Circular.watchdog.pass(node.parentNode,'contentchanged');
						}
						node.parentNode.insertBefore(nodes[nc], node);
						if (nodes[nc].nodeType==Node.ELEMENT_NODE) {
							this.process(nodes[nc],props.outercontext);
						}
					}
					if (Circular.watchdog) {
						Circular.watchdog.pass(node.parentNode,'contentchanged');
					}
					node.parentNode.removeChild(node);
					
				}
													
			} else {
				// this text does not contain expressions
			}
		} else {
			// this text hasnt changed
		}
	},
	
});
/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function(global) {
  'use strict';

  var testingExposeCycleCount = global.testingExposeCycleCount;

  // Detect and do basic sanity checking on Object/Array.observe.
  function detectObjectObserve() {
    if (typeof Object.observe !== 'function' ||
        typeof Array.observe !== 'function') {
      return false;
    }

    var records = [];

    function callback(recs) {
      records = recs;
    }

    var test = {};
    var arr = [];
    Object.observe(test, callback);
    Array.observe(arr, callback);
    test.id = 1;
    test.id = 2;
    delete test.id;
    arr.push(1, 2);
    arr.length = 0;

    Object.deliverChangeRecords(callback);
    if (records.length !== 5)
      return false;

    if (records[0].type != 'add' ||
        records[1].type != 'update' ||
        records[2].type != 'delete' ||
        records[3].type != 'splice' ||
        records[4].type != 'splice') {
      return false;
    }

    Object.unobserve(test, callback);
    Array.unobserve(arr, callback);

    return true;
  }

  var hasObserve = detectObjectObserve();

  function detectEval() {
    // Don't test for eval if we're running in a Chrome App environment.
    // We check for APIs set that only exist in a Chrome App context.
    if (typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime) {
      return false;
    }

    // Firefox OS Apps do not allow eval. This feature detection is very hacky
    // but even if some other platform adds support for this function this code
    // will continue to work.
    if (typeof navigator != 'undefined' && navigator.getDeviceStorage) {
      return false;
    }

    try {
      var f = new Function('', 'return true;');
      return f();
    } catch (ex) {
      return false;
    }
  }

  var hasEval = detectEval();

  function isIndex(s) {
    return +s === s >>> 0 && s !== '';
  }

  function toNumber(s) {
    return +s;
  }

  function isObject(obj) {
    return obj === Object(obj);
  }

  var numberIsNaN = global.Number.isNaN || function(value) {
    return typeof value === 'number' && global.isNaN(value);
  }

  function areSameValue(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    if (numberIsNaN(left) && numberIsNaN(right))
      return true;

    return left !== left && right !== right;
  }

  var createObject = ('__proto__' in {}) ?
    function(obj) { return obj; } :
    function(obj) {
      var proto = obj.__proto__;
      if (!proto)
        return obj;
      var newObject = Object.create(proto);
      Object.getOwnPropertyNames(obj).forEach(function(name) {
        Object.defineProperty(newObject, name,
                             Object.getOwnPropertyDescriptor(obj, name));
      });
      return newObject;
    };

  var identStart = '[\$_a-zA-Z]';
  var identPart = '[\$_a-zA-Z0-9]';
  var identRegExp = new RegExp('^' + identStart + '+' + identPart + '*' + '$');

  function getPathCharType(char) {
    if (char === undefined)
      return 'eof';

    var code = char.charCodeAt(0);

    switch(code) {
      case 0x5B: // [
      case 0x5D: // ]
      case 0x2E: // .
      case 0x22: // "
      case 0x27: // '
      case 0x30: // 0
        return char;

      case 0x5F: // _
      case 0x24: // $
        return 'ident';

      case 0x20: // Space
      case 0x09: // Tab
      case 0x0A: // Newline
      case 0x0D: // Return
      case 0xA0:  // No-break space
      case 0xFEFF:  // Byte Order Mark
      case 0x2028:  // Line Separator
      case 0x2029:  // Paragraph Separator
        return 'ws';
    }

    // a-z, A-Z
    if ((0x61 <= code && code <= 0x7A) || (0x41 <= code && code <= 0x5A))
      return 'ident';

    // 1-9
    if (0x31 <= code && code <= 0x39)
      return 'number';

    return 'else';
  }

  var pathStateMachine = {
    'beforePath': {
      'ws': ['beforePath'],
      'ident': ['inIdent', 'append'],
      '[': ['beforeElement'],
      'eof': ['afterPath']
    },

    'inPath': {
      'ws': ['inPath'],
      '.': ['beforeIdent'],
      '[': ['beforeElement'],
      'eof': ['afterPath']
    },

    'beforeIdent': {
      'ws': ['beforeIdent'],
      'ident': ['inIdent', 'append']
    },

    'inIdent': {
      'ident': ['inIdent', 'append'],
      '0': ['inIdent', 'append'],
      'number': ['inIdent', 'append'],
      'ws': ['inPath', 'push'],
      '.': ['beforeIdent', 'push'],
      '[': ['beforeElement', 'push'],
      'eof': ['afterPath', 'push']
    },

    'beforeElement': {
      'ws': ['beforeElement'],
      '0': ['afterZero', 'append'],
      'number': ['inIndex', 'append'],
      "'": ['inSingleQuote', 'append', ''],
      '"': ['inDoubleQuote', 'append', '']
    },

    'afterZero': {
      'ws': ['afterElement', 'push'],
      ']': ['inPath', 'push']
    },

    'inIndex': {
      '0': ['inIndex', 'append'],
      'number': ['inIndex', 'append'],
      'ws': ['afterElement'],
      ']': ['inPath', 'push']
    },

    'inSingleQuote': {
      "'": ['afterElement'],
      'eof': ['error'],
      'else': ['inSingleQuote', 'append']
    },

    'inDoubleQuote': {
      '"': ['afterElement'],
      'eof': ['error'],
      'else': ['inDoubleQuote', 'append']
    },

    'afterElement': {
      'ws': ['afterElement'],
      ']': ['inPath', 'push']
    }
  }

  function noop() {}

  function parsePath(path) {
    var keys = [];
    var index = -1;
    var c, newChar, key, type, transition, action, typeMap, mode = 'beforePath';

    var actions = {
      push: function() {
        if (key === undefined)
          return;

        keys.push(key);
        key = undefined;
      },

      append: function() {
        if (key === undefined)
          key = newChar
        else
          key += newChar;
      }
    };

    function maybeUnescapeQuote() {
      if (index >= path.length)
        return;

      var nextChar = path[index + 1];
      if ((mode == 'inSingleQuote' && nextChar == "'") ||
          (mode == 'inDoubleQuote' && nextChar == '"')) {
        index++;
        newChar = nextChar;
        actions.append();
        return true;
      }
    }

    while (mode) {
      index++;
      c = path[index];

      if (c == '\\' && maybeUnescapeQuote(mode))
        continue;

      type = getPathCharType(c);
      typeMap = pathStateMachine[mode];
      transition = typeMap[type] || typeMap['else'] || 'error';

      if (transition == 'error')
        return; // parse error;

      mode = transition[0];
      action = actions[transition[1]] || noop;
      newChar = transition[2] === undefined ? c : transition[2];
      action();

      if (mode === 'afterPath') {
        return keys;
      }
    }

    return; // parse error
  }

  function isIdent(s) {
    return identRegExp.test(s);
  }

  var constructorIsPrivate = {};

  function Path(parts, privateToken) {
    if (privateToken !== constructorIsPrivate)
      throw Error('Use Path.get to retrieve path objects');

    for (var i = 0; i < parts.length; i++) {
      this.push(String(parts[i]));
    }

    if (hasEval && this.length) {
      this.getValueFrom = this.compiledGetValueFromFn();
    }
  }

  // TODO(rafaelw): Make simple LRU cache
  var pathCache = {};

  function getPath(pathString) {
    if (pathString instanceof Path)
      return pathString;

    if (pathString == null || pathString.length == 0)
      pathString = '';

    if (typeof pathString != 'string') {
      if (isIndex(pathString.length)) {
        // Constructed with array-like (pre-parsed) keys
        return new Path(pathString, constructorIsPrivate);
      }

      pathString = String(pathString);
    }

    var path = pathCache[pathString];
    if (path)
      return path;

    var parts = parsePath(pathString);
    if (!parts)
      return invalidPath;

    var path = new Path(parts, constructorIsPrivate);
    pathCache[pathString] = path;
    return path;
  }

  Path.get = getPath;

  function formatAccessor(key) {
    if (isIndex(key)) {
      return '[' + key + ']';
    } else {
      return '["' + key.replace(/"/g, '\\"') + '"]';
    }
  }

  Path.prototype = createObject({
    __proto__: [],
    valid: true,

    toString: function() {
      var pathString = '';
      for (var i = 0; i < this.length; i++) {
        var key = this[i];
        if (isIdent(key)) {
          pathString += i ? '.' + key : key;
        } else {
          pathString += formatAccessor(key);
        }
      }

      return pathString;
    },

    getValueFrom: function(obj, directObserver) {
      for (var i = 0; i < this.length; i++) {
        if (obj == null)
          return;
        obj = obj[this[i]];
      }
      return obj;
    },

    iterateObjects: function(obj, observe) {
      for (var i = 0; i < this.length; i++) {
        if (i)
          obj = obj[this[i - 1]];
        if (!isObject(obj))
          return;
        observe(obj, this[i]);
      }
    },

    compiledGetValueFromFn: function() {
      var str = '';
      var pathString = 'obj';
      str += 'if (obj != null';
      var i = 0;
      var key;
      for (; i < (this.length - 1); i++) {
        key = this[i];
        pathString += isIdent(key) ? '.' + key : formatAccessor(key);
        str += ' &&\n     ' + pathString + ' != null';
      }
      str += ')\n';

      var key = this[i];
      pathString += isIdent(key) ? '.' + key : formatAccessor(key);

      str += '  return ' + pathString + ';\nelse\n  return undefined;';
      return new Function('obj', str);
    },

    setValueFrom: function(obj, value) {
      if (!this.length)
        return false;

      for (var i = 0; i < this.length - 1; i++) {
        if (!isObject(obj))
          return false;
        obj = obj[this[i]];
      }

      if (!isObject(obj))
        return false;

      obj[this[i]] = value;
      return true;
    }
  });

  var invalidPath = new Path('', constructorIsPrivate);
  invalidPath.valid = false;
  invalidPath.getValueFrom = invalidPath.setValueFrom = function() {};

  var MAX_DIRTY_CHECK_CYCLES = 1000;

  function dirtyCheck(observer) {
    var cycles = 0;
    while (cycles < MAX_DIRTY_CHECK_CYCLES && observer.check_()) {
      cycles++;
    }
    if (testingExposeCycleCount)
      global.dirtyCheckCycleCount = cycles;

    return cycles > 0;
  }

  function objectIsEmpty(object) {
    for (var prop in object)
      return false;
    return true;
  }

  function diffIsEmpty(diff) {
    return objectIsEmpty(diff.added) &&
           objectIsEmpty(diff.removed) &&
           objectIsEmpty(diff.changed);
  }

  function diffObjectFromOldObject(object, oldObject) {
    var added = {};
    var removed = {};
    var changed = {};

    for (var prop in oldObject) {
      var newValue = object[prop];

      if (newValue !== undefined && newValue === oldObject[prop])
        continue;

      if (!(prop in object)) {
        removed[prop] = undefined;
        continue;
      }

      if (newValue !== oldObject[prop])
        changed[prop] = newValue;
    }

    for (var prop in object) {
      if (prop in oldObject)
        continue;

      added[prop] = object[prop];
    }

    if (Array.isArray(object) && object.length !== oldObject.length)
      changed.length = object.length;

    return {
      added: added,
      removed: removed,
      changed: changed
    };
  }

  var eomTasks = [];
  function runEOMTasks() {
    if (!eomTasks.length)
      return false;

    for (var i = 0; i < eomTasks.length; i++) {
      eomTasks[i]();
    }
    eomTasks.length = 0;
    return true;
  }

  var runEOM = hasObserve ? (function(){
    return function(fn) {
      return Promise.resolve().then(fn);
    }
  })() :
  (function() {
    return function(fn) {
      eomTasks.push(fn);
    };
  })();

  var observedObjectCache = [];

  function newObservedObject() {
    var observer;
    var object;
    var discardRecords = false;
    var first = true;

    function callback(records) {
      if (observer && observer.state_ === OPENED && !discardRecords)
        observer.check_(records);
    }

    return {
      open: function(obs) {
        if (observer)
          throw Error('ObservedObject in use');

        if (!first)
          Object.deliverChangeRecords(callback);

        observer = obs;
        first = false;
      },
      observe: function(obj, arrayObserve) {
        object = obj;
        if (arrayObserve)
          Array.observe(object, callback);
        else
          Object.observe(object, callback);
      },
      deliver: function(discard) {
        discardRecords = discard;
        Object.deliverChangeRecords(callback);
        discardRecords = false;
      },
      close: function() {
        observer = undefined;
        Object.unobserve(object, callback);
        observedObjectCache.push(this);
      }
    };
  }

  /*
   * The observedSet abstraction is a perf optimization which reduces the total
   * number of Object.observe observations of a set of objects. The idea is that
   * groups of Observers will have some object dependencies in common and this
   * observed set ensures that each object in the transitive closure of
   * dependencies is only observed once. The observedSet acts as a write barrier
   * such that whenever any change comes through, all Observers are checked for
   * changed values.
   *
   * Note that this optimization is explicitly moving work from setup-time to
   * change-time.
   *
   * TODO(rafaelw): Implement "garbage collection". In order to move work off
   * the critical path, when Observers are closed, their observed objects are
   * not Object.unobserve(d). As a result, it's possible that if the observedSet
   * is kept open, but some Observers have been closed, it could cause "leaks"
   * (prevent otherwise collectable objects from being collected). At some
   * point, we should implement incremental "gc" which keeps a list of
   * observedSets which may need clean-up and does small amounts of cleanup on a
   * timeout until all is clean.
   */

  function getObservedObject(observer, object, arrayObserve) {
    var dir = observedObjectCache.pop() || newObservedObject();
    dir.open(observer);
    dir.observe(object, arrayObserve);
    return dir;
  }

  var observedSetCache = [];

  function newObservedSet() {
    var observerCount = 0;
    var observers = [];
    var objects = [];
    var rootObj;
    var rootObjProps;

    function observe(obj, prop) {
      if (!obj)
        return;

      if (obj === rootObj)
        rootObjProps[prop] = true;

      if (objects.indexOf(obj) < 0) {
        objects.push(obj);
        Object.observe(obj, callback);
      }

      observe(Object.getPrototypeOf(obj), prop);
    }

    function allRootObjNonObservedProps(recs) {
      for (var i = 0; i < recs.length; i++) {
        var rec = recs[i];
        if (rec.object !== rootObj ||
            rootObjProps[rec.name] ||
            rec.type === 'setPrototype') {
          return false;
        }
      }
      return true;
    }

    function callback(recs) {
      if (allRootObjNonObservedProps(recs))
        return;

      var observer;
      for (var i = 0; i < observers.length; i++) {
        observer = observers[i];
        if (observer.state_ == OPENED) {
          observer.iterateObjects_(observe);
        }
      }

      for (var i = 0; i < observers.length; i++) {
        observer = observers[i];
        if (observer.state_ == OPENED) {
          observer.check_();
        }
      }
    }

    var record = {
      objects: objects,
      get rootObject() { return rootObj; },
      set rootObject(value) {
        rootObj = value;
        rootObjProps = {};
      },
      open: function(obs, object) {
        observers.push(obs);
        observerCount++;
        obs.iterateObjects_(observe);
      },
      close: function(obs) {
        observerCount--;
        if (observerCount > 0) {
          return;
        }

        for (var i = 0; i < objects.length; i++) {
          Object.unobserve(objects[i], callback);
          Observer.unobservedCount++;
        }

        observers.length = 0;
        objects.length = 0;
        rootObj = undefined;
        rootObjProps = undefined;
        observedSetCache.push(this);
        if (lastObservedSet === this)
          lastObservedSet = null;
      },
    };

    return record;
  }

  var lastObservedSet;

  function getObservedSet(observer, obj) {
    if (!lastObservedSet || lastObservedSet.rootObject !== obj) {
      lastObservedSet = observedSetCache.pop() || newObservedSet();
      lastObservedSet.rootObject = obj;
    }
    lastObservedSet.open(observer, obj);
    return lastObservedSet;
  }

  var UNOPENED = 0;
  var OPENED = 1;
  var CLOSED = 2;
  var RESETTING = 3;

  var nextObserverId = 1;

  function Observer() {
    this.state_ = UNOPENED;
    this.callback_ = undefined;
    this.target_ = undefined; // TODO(rafaelw): Should be WeakRef
    this.directObserver_ = undefined;
    this.value_ = undefined;
    this.id_ = nextObserverId++;
  }

  Observer.prototype = {
    open: function(callback, target) {
      if (this.state_ != UNOPENED)
        throw Error('Observer has already been opened.');

      addToAll(this);
      this.callback_ = callback;
      this.target_ = target;
      this.connect_();
      this.state_ = OPENED;
      return this.value_;
    },

    close: function() {
      if (this.state_ != OPENED)
        return;

      removeFromAll(this);
      this.disconnect_();
      this.value_ = undefined;
      this.callback_ = undefined;
      this.target_ = undefined;
      this.state_ = CLOSED;
    },

    deliver: function() {
      if (this.state_ != OPENED)
        return;

      dirtyCheck(this);
    },

    report_: function(changes) {
      try {
        this.callback_.apply(this.target_, changes);
      } catch (ex) {
        Observer._errorThrownDuringCallback = true;
        console.error('Exception caught during observer callback: ' +
                       (ex.stack || ex));
      }
    },

    discardChanges: function() {
      this.check_(undefined, true);
      return this.value_;
    }
  }

  var collectObservers = !hasObserve;
  var allObservers;
  Observer._allObserversCount = 0;

  if (collectObservers) {
    allObservers = [];
  }

  function addToAll(observer) {
    Observer._allObserversCount++;
    if (!collectObservers)
      return;

    allObservers.push(observer);
  }

  function removeFromAll(observer) {
    Observer._allObserversCount--;
  }

  var runningMicrotaskCheckpoint = false;

  global.Platform = global.Platform || {};

  global.Platform.performMicrotaskCheckpoint = function() {
    if (runningMicrotaskCheckpoint)
      return;

    if (!collectObservers)
      return;

    runningMicrotaskCheckpoint = true;

    var cycles = 0;
    var anyChanged, toCheck;

    do {
      cycles++;
      toCheck = allObservers;
      allObservers = [];
      anyChanged = false;

      for (var i = 0; i < toCheck.length; i++) {
        var observer = toCheck[i];
        if (observer.state_ != OPENED)
          continue;

        if (observer.check_())
          anyChanged = true;

        allObservers.push(observer);
      }
      if (runEOMTasks())
        anyChanged = true;
    } while (cycles < MAX_DIRTY_CHECK_CYCLES && anyChanged);

    if (testingExposeCycleCount)
      global.dirtyCheckCycleCount = cycles;

    runningMicrotaskCheckpoint = false;
  };

  if (collectObservers) {
    global.Platform.clearObservers = function() {
      allObservers = [];
    };
  }

  function ObjectObserver(object) {
    Observer.call(this);
    this.value_ = object;
    this.oldObject_ = undefined;
  }

  ObjectObserver.prototype = createObject({
    __proto__: Observer.prototype,

    arrayObserve: false,

    connect_: function(callback, target) {
      if (hasObserve) {
        this.directObserver_ = getObservedObject(this, this.value_,
                                                 this.arrayObserve);
      } else {
        this.oldObject_ = this.copyObject(this.value_);
      }

    },

    copyObject: function(object) {
      var copy = Array.isArray(object) ? [] : {};
      for (var prop in object) {
        copy[prop] = object[prop];
      };
      if (Array.isArray(object))
        copy.length = object.length;
      return copy;
    },

    check_: function(changeRecords, skipChanges) {
      var diff;
      var oldValues;
      if (hasObserve) {
        if (!changeRecords)
          return false;

        oldValues = {};
        diff = diffObjectFromChangeRecords(this.value_, changeRecords,
                                           oldValues);
      } else {
        oldValues = this.oldObject_;
        diff = diffObjectFromOldObject(this.value_, this.oldObject_);
      }

      if (diffIsEmpty(diff))
        return false;

      if (!hasObserve)
        this.oldObject_ = this.copyObject(this.value_);

      this.report_([
        diff.added || {},
        diff.removed || {},
        diff.changed || {},
        function(property) {
          return oldValues[property];
        }
      ]);

      return true;
    },

    disconnect_: function() {
      if (hasObserve) {
        this.directObserver_.close();
        this.directObserver_ = undefined;
      } else {
        this.oldObject_ = undefined;
      }
    },

    deliver: function() {
      if (this.state_ != OPENED)
        return;

      if (hasObserve)
        this.directObserver_.deliver(false);
      else
        dirtyCheck(this);
    },

    discardChanges: function() {
      if (this.directObserver_)
        this.directObserver_.deliver(true);
      else
        this.oldObject_ = this.copyObject(this.value_);

      return this.value_;
    }
  });

  function ArrayObserver(array) {
    if (!Array.isArray(array))
      throw Error('Provided object is not an Array');
    ObjectObserver.call(this, array);
  }

  ArrayObserver.prototype = createObject({

    __proto__: ObjectObserver.prototype,

    arrayObserve: true,

    copyObject: function(arr) {
      return arr.slice();
    },

    check_: function(changeRecords) {
      var splices;
      if (hasObserve) {
        if (!changeRecords)
          return false;
        splices = projectArraySplices(this.value_, changeRecords);
      } else {
        splices = calcSplices(this.value_, 0, this.value_.length,
                              this.oldObject_, 0, this.oldObject_.length);
      }

      if (!splices || !splices.length)
        return false;

      if (!hasObserve)
        this.oldObject_ = this.copyObject(this.value_);

      this.report_([splices]);
      return true;
    }
  });

  ArrayObserver.applySplices = function(previous, current, splices) {
    splices.forEach(function(splice) {
      var spliceArgs = [splice.index, splice.removed.length];
      var addIndex = splice.index;
      while (addIndex < splice.index + splice.addedCount) {
        spliceArgs.push(current[addIndex]);
        addIndex++;
      }

      Array.prototype.splice.apply(previous, spliceArgs);
    });
  };

  function PathObserver(object, path) {
    Observer.call(this);

    this.object_ = object;
    this.path_ = getPath(path);
    this.directObserver_ = undefined;
  }

  PathObserver.prototype = createObject({
    __proto__: Observer.prototype,

    get path() {
      return this.path_;
    },

    connect_: function() {
      if (hasObserve)
        this.directObserver_ = getObservedSet(this, this.object_);

      this.check_(undefined, true);
    },

    disconnect_: function() {
      this.value_ = undefined;

      if (this.directObserver_) {
        this.directObserver_.close(this);
        this.directObserver_ = undefined;
      }
    },

    iterateObjects_: function(observe) {
      this.path_.iterateObjects(this.object_, observe);
    },

    check_: function(changeRecords, skipChanges) {
      var oldValue = this.value_;
      this.value_ = this.path_.getValueFrom(this.object_);
      if (skipChanges || areSameValue(this.value_, oldValue))
        return false;

      this.report_([this.value_, oldValue, this]);
      return true;
    },

    setValue: function(newValue) {
      if (this.path_)
        this.path_.setValueFrom(this.object_, newValue);
    }
  });

  function CompoundObserver(reportChangesOnOpen) {
    Observer.call(this);

    this.reportChangesOnOpen_ = reportChangesOnOpen;
    this.value_ = [];
    this.directObserver_ = undefined;
    this.observed_ = [];
  }

  var observerSentinel = {};

  CompoundObserver.prototype = createObject({
    __proto__: Observer.prototype,

    connect_: function() {
      if (hasObserve) {
        var object;
        var needsDirectObserver = false;
        for (var i = 0; i < this.observed_.length; i += 2) {
          object = this.observed_[i]
          if (object !== observerSentinel) {
            needsDirectObserver = true;
            break;
          }
        }

        if (needsDirectObserver)
          this.directObserver_ = getObservedSet(this, object);
      }

      this.check_(undefined, !this.reportChangesOnOpen_);
    },

    disconnect_: function() {
      for (var i = 0; i < this.observed_.length; i += 2) {
        if (this.observed_[i] === observerSentinel)
          this.observed_[i + 1].close();
      }
      this.observed_.length = 0;
      this.value_.length = 0;

      if (this.directObserver_) {
        this.directObserver_.close(this);
        this.directObserver_ = undefined;
      }
    },

    addPath: function(object, path) {
      if (this.state_ != UNOPENED && this.state_ != RESETTING)
        throw Error('Cannot add paths once started.');

      var path = getPath(path);
      this.observed_.push(object, path);
      if (!this.reportChangesOnOpen_)
        return;
      var index = this.observed_.length / 2 - 1;
      this.value_[index] = path.getValueFrom(object);
    },

    addObserver: function(observer) {
      if (this.state_ != UNOPENED && this.state_ != RESETTING)
        throw Error('Cannot add observers once started.');

      this.observed_.push(observerSentinel, observer);
      if (!this.reportChangesOnOpen_)
        return;
      var index = this.observed_.length / 2 - 1;
      this.value_[index] = observer.open(this.deliver, this);
    },

    startReset: function() {
      if (this.state_ != OPENED)
        throw Error('Can only reset while open');

      this.state_ = RESETTING;
      this.disconnect_();
    },

    finishReset: function() {
      if (this.state_ != RESETTING)
        throw Error('Can only finishReset after startReset');
      this.state_ = OPENED;
      this.connect_();

      return this.value_;
    },

    iterateObjects_: function(observe) {
      var object;
      for (var i = 0; i < this.observed_.length; i += 2) {
        object = this.observed_[i]
        if (object !== observerSentinel)
          this.observed_[i + 1].iterateObjects(object, observe)
      }
    },

    check_: function(changeRecords, skipChanges) {
      var oldValues;
      for (var i = 0; i < this.observed_.length; i += 2) {
        var object = this.observed_[i];
        var path = this.observed_[i+1];
        var value;
        if (object === observerSentinel) {
          var observable = path;
          value = this.state_ === UNOPENED ?
              observable.open(this.deliver, this) :
              observable.discardChanges();
        } else {
          value = path.getValueFrom(object);
        }

        if (skipChanges) {
          this.value_[i / 2] = value;
          continue;
        }

        if (areSameValue(value, this.value_[i / 2]))
          continue;

        oldValues = oldValues || [];
        oldValues[i / 2] = this.value_[i / 2];
        this.value_[i / 2] = value;
      }

      if (!oldValues)
        return false;

      // TODO(rafaelw): Having observed_ as the third callback arg here is
      // pretty lame API. Fix.
      this.report_([this.value_, oldValues, this.observed_]);
      return true;
    }
  });

  function identFn(value) { return value; }

  function ObserverTransform(observable, getValueFn, setValueFn,
                             dontPassThroughSet) {
    this.callback_ = undefined;
    this.target_ = undefined;
    this.value_ = undefined;
    this.observable_ = observable;
    this.getValueFn_ = getValueFn || identFn;
    this.setValueFn_ = setValueFn || identFn;
    // TODO(rafaelw): This is a temporary hack. PolymerExpressions needs this
    // at the moment because of a bug in it's dependency tracking.
    this.dontPassThroughSet_ = dontPassThroughSet;
  }

  ObserverTransform.prototype = {
    open: function(callback, target) {
      this.callback_ = callback;
      this.target_ = target;
      this.value_ =
          this.getValueFn_(this.observable_.open(this.observedCallback_, this));
      return this.value_;
    },

    observedCallback_: function(value) {
      value = this.getValueFn_(value);
      if (areSameValue(value, this.value_))
        return;
      var oldValue = this.value_;
      this.value_ = value;
      this.callback_.call(this.target_, this.value_, oldValue);
    },

    discardChanges: function() {
      this.value_ = this.getValueFn_(this.observable_.discardChanges());
      return this.value_;
    },

    deliver: function() {
      return this.observable_.deliver();
    },

    setValue: function(value) {
      value = this.setValueFn_(value);
      if (!this.dontPassThroughSet_ && this.observable_.setValue)
        return this.observable_.setValue(value);
    },

    close: function() {
      if (this.observable_)
        this.observable_.close();
      this.callback_ = undefined;
      this.target_ = undefined;
      this.observable_ = undefined;
      this.value_ = undefined;
      this.getValueFn_ = undefined;
      this.setValueFn_ = undefined;
    }
  }

  var expectedRecordTypes = {
    add: true,
    update: true,
    delete: true
  };

  function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
    var added = {};
    var removed = {};

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      if (!expectedRecordTypes[record.type]) {
        console.error('Unknown changeRecord type: ' + record.type);
        console.error(record);
        continue;
      }

      if (!(record.name in oldValues))
        oldValues[record.name] = record.oldValue;

      if (record.type == 'update')
        continue;

      if (record.type == 'add') {
        if (record.name in removed)
          delete removed[record.name];
        else
          added[record.name] = true;

        continue;
      }

      // type = 'delete'
      if (record.name in added) {
        delete added[record.name];
        delete oldValues[record.name];
      } else {
        removed[record.name] = true;
      }
    }

    for (var prop in added)
      added[prop] = object[prop];

    for (var prop in removed)
      removed[prop] = undefined;

    var changed = {};
    for (var prop in oldValues) {
      if (prop in added || prop in removed)
        continue;

      var newValue = object[prop];
      if (oldValues[prop] !== newValue)
        changed[prop] = newValue;
    }

    return {
      added: added,
      removed: removed,
      changed: changed
    };
  }

  function newSplice(index, removed, addedCount) {
    return {
      index: index,
      removed: removed,
      addedCount: addedCount
    };
  }

  var EDIT_LEAVE = 0;
  var EDIT_UPDATE = 1;
  var EDIT_ADD = 2;
  var EDIT_DELETE = 3;

  function ArraySplice() {}

  ArraySplice.prototype = {

    // Note: This function is *based* on the computation of the Levenshtein
    // "edit" distance. The one change is that "updates" are treated as two
    // edits - not one. With Array splices, an update is really a delete
    // followed by an add. By retaining this, we optimize for "keeping" the
    // maximum array items in the original array. For example:
    //
    //   'xxxx123' -> '123yyyy'
    //
    // With 1-edit updates, the shortest path would be just to update all seven
    // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
    // leaves the substring '123' intact.
    calcEditDistances: function(current, currentStart, currentEnd,
                                old, oldStart, oldEnd) {
      // "Deletion" columns
      var rowCount = oldEnd - oldStart + 1;
      var columnCount = currentEnd - currentStart + 1;
      var distances = new Array(rowCount);

      // "Addition" rows. Initialize null column.
      for (var i = 0; i < rowCount; i++) {
        distances[i] = new Array(columnCount);
        distances[i][0] = i;
      }

      // Initialize null row
      for (var j = 0; j < columnCount; j++)
        distances[0][j] = j;

      for (var i = 1; i < rowCount; i++) {
        for (var j = 1; j < columnCount; j++) {
          if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
            distances[i][j] = distances[i - 1][j - 1];
          else {
            var north = distances[i - 1][j] + 1;
            var west = distances[i][j - 1] + 1;
            distances[i][j] = north < west ? north : west;
          }
        }
      }

      return distances;
    },

    // This starts at the final weight, and walks "backward" by finding
    // the minimum previous weight recursively until the origin of the weight
    // matrix.
    spliceOperationsFromEditDistances: function(distances) {
      var i = distances.length - 1;
      var j = distances[0].length - 1;
      var current = distances[i][j];
      var edits = [];
      while (i > 0 || j > 0) {
        if (i == 0) {
          edits.push(EDIT_ADD);
          j--;
          continue;
        }
        if (j == 0) {
          edits.push(EDIT_DELETE);
          i--;
          continue;
        }
        var northWest = distances[i - 1][j - 1];
        var west = distances[i - 1][j];
        var north = distances[i][j - 1];

        var min;
        if (west < north)
          min = west < northWest ? west : northWest;
        else
          min = north < northWest ? north : northWest;

        if (min == northWest) {
          if (northWest == current) {
            edits.push(EDIT_LEAVE);
          } else {
            edits.push(EDIT_UPDATE);
            current = northWest;
          }
          i--;
          j--;
        } else if (min == west) {
          edits.push(EDIT_DELETE);
          i--;
          current = west;
        } else {
          edits.push(EDIT_ADD);
          j--;
          current = north;
        }
      }

      edits.reverse();
      return edits;
    },

    /**
     * Splice Projection functions:
     *
     * A splice map is a representation of how a previous array of items
     * was transformed into a new array of items. Conceptually it is a list of
     * tuples of
     *
     *   <index, removed, addedCount>
     *
     * which are kept in ascending index order of. The tuple represents that at
     * the |index|, |removed| sequence of items were removed, and counting forward
     * from |index|, |addedCount| items were added.
     */

    /**
     * Lacking individual splice mutation information, the minimal set of
     * splices can be synthesized given the previous state and final state of an
     * array. The basic approach is to calculate the edit distance matrix and
     * choose the shortest path through it.
     *
     * Complexity: O(l * p)
     *   l: The length of the current array
     *   p: The length of the old array
     */
    calcSplices: function(current, currentStart, currentEnd,
                          old, oldStart, oldEnd) {
      var prefixCount = 0;
      var suffixCount = 0;

      var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
      if (currentStart == 0 && oldStart == 0)
        prefixCount = this.sharedPrefix(current, old, minLength);

      if (currentEnd == current.length && oldEnd == old.length)
        suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

      currentStart += prefixCount;
      oldStart += prefixCount;
      currentEnd -= suffixCount;
      oldEnd -= suffixCount;

      if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
        return [];

      if (currentStart == currentEnd) {
        var splice = newSplice(currentStart, [], 0);
        while (oldStart < oldEnd)
          splice.removed.push(old[oldStart++]);

        return [ splice ];
      } else if (oldStart == oldEnd)
        return [ newSplice(currentStart, [], currentEnd - currentStart) ];

      var ops = this.spliceOperationsFromEditDistances(
          this.calcEditDistances(current, currentStart, currentEnd,
                                 old, oldStart, oldEnd));

      var splice = undefined;
      var splices = [];
      var index = currentStart;
      var oldIndex = oldStart;
      for (var i = 0; i < ops.length; i++) {
        switch(ops[i]) {
          case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }

            index++;
            oldIndex++;
            break;
          case EDIT_UPDATE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          case EDIT_ADD:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;
            break;
          case EDIT_DELETE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
        }
      }

      if (splice) {
        splices.push(splice);
      }
      return splices;
    },

    sharedPrefix: function(current, old, searchLength) {
      for (var i = 0; i < searchLength; i++)
        if (!this.equals(current[i], old[i]))
          return i;
      return searchLength;
    },

    sharedSuffix: function(current, old, searchLength) {
      var index1 = current.length;
      var index2 = old.length;
      var count = 0;
      while (count < searchLength && this.equals(current[--index1], old[--index2]))
        count++;

      return count;
    },

    calculateSplices: function(current, previous) {
      return this.calcSplices(current, 0, current.length, previous, 0,
                              previous.length);
    },

    equals: function(currentValue, previousValue) {
      return currentValue === previousValue;
    }
  };

  var arraySplice = new ArraySplice();

  function calcSplices(current, currentStart, currentEnd,
                       old, oldStart, oldEnd) {
    return arraySplice.calcSplices(current, currentStart, currentEnd,
                                   old, oldStart, oldEnd);
  }

  function intersect(start1, end1, start2, end2) {
    // Disjoint
    if (end1 < start2 || end2 < start1)
      return -1;

    // Adjacent
    if (end1 == start2 || end2 == start1)
      return 0;

    // Non-zero intersect, span1 first
    if (start1 < start2) {
      if (end1 < end2)
        return end1 - start2; // Overlap
      else
        return end2 - start2; // Contained
    } else {
      // Non-zero intersect, span2 first
      if (end2 < end1)
        return end2 - start1; // Overlap
      else
        return end1 - start1; // Contained
    }
  }

  function mergeSplice(splices, index, removed, addedCount) {

    var splice = newSplice(index, removed, addedCount);

    var inserted = false;
    var insertionOffset = 0;

    for (var i = 0; i < splices.length; i++) {
      var current = splices[i];
      current.index += insertionOffset;

      if (inserted)
        continue;

      var intersectCount = intersect(splice.index,
                                     splice.index + splice.removed.length,
                                     current.index,
                                     current.index + current.addedCount);

      if (intersectCount >= 0) {
        // Merge the two splices

        splices.splice(i, 1);
        i--;

        insertionOffset -= current.addedCount - current.removed.length;

        splice.addedCount += current.addedCount - intersectCount;
        var deleteCount = splice.removed.length +
                          current.removed.length - intersectCount;

        if (!splice.addedCount && !deleteCount) {
          // merged splice is a noop. discard.
          inserted = true;
        } else {
          var removed = current.removed;

          if (splice.index < current.index) {
            // some prefix of splice.removed is prepended to current.removed.
            var prepend = splice.removed.slice(0, current.index - splice.index);
            Array.prototype.push.apply(prepend, removed);
            removed = prepend;
          }

          if (splice.index + splice.removed.length > current.index + current.addedCount) {
            // some suffix of splice.removed is appended to current.removed.
            var append = splice.removed.slice(current.index + current.addedCount - splice.index);
            Array.prototype.push.apply(removed, append);
          }

          splice.removed = removed;
          if (current.index < splice.index) {
            splice.index = current.index;
          }
        }
      } else if (splice.index < current.index) {
        // Insert splice here.

        inserted = true;

        splices.splice(i, 0, splice);
        i++;

        var offset = splice.addedCount - splice.removed.length
        current.index += offset;
        insertionOffset += offset;
      }
    }

    if (!inserted)
      splices.push(splice);
  }

  function createInitialSplices(array, changeRecords) {
    var splices = [];

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      switch(record.type) {
        case 'splice':
          mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
          break;
        case 'add':
        case 'update':
        case 'delete':
          if (!isIndex(record.name))
            continue;
          var index = toNumber(record.name);
          if (index < 0)
            continue;
          mergeSplice(splices, index, [record.oldValue], 1);
          break;
        default:
          console.error('Unexpected record type: ' + JSON.stringify(record));
          break;
      }
    }

    return splices;
  }

  function projectArraySplices(array, changeRecords) {
    var splices = [];

    createInitialSplices(array, changeRecords).forEach(function(splice) {
      if (splice.addedCount == 1 && splice.removed.length == 1) {
        if (splice.removed[0] !== array[splice.index])
          splices.push(splice);

        return
      };

      splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
                                           splice.removed, 0, splice.removed.length));
    });

    return splices;
  }

  // Export the observe-js object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, export as a global object.

  var expose = global;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      expose = exports = module.exports;
    }
    expose = exports;
  } 

  expose.Observer = Observer;
  expose.Observer.runEOM_ = runEOM;
  expose.Observer.observerSentinel_ = observerSentinel; // for testing.
  expose.Observer.hasObjectObserve = hasObserve;
  expose.ArrayObserver = ArrayObserver;
  expose.ArrayObserver.calculateSplices = function(current, previous) {
    return arraySplice.calculateSplices(current, previous);
  };

  expose.ArraySplice = ArraySplice;
  expose.ObjectObserver = ObjectObserver;
  expose.PathObserver = PathObserver;
  expose.CompoundObserver = CompoundObserver;
  expose.Path = Path;
  expose.ObserverTransform = ObserverTransform;
  
})(typeof global !== 'undefined' && global && typeof module !== 'undefined' && module ? global : this || window);



/* ----------------------
	watchdog
----------------------- */

new CircularModule({
		
	name				: 'watchdog',
	requires		: ['log','debug','registry','engine'],
	timer				: null,
	lock				: false,
	config			: {
		watchdogtimeout	: 500
	},
	
	domobserver : null,
	
	pathobservers		: {
	
		// 'full.path' : {
		//		'observer'		: new PathObserver(),
		//		'properties'	:	[
		//			{ 'node': Node, 'type':attribute, 'id':name },
		//			..
		//		]
		//	},
		//  .. 
	
	},
	
	pending	: {
		nodes		: [
			// Node,Node,..
		],
		records	: [
			// {type:type,flag:flag,target:target},
			// {type:pass,flag:attrdatachanged,target:class},..
			// {type:event,flag:attrdatachanged,target:class},..
			// {type:ignore,flag:contextchanged,target:*},..
		]
	},
	
	processing	: {
		// copy of pending on process()
	},
	
	
	
	init	: function() {
		Circular.debug.write('Circular.watchdog.init');
		this.domobserver = new MutationObserver(Circular.watchdog.ondomchange);
	},
	
	die	: function() {
		Circular.debug.write('Circular.watchdog.die');
		this.domobserver.disconnect();
		for (path in this.pathobservers) {
			this.pathobservers[path].observer.close();
		}
		this.pathobservers = {};
	},
	
	watch	: function (node,props) {
		Circular.debug.write('Circular.watchdog.watch');
		this.watchdom(node,props);
		this.watchdata(node,props);
		
	},
	
	
	
	watchdom	: function(node,props) {
		Circular.debug.write('Circular.watchdog.watchdom',props);
		// todo: check if its already watched or changed
		this.domobserver.observe(node, { 
			attributes		: true, 
			childList			: true, 
			characterData	: true,
			subtree				: false
		});
	},
	
	ondomchange	: function(records,observer) {
		Circular.debug.write('Circular.watchdog.ondomchange',records);
		
		//type	String	
		//target	Node	
		//addedNodes	NodeList	
		//removedNodes	NodeList	
		//previousSibling	Node	
		//nextSibling	Node	
		//attributeName	String	
		//attributeNamespace	String	
		//oldValue	String	
		
		records.forEach(function(record) {
			switch(record.type) {
				case 'attributes':
					Circular.watchdog.track(record.target,'event','attrdomchanged',record.attributeName);
					break;
				case 'characterData':
					Circular.watchdog.track(record.target,'event','contentchanged');
					break;
				case 'childList':
					// we have record.addedNodes .. ignoring
					// we have record.removedNodes .. ignoring ?
					Circular.watchdog.track(record.target,'event','contentchanged');
					break;
				default:
					Circular.log.error('Circular.watchdog.ondomchange','unknown record type '+record.type);
			}
		},this);
		
	},
	
	watchdata	: function(node,props) {
		Circular.debug.write('Circular.watchdog.watchdata',props);
		// todo: check if its already watched or changed
		props.attributes.forEach(function(attr,idx) {
			if (attr.paths) {
				attr.paths.forEach(function(path) {
					var object=null,subpath='';
					var split = path.indexOf('.');
					if (split==-1) {
						Circular.log.error('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
					} else {
						object 	= Circular.parser.eval(path.substring(0,split));
						subpath = path.substring(split+1)
					}
					if (object && subpath) {
						var property = {
							'node'		:	node,
							'type'		: 'attribute',
							'id'			: attr.name
						};
						if (!this.pathobservers[path]) {
							if (object !== window) {
								this.pathobservers[path] = {
									'observer'	: new PathObserver(object,subpath),
									'properties': [property]
								};
								this.pathobservers[path].observer.open(function(newvalue,oldvalue) {
									Circular.watchdog.ondatachange(path,newvalue,oldvalue)
								});
							} else {
								Circular.log.error('Circular.watchdog.watchdata','observe cannot be called on the global proxy object',path);
							}
						} else {
							this.pathobservers[path].properties.push(property);
						}
					} else {
						Circular.log.error('Circular.watchdog.watchdata','Cant split path '+path);
					}
				},this);
			}
		},this);
	},
	
	ondatachange	: function(fullpath,newvalue,oldvalue) {
		Circular.debug.write('Circular.watchdog.ondatachange',fullpath);
		this.pathobservers[fullpath].properties.forEach(function(prop) {
			switch (prop.type) {
				case 'attribute':
					this.track(prop.node,'event','attrdatachanged',prop.id);
					break;
				default:
					Circular.log.error('Circular.watchdog.ondatachange','unknown property type '+prop.type);
			}
		},this);
	},
	
	
	
	pass	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.pass');
		this.track(node,'pass',event,target);
	},
	ignore	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.ignore');
		this.track(node,'ignore',event,target);
	},
	unignore	: function(node,event,target) {
		Circular.debug.write('Circular.watchdog.unignore');
		// todo: add domchange/datachange timeout
		this.track(node,'unignore',event,target);
	},

	track	: function(node,type,flag,target) {
		Circular.debug.write('Circular.watchdog.track',node,type,flag,target);
		clearTimeout(this.timer);
		
		var nodeidx = this.pending.nodes.indexOf(node);
		if (nodeidx==-1) {
			nodeidx=this.pending.nodes.length;
			this.pending.nodes.push(node);
		}
		if (!this.pending.records[nodeidx]) {
			this.pending.records[nodeidx] = [];
		}
		this.pending.records[nodeidx].push({type:type,flag:flag,target:target});
		
		
		this.timer = setTimeout(function () {
			Circular.engine.queue(function() {
				Circular.watchdog.process();
			});
		}, Circular.config.watchdogtimeout);
		
	},
	
	process	: function() {
	
		Circular.debug.write('Circular.watchdog.process');

		// copy & clean pending to processing
		// read all the records
		// set node properties where needed
		// recycle all nodes involved

		
		if (this.lock) {
			Circular.log.fatal('Circular.watchdog.process','found lock: another process seems to be running');
			return false;
		}
		this.lock = true;
		$.extend(true,this.processing,this.pending);
		this.pending.nodes = [];
		this.pending.records = [];
		
		for (var nc=0;nc<this.processing.nodes.length;nc++) {
			var node			= this.processing.nodes[nc];
			var records 	= this.processing.records[nc];
			var props 		= Circular.registry.get(node);
			
			// {type,flag,target}
			for (var rc=0; rc<records.length;rc++) {
				var record = records[rc];
				var processing = false;
				switch (record.type) {
					case 'event' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (props.name2attr[record.target]) {
									
										if (props.name2attr[record.target].flags[record.flag+':i']) {
											Circular.debug.write('Circular.watchdog.process','attr ignoring flag',record.flag);
											break;
										}
										if (props.name2attr[record.target].flags[record.flag+':p']) {
											Circular.debug.write('Circular.watchdog.process','attr passing flag',record.flag);
											props.name2attr[record.target].flags[record.flag+':p']--;
											break;
										}
										Circular.debug.write('Circular.watchdog.process',record.flag,record.target,node);
										props.name2attr[record.target].flags[record.flag]=true;
										props.flags[record.flag]=true;
										processing=true;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
							
								if (props.flags['contentchanged:i']) {
									Circular.debug.write('Circular.watchdog.process','node ignoring contentchanged');
									break;
								}
								if (props.flags['contentchanged:p']) {
									Circular.debug.write('Circular.watchdog.process','node passing contentchanged');
									props.flags['contentchanged:p']--;
									break;
								}
								Circular.debug.write('Circular.watchdog.process','contentchanged',record,node);
								props.flags['contentchanged']=true;
								processing=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					case 'pass' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':p']++;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;
							
							// node events
							case 'contentchanged':
								props.flags['contentchanged:p']++;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					case 'ignore' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':i']=true;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=true;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					case 'unignore' :
						switch (record.flag) {
						
							// attr events
							case 'attrdomchanged':
							case 'attrdatachanged':
							
								if (record.target) {
									if (props.name2attr[record.target]) {
										props.name2attr[record.target].flags[record.flag+':i']=false;
									} else {
										Circular.debug.write('Circular.watchdog.process','unregistered target '+record.target,record);
									}
								} else {
									Circular.log.error('Circular.watchdog.process','attr event target missing ',record);
								}
								break;

							case 'contentchanged':
								props.flags['contentchanged:i']=false;
								break;
								
							default:
								Circular.log.error('Circular.watchdog.process','unknown flag '+record.flag,record);
						}
						break;
						
					default:
						Circular.log.error('Circular.watchdog.process','unknown record type '+record.type,record);
				}
			}
			
			// todo: we're not storing the pass and un/ignore flags ?
			if (!processing) {
				delete this.processing.nodes[nc];
				delete this.processing.records[nc];
			} else {
				Circular.registry.set(node,props);
			}
		};
		
		// make hte array unsparse
		var todo = [];
		this.processing.nodes.forEach(function(node) { todo.push(node); });
		if (todo.length) {
			Circular.debug.write('recycling '+todo.length+' nodes');
			if (Circular.debug.on) this.report(this.processing);
			Circular.engine.recycle(todo,true);
		}
		this.processing = {};
		this.lock = false;
		return true;
	},
	
	report	: function(list) {
		if (!list) list = this.pending;
		Circular.log.write('Circular.watchdog.report');
		list.nodes.forEach(function(node,idx) {
			Circular.log.write(node.tagName,list.records[idx]);
		},this);
	}

	
	
	
		
});
	
/* ----------------------
	context
----------------------- */

new CircularModule({

	name				: 'context',
	requires		: ['debug'],
	current			: '',
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.context.in','setting context',attr.expression);
		attr.before = this.get();
		Circular.context.set(attr.expression);
	},
	
	out	: function(attr,node,props) {
		Circular.debug.write('mod.context.out','resetting context');
		this.set(attr.before);
		delete attr.before;
	},
	
	set		: function(context) {
			this.current = context;
	},
	get		: function() {
			return this.current;
	}
		
		
});


/* ----------------------
	content
----------------------- */

new CircularModule({

	name				: 'content',
	requires		: ['debug'],
	
	css		: '.cc-content-generated {  }',
	in	: function(attr,node,props) {
		Circular.debug.write('mod.content.in','setting content',node,attr.result);
		node.textContent=attr.result;
		$(node).addClass('cc-content-generated');
	}

		
});


/* ----------------------
	hide
----------------------- */

new CircularModule({

	name			: 'hide',
	requires	: ['debug'],
	css				: '.cc-hide { display:none; }',
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.hide.in',node);
		$(node).toggleClass('cc-hide',attr.result);
	}
	
		
});



