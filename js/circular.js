
function CircularAttribute (def) {
	this.name 				= '';
	this.directive		= '';
	this.original 		= '';
	this.expression 	= '',
	this.result 			= undefined;
	this.value 				= '';
	
	this.isBreaking 	= false;
	this.isChanged		= false;
	this.isDirty			= false;
	
	if (def)  jQuery.extend(true,this,def);
	
}

function CircularDirective(def) {
	this.name = '';
	this.init	= null;
	this.css	= '';
	this.in 	= function(node,attr) { return true; }
	this.out 	= function(node,attr) { return true; }	
	if (def) jQuery.extend(true,this,def);
	if (this.name) Circular.directives.add(this);
}

var Circular = {

	settings	: {
		
	},
	
	constants	: {
		VERSION		: '0.0.2',
		EXPRREGEX	:	/{{([^}]*?)}}/g,
		EVALFAIL	: undefined
	},
	
	/* -----------------------
		root shortcuts

		for ease sake, some internals are shortcutted here
		so you can write @cc.context or @debug.write
		
	------------------------ */

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
		
		
		/*
			properties is an ass array
			keys status, outercontext, innercontext and attributes.
			
			attributes is an array of CircularAttributes.
			the order of the attributes is important, because
			directive execution may have impact on following attributes
			
		*/
				
		setProperties	: function(node,props) {
			props.status.registered=true;
			$(node).data('cc-properties',props);
			for (var ac=0; ac<props.attributes.length;ac++) {
				Circular.watchdog.watch(props.attributes[ac].expression,node,props.attributes[ac].name);
			}
		},
		updateProperties	: function(node,props) {
			// this could be more efficient ..
			var oldprops = $(node).data('cc-properties');
			for (var ac=0; ac<oldprops.attributes.length;ac++) {
				Circular.watchdog.unwatch(oldprops.attributes[ac].expression,node,oldprops.attributes[ac].name);
			}
			$(node).data('cc-properties',props);
			for (var ac=0; ac<props.attributes.length;ac++) {
				Circular.watchdog.watch(props.attributes[ac].expression,node,props.attributes[ac].name);
			}
		},
		getProperties	: function(node) {
			var props = $(node).data('cc-properties');
			if (!props) props = {
				'status'	: {
					'registered'				: false,
					'contentChanged'		: true,
					'attributesChanged'	: true,
					'attributesDirty'		: true
				},
				'outercontext'			: '',
				'innercontext'			: '',
				'attributes'	: []
			};
			return props;
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
				// eg use @loop to access Circular.directives.processors.loop
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
		
		watch	: function (expr,node,attrname) {
			//var paths = Circular.parser.getPaths(expr);
		},
		unwatch	: function (expr,node,attrname) {
		
		}
		
	},
	
	/* ----------------------
		expressions
	----------------------- */
	
	parser 	: {
		
		// requires esprima.
		// @see http://esprima.org/demo/parse.html
		
		outerscope	: 'window',
		
		getObservablePaths :	function(expression) {
			Circular.debug.write('Parser.getPaths',expression);
			var ast = esprima.parse(expression);
			if (ast) {
				Circular.debug.write('Parser.getPaths',ast);
				var paths = new Array();
				this.recurseObservablePaths(ast,paths);
				return paths;
			} else return false;
		},
		
		recurseObservablePaths	: function(tree,paths,path) {
		
			if (!tree || !paths) return false;
			if (tree.type =='Identifier') {

				// some sort of global
				Circular.debug.write('Parser.recurseObservablePaths','adding identifier '+tree.name);
				paths.push({object:this.outerscope,path:tree.name});

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
						Circular.debug.write('Parser.recurseObservablePaths','adding path '+tree.object.name+path);
						
						if (path.indexOf('.')===0) {
							paths.push({object:tree.object.name,path:path.substring(1)});
						} else {
							paths.push({object:this.outerscope,path:tree.object.name+path});
						}
						
					} else {
						if (tree.object.type=='MemberExpression') {
							
							// like foo.bar.quz ; recurse the object
							Circular.debug.write('Parser.recurseObservablePaths','recursing member expression ..');
							this.recurseObservablePaths(tree.object,paths,path);						
						
						} else {
							
							// like foo(bar).quz ; the object is something weird. 
							// ignore the property .. but recurse the object
							this.recurseObservablePaths(tree.object,paths);	
						
						}
					}
				} else {
				
					// the property is some sort of thing itself:
					
					if (tree.object.type=='Identifier') {
						
						// like foo[bar.quz] - push the object, recurse the property
						Circular.debug.write('Parser.recurseObservablePaths','adding identifier '+tree.object.name);
						paths.push({object:this.outerscope,path:tree.object.name});
						this.recurseObservablePaths(tree.property);	
						
					} else {
					
						// like foo.bar[quz(raz)] ; recurse both
						Circular.debug.write('Parser.recurseObservablePaths','recursing member expression ..');
						this.recurseObservablePaths(tree.object,paths);	
						this.recurseObservablePaths(tree.property,paths);	
					
						
					}
					
				}
				
			} else if (tree.type=="CallExpression") {
			
				// like foo.bar(quz.baz) ; we only want the arguments
				this.recurseObservablePaths(tree.arguments,paths);
				
			} else if (tree.type=="AssignmentExpression") {
			
				// like foo.bar=baz*quz ; we only want the right hand
				this.recurseObservablePaths(tree.right,paths);
				
			} else {
			
				// unknown garbage. dig deeper.
				var props = Object.getOwnPropertyNames(tree);
				for (var pc=0; pc<props.length; pc++) {
					var key = props[pc];
					if (typeof tree[key] == 'object') {
						if (Array.isArray(tree[key])) {
							for (var kc=0;kc<tree[key].length;kc++) {
								Circular.debug.write('Parser.recurseObservablePaths','recursing '+key+':'+kc);
								this.recurseObservablePaths(tree[key][kc],paths);
							}
						} else {
							Circular.debug.write('Parser.recurseObservablePaths','recursing '+key);
							this.recurseObservablePaths(tree[key],paths);
							
						}
					} else {
						Circular.debug.write('Parser.recurseObservablePaths','ignoring '+key);
					}
					
				}
			}
			
		},
		
		
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
				Circular.debug.write("Circular.parser.parse",expr,ctx,parsed);
				return parsed;
			} 
			return '';
		},
		
		
		// evaluates a qualified expression.
		// this does nothing special, but try,catch.
		eval	: function(expr) {
			try {
					var value = eval(expr);
					Circular.debug.write("Circular.parser.eval",expr,value);
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
					
						this.debug('Circular.engine.recycle ','ignoring comments '+node.nodeType);
						break;
						
					default:
					
						this.debug('Circular.engine.recycle ','ignoring node type '+node.nodeType);
				}
	
		},
	
		processElementNode				: function(node,contextChanged) {
					
			var action = '', recycle = '';
			var props = Circular.registry.getProperties(node);

			if (!contextChanged && props.outercontext) {
				this.setContext(props.outercontext);
			} else {
				props.outercontext = this.context.expression;
			}
			
			if (props.status.attributesChanged || props.status.attributesDirty) {
				props.attributes = this.indexAttributes(node,props.attributes);
				props.status.attributesChanged=false;
				props.status.attributesDirty=false;
				if (props.attributes.length) {
				
					// evaluate and fill out attrs, execute directives
					// this will return false if one of the directives
					// return false to interrupt the cycle
					
					var recurse = this.processAttributesIn(node,props.attributes);

					if (recurse) {
						if (props.innercontext.expression!=this.context.expression) {
							// recurse if the inner context changed.
							props.innercontext=this.context.expression;
							this.processChildren(node,true);
							props.status.contentChanged=false;
						} else if (props.status.contentChanged) {
							// or recurse if the inner content changed.
							props.innercontext=this.context.expression;
							this.processChildren(node);
							props.status.contentChanged=false;
						}
					}
					
					this.processAttributesOut(node,props.attributes);
					
					// store the result in the registry for the next cycle
					if (!props.status.registered) Circular.registry.setProperties(node,props);
					else Circular.registry.updateProperties(node,props);
	
				} else {
					// there was nothing particular about this node
					if (props.status.contentChanged) {
						this.processChildren(node);
						props.status.contentChanged=false;
					}
				}
			} else {
				if (props.status.contentChanged) {
					this.processChildren(node);
					props.status.contentChanged=false;
				}
			}
			
		},
		
		indexAttributes	: function(node,regprops) {
		
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
			
			var props = [], attrs = [], dirs = [];
			
			// see if we have a previous run registered
			if (!regprops) regprops = [];
			
			for(var ac=0; ac<node.attributes.length;ac++) {
				var property = null;
				var attrname = node.attributes[ac].name;
				
				// see if it was registered
				for (var ri=0;ri<regprops.length;ri++) {
					if (regprops[ri].name==attrname) {
						property=regprops[ri];
						property.registered=true;
						break;
					}
				}
				
				// else, create a new property from this attribute
				if (!property) property = new CircularAttribute();
				
				var diridx = Circular.directives.attr2idx[attrname];
				if (diridx || diridx===0) {
					var dirprop = null;
					var dirname = Circular.directives.processors[diridx].name;
					if (dirprop = this.indexDirective(node,attrname,dirname,property)) {
						dirs[diridx]=dirprop;
					}
				} else {
					var attrprop = null;
					if (attrprop = this.indexAttribute(node,attrname,property)) {
						attrs.push(attrprop);
					}
				}
			}
			
			// stack these up in the right order:
			for (var idx in dirs) props.push(dirs[idx]);
			return props.concat(attrs);
			
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
					Circular.debug.write('Circular.engine.processAttributeIn','changed',attr.expression,attr.result);
					try {
						attr.value = attr.result.toString();
					} catch (x) {
						Circular.logger.warn(x);
					}
					
					node.setAttribute(attr.name,attr.value);

					if (attr.directive) {
						Circular.debug.write('Circular.engine.processAttributesIn','executing',attr.directive);
						var dir = Circular.directives.processors[Circular.directives.name2idx[attr.directive]];
						var func = dir.in;
						if (func) {
							var ok = func.call(dir,node,attr);
							if (ok===false) {
								attr.isBreaking=true;
								break;
							} else {
								attr.isBreaking=false;
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
				if (attrs[dc].isBreaking) {
					dc++;
					break;
				}
			}
			for (var dc=dc-1; dc>=0; dc--) {
				if (attrs[dc].directive) {
					Circular.debug.write('Circular.engine.processAttributesOut',attrs[dc].directive);
					var dir = Circular.directives.processors[Circular.directives.name2idx[attrs[dc].directive]];
					var func = dir.out;
					if (func) {
						func.call(dir,node,attrs[dc]);
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
					Circular.debug.write('Circular.engine.processTextNode','replacing content with single span');
					var span = document.createElement('span');
					span.setAttribute('id','cc-'+this.genid++);
					span.setAttribute('cc-content',val);
					node.parentNode.insertBefore(span, node);
					this.recycle(span,reindex);
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





// the nop directive
// <div cc-nop="foo"></div>
// does nothing
new CircularDirective({name:'nop'});

// the debug directive

new CircularDirective({

	name			: 'debug',
	on				: false,
		
	in	: function(node,attr) {
		this.write('dir.debug',node);
		attr.before = Circular.settings.debug;
		if (!attr.original || attr.result) {
			this.on=true;
			this.write('dir.debug - on');
		} else {
			this.write('dir.debug - off');
			this.on=false;
		}
	},
	
	out	: function(node,attr) {
		if (!attr.before) this.write('dir.debug - off');
		this.on=attr.before;
		if (attr.before) this.write('dir.debug - on');
	},
	
	toggle: function(on) { this.on=on; },
	on		: function() { this.toggle(true); },
	off		: function() { this.toggle(false); },
	
	write	: function() {
		if (this.on) Circular.logger.log(arguments);
	}
	
	
});

// the context directive
// before  <div cc-context="{{['a','b','c']}}">{{#2}}</div>
// after <div cc-context="{{['a','b','c']}}">b</div>
// on entry, sets the context of the current node to [1,2,3]

new CircularDirective({

	name				: 'context',
	
	in	: function(node,attr) {
		Circular.debug.write('dir.context','setting context',node,attr.expression);
		attr.before = Circular.engine.getContext();
		Circular.engine.setContext({
			expression	: attr.expression,
			object			:	attr.result
		});
	},
	
	out	: function(node,attr) {
		Circular.engine.setContext(attr.before);
		delete attr.before;
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
		Circular.debug.write('dir.content','setting content',node,attr.result);
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
		Circular.debug.write('dir.hide',node);
		$(node).toggleClass('cc-hide',attr.result);
	}
	
		
});



