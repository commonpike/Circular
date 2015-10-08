var Circular = {

	settings	: {
		debug		: true
	},
	
	constants	: {
		VERSION		: '0.0.2',
		EXPRREGEX	:	/{{([^}]*?)}}/g,
		EVALFAIL	: undefined
	},
	
	/* -----------------------
		root shortcuts

		for ease sake, some internals are shortcutted here
		so you can write @cc.context or @debug.
		
	------------------------ */
	
	debug	: function() {
		if (this.settings.debug) this.logger.log(arguments);
	},
	
	cc	:	null,		// shortcut to 'Circular.engine'
	
	
	/* ----------------------
		registry
	----------------------- */
	
	registry		: {
	
		// registry.items holds a map of paths,
		// each containing an array of nodes and
		// properties that depend on that
		// path.
		// items = {"the.path" : [{
		//			"node" 			: thenode,
		//			"property"	: attrname or "_context"
		//		},{
		//			"node" 			: thenode,
		//			"property"	: attrname or "_context"
		//		}]
		//	}
		
		items : {},
		
		// whenever a path is observed to change,
		// the related properties are marked dirty,
		// the nodes are added to the laundry bin and
		// circular is ordered to wash them asap
		laundry : [],
		
		// when circular starts washing, it takes
		// all nodes out of the laundry bin and
		// orders them treewise. while washing, new
		// stuff may be added to the laundry bin
		washing	: {
			//	"node" 			: thenode,
			//	"children"	: {
			//		"node" 			: thenode ,..
		},
		
		registerNode				: function(expr,node) {
			
		},
		updateNode					: function(expr,node) {
			//
		},
		/*
			attributes have the format {
				name											- attribute name
				value											- original value
				expression		expression 	- parsed from original value
				result				result			- last generated result
				string				str					- string version of that result
				directive			directive		- parsed from attribute name
				break					boolean			- wether or not execution forced exit from cycle
			}
			the order of the attributes is important, because
			directive execution may have impact on following attributes
			
		*/
				
		setAttributes	: function(node,attrs) {
			$(node).data('cc-attributes',attrs);
		},
		updateAttributes	: function(node,attrs) {
			$(node).data('cc-attributes',attrs);
		},
		getAttributes	: function(node) {
			var attrs = $(node).data('cc-attributes');
			if (!attrs) attrs = {};
			return attrs;
		}
	},
	


	
	/* ----------------------
		directives management
	----------------------- */
	
	directives : {
			
		// list of directives being searched
		// for in the cycle. directives are stored
		// in the Circular.* space for easy access
		// name are stored here in a list
		
		processors	: [
			// this is where the circulardirectives are stored
			// the order matters
		],
		
		attr2idx					: {
			// map attribute names to directives
		},
		
		name2idx					: {
			// map directive names to directives
		},
		
		add	: function(dir) {
			this.processors.push(dir);
			var idx = this.processors.length-1;
			this.name2idx[dir.name]=idx;
			this.attr2idx['cc-'+dir.name]=idx;
			this.attr2idx['data-cc-'+dir.name]=idx;
			
			if (Circular[dir.name]===undefined) {
				// this is usefull for in templating,
				// eg use @loop to access the loop processor
				Circular[dir.name]=this.processors[idx];
			} else {
				Circular.logger.warn('@global "'+dir.name+'" is taken: @'+dir.name+' wont work');
			}
		},
		
		init	: function() {
						
			// create a stylesheet, add all css
			var css = '';
			for (var dc=0; dc < this.processors.length; dc++) {
				css += this.processors[dc].css;
			}
			
			if (css) {
				var styleElement = document.createElement("style");
				styleElement.type = "text/css";
				document.head.appendChild(styleElement);
				
				// ruff stuff. probs in ie<9
				styleElement.appendChild(document.createTextNode(css));
			}
			
			for (var dc=0; dc < this.processors.length; dc++) {
				if (this.processors[dc].init) {
					this.processors[dc].init();
				}
			}
				
			
		}
		
	},
	
	/* ----------------------
		dom and variable observation 
	----------------------- */

	watchdog		: {
		
		// list of contexts being observed by
		// object.observe. each context holds
		// set of expressions
		contexts	: new WeakMap(),
		
		// list of nodes being observed by
		// MutationObserver. each node holds
		// set of expressions
		nodes	: new WeakMap(),
	
		observe		: function(obj,exp) {
			// if its a dom node, attach a mutationobserver
			// if its an object, call object.observe
			// and recurse down to add .__ccparents  
		},
		
		unobserve	: function(obj,exp) {
			
		},

		oncontextchange	: function(context) {
			
			// for all context expressions of
			// this context, check the registry
			// and re-eval all nodes
			
			// recurse up. all nodes depending 
			// on higher contexts may be affected.
			
			if (context.__ccparents) {
				for (var parent in context.__ccparents) {
					this.oncontextchange(parent);
				}
			}
		},
		ondomchange	: function(node) {
			
			// for all context expressions of
			// this node, check the registry
			// and re-eval this node
		}
		
	},
	
	/* ----------------------
		expressions
	----------------------- */
	
	parser 	: {
		
		match	: function(x) {
			// returns an array of matches or false
			return x.match(Circular.constants.EXPRREGEX);
		},
		
		// split a text into an array
		// of plain text string and {{expressions}}
		split	: function(text) {
			var exec; var result = []; 
			var cursor = 0;
			while (exec = Circular.constants.EXPRREGEX.exec(text)) {
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
			matches = expr.match(Circular.constants.EXPRREGEX);
			if (matches) {
				//console.log(matches[0],expr);
				if (matches[0]===expr) {
					// this is a single full expression "{{#foo}}"
					parsed = expr.substring(2,expr.length-2);
					parsed = parsed.replace(/#/g,ctx+'.');
					parsed = parsed.replace(/@/g,'Circular.');
				} else {
					// this is a stringlike thing, "foo {{#bar}}"
					var parsed = expr.replace(Circular.constants.EXPRREGEX,function(match,inner) {
						inner = inner.replace(/#/g,ctx+'.');
						inner = inner.replace(/@/g,'Circular.');
						return '"+('+inner+')+"';
					});
					// tell eval that this is a stringthing
					parsed = '"'+parsed+'"';
				}
				Circular.debug("Circular.parser.parse",expr,ctx,parsed);
				return parsed;
			} 
			return '';
		},
		
		
		// evaluates a qualified expression.
		// this does nothing special, but try,catch.
		eval	: function(expr) {
			try {
					var value = eval(expr);
					Circular.debug("Circular.parser.eval",expr,value);
					return value;
			} catch (err) {
					Circular.logger.error("Circular.parser.eval",expr,'fail');
					return Circular.constants.EVALFAIL;
			}
		}
	},
	
	/* ----------------------
		queue
	----------------------- */

	queued		: $({}),	
	queue			: function(func) {
		// an event queue. if we are digesting the
		// registry, push events up the queue instead
		// of running them concurently
		this.queued.queue('circular',function(next) {
			func();
			next();
		})
		this.queued.dequeue('circular'); 
	},
	
	
	/* ----------------------
		engine
	----------------------- */
	
	engine			: {

		root				: null,
		interrupt		: false,
		context			: {
			expression 	: '',
			object			: null
		},
		numcycles		: 0,
		genid				: 0,
		
		setContext	: function(context) {
			if (typeof context == 'string') {
				context = {
					expression 	: context,
					object			: Circular.parser.eval(context)
				};
			}
			this.context = context;
		},
		
		getContext	: function() {
			return this.context;
		},
		
		
		cycle				: function(node) {
			// todo: search for a root
			this.root = document.documentElement;
			this.setContext('Circular');
			Circular.queue(function() {Circular.engine.recycle(Circular.engine.root,true); });
		},
		
		
		
		recycle			: function (node,reindex) {
		
			if (this.interrupt) {
				Circular.fatal('Cycling has been interrupted.');
				return false;
			}
			
			this.numcycles++;
			if (!node) node = this.root;
			
			switch(node.nodeType) {
			
					case Node.ELEMENT_NODE:
					
						this.processElementNode(node,reindex);

						break;
						
					case Node.TEXT_NODE:
					
						this.processTextNode(node,reindex);
						
						break;
						
					case Node.COMMENT_NODE:
					
						this.debug('Circular.engine.recycle ','ignoring comments '.node.nodeType);
						break;
						
					default:
					
						this.debug('Circular.engine.recycle ','ignoring node type '.node.nodeType);
				}
	
		},
	
		processElementNode				: function(node,reindex) {
					
			var attrs = {};

			if (reindex) attrs = this.indexAttributes(node);
			else attrs = Circular.registry.getAttributes(node);
			
			if (attrs.length) {
			
				if (reindex) Circular.registry.registerNode(this.context,node);
				else Circular.registry.updateNode(this.context,node);
				
				// evaluate and fill out attrs, execute directives
				// this will return false if one of the directives
				// return false to interrupt the cycle
				
				var descend = this.processAttributesIn(node,attrs);

				if (descend) {
					this.processChildren(node,reindex);
				}
				
				this.processAttributesOut(node,attrs);
				
				// store the result in the registry for the next cycle
				if (reindex) Circular.registry.setAttributes(node,attrs);
				else Circular.registry.updateAttributes(node,attrs);

			} else {
				this.processChildren(node,reindex);
			}
			
		},
		
		indexAttributes	: function(node) {
		
			// this is called if something changed
			// to the dom, and everything needs to 
			// be reindexed. otherwise, attributes are
			// called from the registry
			
			// loop all the nodes attributes
			// see if they contain expression or 
			// if they are directives. other attributes
			// are ignored.

			// the order is important here. 
			// directives should go first, so there are
			// executed before normal attributes. also,
			// the dirs need to be sorted in the
			// order they were created ..
			
			// if the node was registered in a previous
			// cycle, use the original values from there
			
			var attr = {}, exprs = [], dirs = [];
			
			// see if we have a previous run registered
			var regattrs = Circular.registry.getAttributes(node);
			
			for(var ac=0; ac<node.attributes.length;ac++) {
				var template = null;
				var attrname = node.attributes[ac].name;
				
				// see if it was registered
				for (var ri=0;ri<regattrs.length;ri++) {
					if (regattrs[ri].name==attrname) {
						template=regattrs[ri];
						template.registered=true;
						break;
					}
				}
				if (!template) {
					template={
						name				: '',
						original		: '',
						expression	: '',
						result			: undefined,
						value				: '',
						directive 	: '',
						break				: false
					};
				}
				var diridx = Circular.directives.attr2idx[attrname];
				if (diridx || diridx===0) {
					var dirname = Circular.directives.processors[diridx].name;
					if (attr = this.indexDirective(node,attrname,dirname,template)) {
						dirs[diridx]=attr;
					}
				} else {
					if (attr = this.indexAttribute(node,attrname,template)) {
						exprs.push(attr);
					}
				}
			}
			
			var attrs = [];
			// stack these up in the right order:
			for (var idx in dirs) attrs.push(dirs[idx]);
			return attrs.concat(exprs);
			
		},
		

		indexDirective			: function(node,attrname,dirname,template) {
		
			var attr = this.indexAttribute(node,attrname,template);
			
			if (attr) {
			
				attr.directive=dirname;
				
			} else {
			
				// even if its not an expression, a directive
				// is always registered for being there. 
				
				attr = template;
				
				if (!attr.registered) {

					var original 	= node.getAttribute(attrname);
					attr.name 		= attrname;
					attr.original = original;
					attr.value		= original;
					attr.directive = dirname;
					
				}
			}
			return attr;
		},
		
		indexAttribute			: function(node,attrname,template) {
		
			// check if the attribute is an expression
			// dont evaluate it yet - this will happen in
			// processAttributesIn
			
			var attr = false, expression = '', value = '';
			
			if (!Circular.settings.debug || attrname.indexOf('-debug')==-1) {
			
				var original = (template.original)?template.original:node.getAttribute(attrname);
				
				// parse returns an expression without {{}},
				// or an emty string if there is no expression	
				
				if (expression = Circular.parser.parse(original,this.context.expression)) {
					
					attr = template;
					
					if (attr.registered) {
					
						// this came from the registry, but
						// the expression may have changed
						
						attr.expression = expression;
						
					} else {
						
						// create a registry entry from scratch
						attr.name				= attrname;
						attr.original		= original;
						attr.expression	= expression;

					}
					
					if (Circular.settings.debug) {
						if (attr.name.indexOf('cc-')==0) node.setAttribute('cc-'+attr.name.substring(3)+'-debug',attr.original);
						else node.setAttribute('cc-'+attr.name+'-debug',attr.original);
					}

				} 
			}
			
			return attr;
		},
		
		processAttributesIn	: function(node,attrs) {
		
			// loop all attributes forward
			// evaluate optional expressions
			// if its a directive, execute dir.in. 
			// if it returns false, break
			
			//console.log('processAttributesIn',node,attrs);
			
			for (dc=0; dc<attrs.length; dc++) {
			
				var attr = attrs[dc];
				
				// eval this attribute, be it a full match
				// or  a string containing matches 
				
				var result = Circular.parser.eval(attr.expression);
				if (result===undefined) result = ''; // hmm
				
				if (result!=attr.result) {
				
					attr.result = result;
					Circular.debug('Circular.engine.processAttributeIn','changed',attr.expression,attr.result);
					try {
						attr.value = attr.result.toString();
					} catch (x) {
						Circular.logger.warn(x);
					}
					
					node.setAttribute(attr.name,attr.value);

					if (attr.directive) {
						Circular.debug('Circular.engine.processAttributesIn','executing',attr.directive);
						var func = Circular.directives.processors[Circular.directives.name2idx[attr.directive]].in;
						if (func) {
							var ok = func(node,attr);
							if (ok===false) {
								attr.break=true;
								break;
							} else {
								attr.break=false;
							}
						}
					} 
				}			
				
			}
			return dc==attrs.length || !attrs[dc].exit;
				
			
		},
		
		processAttributesOut	: function(node,attrs) {
			// loop all directives backwards
			// starting with the last break, if any
			for (var dc=0; dc<attrs.length; dc++) {
				if (attrs[dc].break) {
					dc++;
					// reeval again next time in() is called
					attrs[dc].break=false;
					break;
				}
			}
			for (var dc=dc-1; dc>=0; dc--) {
				if (attrs[dc].directive) {
					Circular.debug('Circular.engine.processAttributesOut',attrs[dc].directive);
					var func = Circular.directives.processors[Circular.directives.name2idx[attrs[dc].directive]].out;
					if (func) {
						func(node,attrs[dc]);
					}
				}
			}
			
		},
		
		processChildren	: function(node,reindex) {
			
			//console.log('processchildren '+this.context);
			
			// traverse node depth first looking
			// for directives or expressions,
			// using the new context
			var contents = $(node).contents();
			$(contents).each(function() {
				Circular.engine.recycle(this,reindex);
			});
			
		},
		
		
		processTextNode	: function(node,reindex) {
			var val = node.textContent;
			var match, exec, nodes = [];
			if (matches = Circular.parser.match(val)) {
													
				if (matches.length==1) {
					// this is a full match
					Circular.debug('Circular.engine.processTextNode','replacing content with single span');
					var span = document.createElement('span');
					span.setAttribute('id','cc-'+this.genid++);
					span.setAttribute('cc-content',val);
					node.parentNode.insertBefore(span, node);
					this.recycle(span,reindex);
					node.parentNode.removeChild(node);
					
				} else {
				
					// start splitting up nodes
					Circular.debug('replacing content with text and spans');
					
					var vals = Circular.parser.split(val);
					for (var vc=0; vc<vals.length;vc++) {
							if (vals[vc].expression) {
								Circular.debug('Circular.engine.processTextNode','inserting span '+vals[vc].expression);
								var span = document.createElement('span');
								span.setAttribute('id','cc-'+this.genid++);
								span.setAttribute('cc-content',vals[vc].expression);
								nodes.push(span);
							} else {
								Circular.debug('Circular.engine.processTextNode','inserting text '+vals[vc].text);
								nodes.push(document.createTextNode(vals[vc].text));
							}
					}
					
					for (var nc=0; nc < nodes.length; nc++) {
						node.parentNode.insertBefore(nodes[nc], node);
						this.recycle(nodes[nc],reindex);
					}
					node.parentNode.removeChild(node);
					
				}
													
			}
		},
		
	},

		
	/* ----------------------
		tools
	----------------------- */
	
	
	
	logger : {
		log		: function() {
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
			Circular.engine.interrupt=true;
		}
	},	
	
	/* ----------------------
		init 
	----------------------- */
	

	
	
	init 		: function() {
		$(document).ready(function() {
			Circular.cc = Circular.engine;
			Circular.directives.init();
			Circular.engine.cycle();	
		});
	}
	


}



CircularDirective = function(def) {
	if (def.name) {
		this.name = def.name;
		this.init	= def.init?def.init:null;
		this.css	= def.css?def.css:'';
		this.in 	= def.in?def.in:function(node,attr) { return true; }
		this.out 	= def.out?def.out:function(node,attr) { return true; }	
		Circular.directives.add(this);
	}
	
}

// the nop directive
// <div cc-nop="foo"></div>
// does nothing
new CircularDirective({name:'nop'});

// the context directive
// before  <div cc-context="{{['a','b','c']}}">{{#2}}</div>
// after <div cc-context="{{['a','b','c']}}">b</div>
// on entry, sets the context of the current node to [1,2,3]

new CircularDirective({

	name				: 'context',
	
	in	: function(node,attr) {
		Circular.debug('dir.context','setting context',node,attr.expression);
		attr.previous = Circular.engine.getContext();
		Circular.engine.setContext({
			expression	: attr.expression,
			object			:	attr.result
		});
	},
	
	out	: function(node,attr) {
		Circular.engine.setContext(attr.previous);
		delete attr.previous;
	}
		
});

// the content directive
// before  <div cc-content="{{#foo}}"></div>
// after <div cc-content="{{#foo}}">bar</div>
// on entry, sets the content of the current node to 
// the value of the expression. The content
// directive is used mainly for transforming
// 'inline expressions' in text into spans

new CircularDirective({

	name	: 'content',
	
	in	: function(node,attr) {
		Circular.debug('dir.content','setting content',node,attr.result);
		node.textContent=attr.result;
	}

		
});

// the hide directive
// before  <div cc-hide="{{#foo}}">bar</div>
// after <div cc-hide="true" class="cc-hide">bar</div>

new CircularDirective({

	name	: 'hide',
	
	css		: '.cc-hide { display:none; }',
	
	in	: function(node,attr) {
		Circular.debug('dir.hide',node);
		$(node).toggleClass('cc-hide',attr.result);
	}
	
		
});



