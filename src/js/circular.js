
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



