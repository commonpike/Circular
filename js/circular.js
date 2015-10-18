function CircularModule(def) {
	this.name = '';
	this.init	= null;
	this.css	= '';
	this.in 	= function(attr,node,props) { return true; }
	this.out 	= function(attr,node,props) { return true; }	
	if (def) jQuery.extend(true,this,def);
	if (this.name) Circular.modules.add(this);
}


var Circular = {

	config	: {
		version			: '0.0.2',
		debugging		: true,
		exprregex		:	/{{([^}]*?)}}/g,
		evalfail		: undefined,
		rootcontext	: 'window',
		outerscope	: 'window'
	},
	

	
	
	/* ----------------------
		registry
	----------------------- */
	
	registry		: {
	
		counter	: 0,
		
		newProperties 	: function() {
			return {
				'status'	: {
					'registered'				: false,
					'contentchanged'		: true,
					'contextchanged'		: true,
					'attrdomchanged'		: true,
					'attrvalchanged'		: true
				},
				'outercontext'	: '',
				'innercontext'	: '',
				'attributes'		: []
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
				'status'			: {
					'registered'	: false,
					'domchanged'	: true,
					'datachanged'	: true,
					'breaking'		: false
				}
			}
		} ,
	
		reset			: function(node,props) {
			Circular.debug.write('Circular.registry.reset');
			props.status = {
				'registered'				: true,
				'contentchanged'		: false,
				'contextchanged'		: false,
				'attrdomchanged'		: false,
				'attrvalchanged'		: false
			};
			for (var ac=0; ac<props.attributes.length; ac++) {
				props.attributes[ac].status = {
					'domchanged'	: false,
					'datachanged'	: false,
					'breaking'		: false
				};
			}
		},
		
		set	: function(node,props,reset) {
			Circular.debug.write('Circular.registry.set');
			if (!props.status.registered) {
				this.counter++;
				props.status.registered=true;
			}
			if (reset) this.reset(node,props);
			$(node).data('cc-properties',props);
			
			// notify the watchdog of changes
			Circular.watchdog.watch(node,props);
		},
		
		get	: function(node) {
			Circular.debug.write('Circular.registry.get');
			var props = $(node).data('cc-properties');
			if (!props) props = this.newProperties();
			return props;
		}
		
		
		
	},
	


	
	/* ----------------------
		modules management
	----------------------- */
	
	modules : {
			
		// list of modules being searched
		// for in the cycle. modules are stored
		// in the Circular.* space for easy access
		// name are stored here in a list
		
		processors	: [
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
		
			if (Circular.debug) Circular.debug.write('Circular.modules.add',mod.name);
			
			this.processors.push(mod);
			var idx = this.processors.length-1;
			this.name2idx[mod.name]=idx;
			this.attr2idx['cc-'+mod.name]=idx;
			this.attr2idx['data-cc-'+mod.name]=idx;
			
			if (Circular[mod.name]===undefined) {
				// this is usefull for in templating,
				// eg use @loop to access Circular.modules.processors.loop
				Circular[mod.name]=this.processors[idx];
			} else {
				Circular.logger.warn('@global "'+mod.name+'" is taken: @'+mod.name+' wont work');
			}
		},
		
		init	: function() {
			
			if (Circular.debug) Circular.debug.write('Circular.modules.init');
			
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
		
		domobserver : null,
		
		observed		: {
		
			// 'full.path' : {
			//		'observer'		: new PathObserver(),
			//		'properties'	:	[
			//			{ 'node': Node, 'type':attribute, 'id':name },
			//			..
			//		]
			//	},
			//  .. 
		
		},
		
		queue	: {
			nodes		: [
				// Node,Node,..
			],
			changes	: [
				// {flag:flag,target:id},{flag:flag,target:name},..
			]
		},
		
		init	: function() {
			Circular.debug.write('Circular.watchdog.init');
			this.domobserver = new MutationObserver(Circular.watchdog.ondomchange);
		},
		
		watch	: function (node,props) {
			Circular.debug.write('Circular.watchdog.watch');
			this.watchdom(node,props);
			this.watchdata(node,props);
			
		},
		
		die	: function() {
			Circular.debug.write('Circular.watchdog.die');
			this.domobserver.disconnect();
		},
		
		watchdom	: function(node,props) {
			Circular.debug.write('Circular.watchdog.watchdom',props);
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
				var nodeidx = this.queue.nodes.indexOf(record.target);
				if (nodeidx==-1) {
					nodeidx=nodes.length;
					this.queue.nodes.push(record.target);
				}
				if (!this.queue.changes[nodeidx]) {
					this.queue.changes[nodeidx] = [];
				}
				switch(record.type) {
					case 'attributes':
						this.queue.changes[nodeidx].push({flag:'attrdomchanged', target:record.attributeName});
						break;
					case 'characterData':
						this.queue.changes[nodeidx].push({flag:'contentchanged'});
						break;
					case 'childList':
						// we have record.addedNodes .. ignoring
						// we have record.removedNodes .. ignoring ?
						this.queue.changes[nodeidx].push({flag:'contentchanged'});
						break;
					default:
						Circular.logger.error('Circular.watchdog.ondomchange','unknown record type '+record.type);
				}
			},this);
			
		},
		
		watchdata	: function(node,props) {
			Circular.debug.write('Circular.watchdog.watchdata',props);
			props.attributes.forEach(function(attr,idx) {
				if (attr.paths) {
					attr.paths.forEach(function(path) {
						var object=null,subpath='';
						var split = path.indexOf('.');
						if (split==-1) {
							object 	= Circular.parser.eval(Circular.config.outerscope);
							subpath = path;
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
							if (!this.observed[path]) {
								this.observed[path] = {
									'observer'	: new PathObserver(object,subpath),
									'properties': [property]
								};
								this.observed[path].observer.open(function(newvalue,oldvalue) {
									Circular.watchdog.ondatachange(path,newvalue,oldvalue)
								});
							} else {
								this.observed[path].properties.push(property);
							}
						} else {
							Circular.logger.error('Circular.watchdog.watchdata','Cant split path '+path);
						}
					},this);
				}
			},this);
		},
		
		ondatachange	: function(fullpath,newvalue,oldvalue) {
			Circular.debug.write('Circular.watchdog.ondatachange',fullpath);
			this.observed[fullpath].properties.forEach(function(prop) {
				var nodeidx = this.queue.nodes.indexOf(prop.node);
				if (nodeidx==-1) {
					nodeidx=this.queue.nodes.length;
					this.queue.nodes.push(prop.node);
				}
				if (!this.queue.changes[nodeidx]) {
					this.queue.changes[nodeidx] = [];
				}
				switch (prop.type) {
					case 'attribute':
						this.queue.changes[nodeidx].push({flag:'attrdatachanged', target:prop.id});
						break;
					default:
						Circular.logger.error('Circular.watchdog.ondatachange','unknown property type '+prop.type);
				}
			},this);
		},
		
		

		report	: function() {
			this.queue.nodes.forEach(function(node,idx) {
				Circular.logger.log(node,this.queue.changes[idx]);
			},this);
		},

		
		
		
			
	},
	
	
	
	/* ----------------------
		queue
	----------------------- */

	$queued		: $({}),	
	queue			: function(func) {
		Circular.debug.write("Circular.queue",this.$queued.size()+1);
		// an event queue. if we are digesting the
		// registry, push events up the queue instead
		// of running them concurently
		this.$queued.queue('circular',function(next) {
			func();
			next();
		})
		this.$queued.dequeue('circular'); 
	},
	
	
	/* ----------------------
		engine
	----------------------- */
	
	engine			: {

		interrupt		: false,
		counter			: 0,
		genid				: 0,

		
		init				: function() {
			Circular.debug.write('Circular.engine.init ');
			var $root = $('[cc-root]');
			Circular.context.set(Circular.config.rootcontext);
			$root.each(function() {
				var root = this;
				Circular.queue(function() {
					Circular.engine.process(root,Circular.config.rootcontext); 
				});
			});
		},
		
		
		
		process			: function (node,context) {
			Circular.debug.write('Circular.engine.process',node.nodeName,context);
			if (!node) {
				Circular.logger.fatal('Circular.engine.process','no node given');
			}
			if (this.interrupt) {
				Circular.fatal('Cycling has been interrupted.');
				return false;
			}
			
			this.counter++;
			
			var props = Circular.registry.get(node);
			if (context != props.outercontext) {
				props.outercontext = context;
				props.status.contextchanged=true;
			}
			
			var registered = false;
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
			
			if (props.status.contextchanged || props.status.attrdomchanged || props.status.attrvalchanged) {
			
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
										
					if (recurse) {
						this.processChildren(node,newcontext);
					} 
					
					this.processAttributesOut(node,props);
					
					
					// store a clean result in the registry 
					Circular.registry.set(node,props,true);
					
					return true;
					
				} else {
					
					// after looking at the attributes,
					// there was nothing particular, but
					
					var innercontext = Circular.context.get();
					if (props.innercontext!=innercontext) {
						newcontext = props.innercontext = innercontext;
					}
					
					if (newcontext || props.status.contentchanged) {
						
						this.processChildren(node,newcontext);
						
						// if this was already registered and it changed here,
						// remember that. otherwise, nothing much to remember
						
						if (props.status.registered) {
							Circular.registry.set(node,props,true);
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
				
				if (newcontext || props.status.contentchanged) {
					this.processChildren(node,newcontext);
					
					// if this was already registered and it changed here,
					// remember that. otherwise, nothing much to remember
					
					if (props.status.registered) {
						Circular.registry.set(node,props,true);
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
					var modname = Circular.modules.processors[modidx].name;
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
			
			if (attr.status.domchanged) {
			
				var expression = '', original = '';
				
				if (attr.name.indexOf('-debug')==-1) { // hm
				
					original = node.getAttribute(attr.name);
					
					// parse returns an expression without {{}},
					// or an empty string if there is no expression	
					
					if (expression = Circular.parser.parse(original,Circular.context.get())) {
						
						if (!attr.status.registered) {
						
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
				return attr.status.registered;
				
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
				
				if (attr.status.domchanged || attr.status.datachanged) {
					
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
							Circular.logger.warn(x);
						}
						
						node.setAttribute(attr.name,attr.value);
					}
				}
	
				// even if it didnt change, you need to execute it
				// because it could change things for other attributes
				if (attr.module) {
					Circular.debug.write('Circular.engine.processAttributesIn','executing',attr.module);
					var mod = Circular.modules.processors[Circular.modules.name2idx[attr.module]];
					var func = mod.in;
					if (func) {
						var ok = func.call(mod,attr,node,props);
						if (ok===false) {
							attr.status.breaking=true;
							break;
						} else {
							attr.status.breaking=false;
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
				if (props.attributes[dc].status.breaking) {
					dc++;
					break;
				}
			}
			for (var dc=dc-1; dc>=0; dc--) {
				var attr = props.attributes[dc];
				if (attr.module) {
					Circular.debug.write('Circular.engine.processAttributesOut','executing',attr.module);
					var mod = Circular.modules.processors[Circular.modules.name2idx[attr.module]];
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
			
			if (props.status.contentchanged) {
			
				var val = node.textContent;
				var match, exec, nodes = [];
				if (matches = Circular.parser.match(val)) {
														
					if (matches.length==1) {
						// this is a full match
						//if (!node.parentNode.hasAttribute('cc-content')) {
						//	node.parentNode.setAttribute('cc-content',val);
						//	Circular.queue(function() {
						//		Circular.registry.mark(node.parentNode,{status:{attrdomchanged:true}});
						//		Circular.engine.process(node.parentNode);
						//	});
						//} else {
							Circular.debug.write('Circular.engine.processTextNode','replacing content with single span');
							var span = document.createElement('span');
							span.setAttribute('id','cc-'+this.genid++);
							span.setAttribute('cc-content',val);
							node.parentNode.insertBefore(span, node);
							this.process(span,props.outercontext);
						//}
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
							if (nodes[nc].nodeType==Node.ELEMENT_NODE) {
								this.process(nodes[nc],props.outercontext);
							}
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
		
	},


	/* ----------------------
		parser
	----------------------- */
	
	parser 	: {
		
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
		
			Circular.debug.write('Circular.parser.recursePaths',path);
			
			if (!tree || !paths) return false;
			if (tree.type =='Identifier') {

				// some sort of global
				Circular.debug.write('Circular.parser.recursePaths','adding identifier '+tree.name);
				paths.push(Circular.config.outerscope+'.'+tree.name);

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
							paths.push(Circular.config.outerscope+'.'+tree.object.name+path);
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
						paths.push(Circular.config.outerscope+'.'+tree.object.name);
						this.recursePaths(tree.property);	
						
					} else {
					
						// like foo.bar[quz(raz)] ; recurse both
						Circular.debug.write('Circular.parser.recursePaths','recursing member expression ..');
						this.recursePaths(tree.object,paths);	
						this.recursePaths(tree.property,paths);	
					
						
					}
					
				}
				
			} else if (tree.type=="CallExpression") {
			
				// like foo.bar(quz.baz) ; we only want the arguments
				this.recursePaths(tree.arguments,paths);
				
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
							Circular.debug.write('Circular.parser.recursePaths','recursing '+key);
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
					Circular.logger.error("Circular.parser.eval",expr,'fail');
					return Circular.config.evalfail;
			}
		}
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
			Circular.modules.init();
			if (Circular.config.debugging) Circular.debug.on();
			Circular.watchdog.init();
			Circular.engine.init();	
		});
	}
	


}





// the root module

new CircularModule({
	name:	'root'
});

// the debug module

new CircularModule({

	name			: 'debug',
	enabled		: false,
		
	in	: function(attr,node,props) {
		this.write('mod.debug',node);
		attr.outer = this.enabled;
		if (!attr.original || attr.result) {
			this.enabled=true;
			this.write('mod.debug - on');
		} else {
			this.write('mod.debug - off');
			this.enabled=false;
		}
	},
	
	out	: function(attr,node,props) {
		if (!attr.outer) this.write('mod.debug - off');
		this.enabled=attr.outer;
		if (attr.outer) this.write('mod.debug - on');
	},
	
	toggle: function(on) 	{ this.enabled=on; },
	on		: function() 		{ this.toggle(true); },
	off		: function() 		{ this.toggle(false); },
	
	write	: function() {
		if (this.enabled) Circular.logger.log(arguments);
	}
	
	
});

// the context module

new CircularModule({

	name				: 'context',
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

// the content module

new CircularModule({

	name	: 'content',
	css		: '.cc-content-generated {  }',
	in	: function(attr,node,props) {
		Circular.debug.write('mod.content.in','setting content',node,attr.result);
		node.textContent=attr.result;
		$(node).addClass('cc-content-generated');
	}

		
});


// the hide module

new CircularModule({

	name	: 'hide',
	
	css		: '.cc-hide { display:none; }',
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.hide.in',node);
		$(node).toggleClass('cc-hide',attr.result);
	}
	
		
});



