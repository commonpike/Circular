	
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