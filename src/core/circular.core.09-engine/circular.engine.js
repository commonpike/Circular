	
/* ----------------------
	engine
----------------------- */

new CircularModule('engine', {

	config				: { 
		rootselector 	: '',
		greedy				: false, // trim whitespace from inline expressions
		debug					: false
	},
	
	settings 			: {
		insertcss			: ['#cc-engine-stack { display:none }'],
		rxcomment			: /^cc:([^(]+)(\((.*)\))?$/
	},
	
	init					: function() { 
		this.$stack = $('<div id="cc-engine-stack" cc-engine-skip>').appendTo('body');
	},
	
	// -------------
	
	counter			: 0,
	genid				: 0,
	$stack			: null,
	
	nodeid			: function(node) {
		if (node instanceof jQuery) node = node.get(0);
		if (!node.hasAttribute('id')) node.setAttribute('id','cc-engine-'+(this.genid++));
		return node.getAttribute('id');
	},
	
	stack				: function(node,parent) {
		return $(node).appendTo(parent?$(parent):this.$stack);
	},
	
	start				: function() {
		this.debug('@engine.start ');
		var rootsel = this.config.rootselector;
		if (!rootsel) rootsel = '['+Circular.modules.prefix('cc-root')+']';
		var $root = $(rootsel);
		if (!$root.size()) $root = $('html');
		this.recycle($root,true);
	},
	
	recycle	: function(nodes,now) {
		this.debug('@engine.recycle ');
		if (nodes instanceof jQuery) {
			nodes = nodes.toArray();
		} else if (!Array.isArray(nodes)) {
			nodes = [nodes];
		}
		
		if (!nodes) return this.start();
		
		if (!now) {
			Circular.queue.add(function() {
				Circular.engine.recycle(nodes,true);
			});
			return true;
		}
		//alert('recycle');
		
		this.sort(nodes);
		
		nodes.forEach(function(node) {
			// lock nodes
			Circular.registry.lock(node);
		});
		
		nodes.forEach(function(node) {
			if ((document.contains && document.contains(node)) || 
				(document.body.contains(node) || document.head.contains(node))) {
			//	console.log('get',node);
				var ccnode = Circular.registry.get(node,true);
				if (ccnode.flags.locked) {
					this.debug('@engine.recycle ','Recycling',node);
					this.process(node);
				} else {
					this.debug('@engine.recycle ','Node was already recycled',node,ccnode);
				}
			} else {
				// is this leaking ?
				this.debug('@engine.recycle ','Node was removed',node,ccnode);
				Circular.registry.unlock(node);
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
	
	getContext	: function(node) {
		this.debug('@engine.getContext',node.nodeName);
		// you rarely need this. while cycling the document,
		// the context is passed to the process() method or
		// taken from @context.current. only when out of a 
		// cycle, if you address a node that has not been
		// indexed, you may need to find the context it would
		// have had if it were indexed within a cycle.

		var ccnode = Circular.registry.get(node,true);
		if (ccnode.properties.outercontext) return ccnode.properties.outercontext;
		else {
			var $parents = $(node).parents();
			for (var pc=0; pc < $parents.size(); pc++) {
				var ccnode = Circular.registry.get($parents.eq(pc),true);
				if (ccnode.properties.innercontext) {
					return ccnode.properties.innercontext;
				}
			}
		}
		return Circular.context.config.root;
	
	},
	
	process			: function (node,context) {
		if (node instanceof jQuery) node = node.get(0);
		this.debug('@engine.process',node.nodeName,context);
		if (!node) {
			Circular.log.fatal('@engine.process','no node given');
		}
		if (Circular.dead) {
			Circular.log.fatal('@engine.process','Circular died X-|');
			return false;
		}
		// cruft
		// if (node instanceof jQuery) node = $node.get(0);
		this.counter++;
		
		var ccnode = Circular.registry.get(node,true);
		ccnode.flags.locked=true; // for new nodes
		
		if (context) {
			if (context != ccnode.properties.outercontext) {
				this.debug('@engine.process','context changed',ccnode.properties.outercontext,context,node);
				ccnode.properties.outercontext = context;
				ccnode.flags.ocontextchanged=true;
			} else {
				this.debug('@engine.process','context not changed');
			}
		} else {
			if (!ccnode.properties.outercontext) {
				this.debug('@engine.process','no context, searching',node);
				//ccnode.properties.outercontext = Circular.context.get();
				ccnode.properties.outercontext = this.getContext(node);
				this.debug('@engine.process','found context',ccnode.properties.outercontext);
			} else {
				this.debug('@engine.process','no context: using stored',ccnode.properties.outercontext,node);
			}
		}
		Circular.context.set(ccnode.properties.outercontext);
		
		switch(node.nodeType) {
		
			case Node.ELEMENT_NODE:
			
				if (this.processElementNode(node,ccnode)) {
					this.debug('@engine.process','registered',node);
				} else {
					this.debug('@engine.process','ignored',node);
				}

				break;
				
			case Node.TEXT_NODE:
			
				if (this.processTextNode(node,ccnode)) {
					this.debug('@engine.process','processed',node);
				} else {
					this.debug('@engine.process','ignored',node);
				}
				
				break;
				
			case Node.COMMENT_NODE:
			
				if (this.processCommentNode(node,ccnode)) {
					this.debug('@engine.process','processed',node);
				} else {
					this.debug('@engine.process','ignored',node);
				}
				break;
				
			default:
			
				this.debug('@engine.process ','ignoring node type '+node.nodeType);
		}
		
		// if it was registered along the way,
		// now is the time to let go
		if (ccnode.flags.registered) {
			Circular.registry.unlock(node);
		}
		
	},


	processElementNode	: function(node,ccnode) {
	
		this.debug('@engine.processElementNode',node.nodeName);
		
		if (node.nodeName=='XMP' || node.nodeName=='CODE' || node.hasAttribute('cc-engine-skip')) {
			return false;
		}
		if (ccnode.flags.pristine) {
		
			this.debug('@engine.processElementNode','ccnode.flags.pristine');
			
			this.indexAttributes(node,ccnode);
			if (ccnode.index.length) {
				Circular.eject.preprocess(node,ccnode);
				this.processAttributesIn(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
				if (ccnode.flags.recurse) {
					this.processChildren(node,ccnode.properties.innercontext);
				} else this.debug('@engine.processElementNode','flags.recurse=false');
				this.processAttributesOut(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
				return true;
			} else {
				// no need to register. just recurse
				this.debug('@engine.processElementNode','no attributes, not registering');
				ccnode.properties.innercontext = ccnode.properties.outercontext;
				this.processChildren(node,ccnode.properties.innercontext);
			}
		
				
				
		} else if (ccnode.flags.attrsetchanged) {
		
			this.debug('@engine.processElementNode','ccnode.flags.attrsetchanged');
			
			this.indexAttributes(node,ccnode);
			if (ccnode.index.length) {
				Circular.eject.preprocess(node,ccnode);
				this.processAttributesIn(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
				if (ccnode.flags.recurse) {
					if (ccnode.flags.icontextchanged || ccnode.flags.contentchanged) {
						this.processChildren(node,ccnode.properties.innercontext);
					} else this.debug('@engine.processElementNode','no need to recurse');
				}  else this.debug('@engine.processElementNode','flags.recurse=false');
				this.processAttributesOut(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
			} else {
				ccnode.properties.innercontext=ccnode.properties.outercontext;
				Circular.registry.set(node,ccnode,true);
				this.processChildren(node,ccnode.properties.innercontext);
			}
				
		} else if (ccnode.flags.attrdomchanged) {
		
			this.debug('@engine.processElementNode','ccnode.flags.attrdomchanged');
			
			this.indexAttributes(node,ccnode);
			if (ccnode.index.length) {
				Circular.eject.preprocess(node,ccnode);
				this.processAttributesIn(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
				if (ccnode.flags.recurse) {
					if (ccnode.flags.icontextchanged || ccnode.flags.contentchanged) { 
						this.processChildren(node,ccnode.properties.innercontext);
					} else this.debug('@engine.processElementNode','no need to recurse');
				}  else this.debug('@engine.processElementNode','flags.recurse=false');
				this.processAttributesOut(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
			} else {
				Circular.log.error('@engine.processElementNode','attrdomchanged, but no attributes');
			}
				
		} else if (ccnode.flags.attrdatachanged) {
		
			this.debug('@engine.processElementNode','ccnode.flags.attrdatachanged');
			
			if (ccnode.index.length) {
				Circular.eject.preprocess(node,ccnode);
				this.processAttributesIn(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
				if (ccnode.flags.recurse) {
					if (ccnode.flags.icontextchanged || ccnode.flags.contentchanged) { 
						this.processChildren(node,ccnode.properties.innercontext);
					} else this.debug('@engine.processElementNode','no need to recurse');
				}  else this.debug('@engine.processElementNode','flags.recurse=false');
				this.processAttributesOut(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
			} else {
				Circular.log.error('@engine.processElementNode','attrdatachanged, but no attributes');
			}
			
		} else if (ccnode.flags.ocontextchanged) {
		
			this.debug('@engine.processElementNode','ccnode.flags.ocontextchanged');
			
			if (ccnode.index.length) {
				Circular.eject.preprocess(node,ccnode);
				this.processAttributesIn(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
				if (ccnode.flags.recurse) {
					if (ccnode.flags.icontextchanged || ccnode.flags.contentchanged) {
						this.processChildren(node,ccnode.properties.innercontext);
					} else this.debug('@engine.processElementNode','no need to recurse');
				}  else this.debug('@engine.processElementNode','flags.recurse=false');
				this.processAttributesOut(node,ccnode);
				Circular.eject.postprocess(node,ccnode);
				Circular.registry.set(node,ccnode,true);
			
			} else {
				
				ccnode.properties.innercontext=ccnode.properties.outercontext;
				Circular.registry.set(node,ccnode,true);
				this.processChildren(node,ccnode.properties.innercontext);
		
			}
			
		} else if (ccnode.flags.contentchanged) {
		
			this.debug('@engine.processElementNode','ccnode.flags.contentchanged');
			
			if (ccnode.index.length) {
				if (ccnode.flags.recurse) {
					this.processChildren(node,ccnode.properties.innercontext);
				}  else this.debug('@engine.processElementNode','flags.recurse=false');
			} else {
				this.processChildren(node,ccnode.properties.innercontext);
			}
		}
		
	},

	/*
		oldProcessElementNode				: function(node,ccnode) {
		this.debug('@engine.processElementNode');

		var newcontext = false;

		if (ccnode.flags.ocontextchanged || ccnode.flags.attrsetchanged || ccnode.flags.attrdomchanged || ccnode.flags.attrdatachanged) {
		
			if (ccnode.flags.attrdomchanged || ccnode.flags.attrsetchanged ) {
				this.indexAttributes(node,ccnode);
			}
			
			if (ccnode.index.length) {
			
				this.debug('@engine.processElementNode','processing attrs in ..',node);
				
				// evaluate and fill out attrs, execute modules
				// this will return false if one of the modules
				// return false to interrupt the cycle
				
				var recurse = this.processAttributesIn(node,ccnode);
				
				this.debug('@engine.processElementNode','processed attrs in',node);


				//var innercontext = Circular.context.get();
				//if (ccnode.properties.innercontext!=innercontext) {
				//	newcontext = ccnode.properties.innercontext = innercontext;
				//}
				
				// register changes now, so the watchdog can
				// observe changes made by children
				Circular.registry.set(node,ccnode,true);
				
				if ( ccnode.flags.recurse && ( ccnode.flags.icontextchanged || ccnode.flags.contentchanged ) ) {
					this.processChildren(node,newcontext);
				} else {
					Circular.log.info('@engine.processElementNode','not recursing',ccnode,ccnode.flags.recurse ,ccnode.flags.icontextchanged,ccnode.flags.contentchanged);
				}
				
				this.debug('@engine.processElementNode','processing attrs out ..',node);
				this.processAttributesOut(node,ccnode);
				this.debug('@engine.processElementNode','processed attrs out',node);
				
				// register the final version
				Circular.registry.set(node,ccnode,true);
				
				return true;
				
			} else {
				
				// after looking at the attributes,
				// there was nothing particular, but
				
				//var innercontext = Circular.context.get();
				//if (ccnode.properties.innercontext!=innercontext) {
				//	newcontext = ccnode.properties.innercontext = innercontext;
				//}
				
				if (ccnode.flags.icontextchanged || ccnode.flags.contentchanged) {
					
					
					
					// if this was already registered and it changed here,
					// remember that. otherwise, nothing much to remember
					
					if (ccnode.flags.registered) {
						Circular.registry.set(node,ccnode,true);
					} 
					
					this.debug('@engine.processElementNode','processing content',node);
					
					this.processChildren(node,newcontext);
					
					
					this.debug('@engine.processElementNode','processed content',node);
					
					// and the final version
					
					if (ccnode.flags.registered) {
						
						Circular.registry.set(node,ccnode,true);
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
		

			// we can ignore the attributes. but
			
			var innercontext = Circular.context.get();
			if (ccnode.properties.innercontext!=innercontext) {
				newcontext = ccnode.properties.innercontext = innercontext;
			}
			
			if (newcontext || ccnode.flags.contentchanged) {
			
				// if this was already registered and it changed here,
				// remember that. otherwise, nothing much to remember
				
				if (ccnode.flags.registered) {
					Circular.registry.set(node,ccnode,true);
				} 
				
				this.debug('@engine.processElementNode','processing content',node);
				
				this.processChildren(node,newcontext);
				
				this.debug('@engine.processElementNode','processed content',node);
				
				// and the final version
				if (ccnode.flags.registered) {
					Circular.registry.set(node,ccnode,true);
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
	*/
	
	indexAttributes	: function(node,ccnode) {
		this.debug('@engine.indexAttributes');
		
		// loop all the nodes attributes
		// see if they contain expression or 
		// if they are modules. other attributes
		// are ignored.

		// the order is important here. 
		// modules should go first, so there are
		// executed before normal attributes. also,
		// the module attribute should have their own order
		
		// if the node was registered in a previous
		// cycle, use the original values from there
		
		if (ccnode.flags.pristine) {
			
			// index all attributes
			
			var modattrs = [], plainattrs = [];
			for(var ac=0; ac<node.attributes.length;ac++) {
				
				var attrname 	= node.attributes[ac].name;
				var attridx  	= Circular.modules.attr2idx[attrname];
				if (attridx!==undefined) {
					this.debug('@engine.indexAttributes','pristine','adding mod',attrname,attridx);
					var ccattr 				= Circular.registry.newCCattribute(attrname);
					ccattr.content.original 	= node.attributes[ac].value;
					ccattr.properties.module	= Circular.modules.attr2mod[attrname];
					ccnode.attributes[attrname] = ccattr;
					modattrs[attridx] = ccattr;
				} else if (Circular.parser.isExpression(node.attributes[ac].value)) {
					this.debug('@engine.indexAttributes','pristine','adding plain',attrname);
					var ccattr 				= Circular.registry.newCCattribute(attrname);
					ccattr.content.original 	= node.attributes[ac].value;
					ccattr.properties.module	= Circular.modules.attr2mod[attrname];
					ccnode.attributes[attrname] = ccattr;
					plainattrs.push(ccattr);
				} else {
					this.debug('@engine.indexAttributes','pristine','ignoring attr',attrname);
				}
			}
			// unsparse
			ccnode.index = modattrs.filter(function(val){return val});
			ccnode.index = ccnode.index.concat(plainattrs);
			
			//console.log(ccnode.attributes);
			//console.log(ccnode.index);
			
		} else if (ccnode.flags.attrsetchanged) {
			
			// index all attributes, but keep the old ones
				
			var modattrs = [], plainattrs = [];
			for(var ac=0; ac<node.attributes.length;ac++) {
				
				var attrname 	= node.attributes[ac].name;
				var attridx  	= Circular.modules.attr2idx[attrname];
				if (attridx!==undefined) {
					if (ccnode.attributes[attrname]) {
						modattrs[attridx] = ccnode.attributes[attrname];
						if (ccnode.attributes[attrname].flags.domchanged) {
							this.debug('@engine.indexAttributes','attrsetchanged/attrdomchanged','resetting',attrname);
							var ccattr 				= Circular.registry.newCCattribute(attrname);
							ccattr.content.original 	= node.attributes[ac].value;
							ccattr.properties.module	= Circular.modules.attr2mod[attrname];
							ccnode.attributes[attrname] = ccattr;
						}
					} else {
						this.debug('@engine.indexAttributes','attrsetchanged','adding new mod',attrname,attridx);
						var ccattr 				= Circular.registry.newCCattribute(attrname);
						ccattr.content.original 	= node.attributes[ac].value;
						ccattr.properties.module	= Circular.modules.attr2mod[attrname];
						ccnode.attributes[attrname] = ccattr;
						modattrs[attridx] = ccattr;
					} 
				} else {
					if (ccnode.attributes[attrname]) {
						plainattrs.push(ccnode.attributes[attrname]);
						if (ccnode.attributes[attrname].flags.domchanged) {
							this.debug('@engine.indexAttributes','attrsetchanged/attrdomchanged','resetting',attrname);
							var ccattr 				= Circular.registry.newCCattribute(attrname);
							ccattr.content.original 	= node.attributes[ac].value;
							ccattr.properties.module	= Circular.modules.attr2mod[attrname];
							ccnode.attributes[attrname] = ccattr;
						}
					} else if (Circular.parser.isExpression(node.attributes[ac].value)) {
						this.debug('@engine.indexAttributes','attrsetchanged','adding new plain',attrname);
						var ccattr 				= Circular.registry.newCCattribute(attrname);
						ccattr.content.original 	= node.attributes[ac].value;
						ccattr.properties.module	= Circular.modules.attr2mod[attrname];
						ccnode.attributes[attrname] = ccattr;
						plainattrs.push(ccattr);
					} else {
						this.debug('@engine.indexAttributes','attrsetchanged','ignoring new attr',attrname);
					}
				}
			}
			// unsparse
			ccnode.index = modattrs.filter(function(val){return val});
			ccnode.index = ccnode.index.concat(plainattrs);
			
			// remove old attributes
			for (var attrname in ccnode.attributes) {
				if (!node.hasAttribute(attrname)) {
					this.debug('@engine.indexAttributes','attrsetchanged','removing attr',attrname);
					delete ccnode.attributes[attrname];
				}
			}
			
		} else if (ccnode.flags.attrdomchanged) {
		
			// find which attributes domchanged
			// and reset those
			for (var attridx in ccnode.index) {
				var attrname = ccnode.index[attridx].properties.name;
				if (ccnode.attributes[attrname].flags.attrdomchanged) {
					this.debug('@engine.indexAttributes','attrdomchanged','resetting attr',attrname);
					var ccattr 				= Circular.registry.newCCattribute(attrname);
					ccattr.properties.module		= Circular.modules.attr2mod[attrname];
					ccattr.content.original 		= node.getAttribute(attrname);
					ccnode.attributes[attrname] = ccattr;
					ccnode.index[attridx] = ccattr;
				}
			}
			
		} else {
			Circular.log.error('@engine.indexAttributes','no need to index?')
		}
			
		
	}, 
	
	/*
		indexAttributes	: function(node,ccnode) {
			this.debug('@engine.indexAttributes');
			
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
			
	
			var regattrs = ccnode.index;
			var attributes = [], plain = [], mods = [];
			
			for(var ac=0; ac<node.attributes.length;ac++) {
				var ccattr = null;
				var attrname = node.attributes[ac].name;
				
				//ccattr = ccnode.attributes[attrname];
				
				// see if it was registered
				for (var ri=0;ri<regattrs.length;ri++) {
					if (regattrs[ri].name==attrname) {
						ccattr=regattrs[ri];
						break;
					}
				}
				
				// else, create a new property from this attribute
				if (!ccattr) ccattr = Circular.registry.newCCattribute(attrname);
				
				var modidx = Circular.modules.attr2idx[attrname];
				if (modidx!==undefined) {
					var modname = Circular.modules.stack[modidx].name;
					if (this.indexModuleAttribute(node,ccattr,modname)) {
						mods[modidx]=ccattr;
						mods[modidx].watches = Circular.modules.stack[modidx].watches;
					}
				} else {
					if (this.indexAttribute(node,ccattr)) {
						plain.push(ccattr);
					}
				}
			}
			
			// stack these up in the right order:
			for (var idx in mods) {
				attributes.push(mods[idx]);
			}
			ccnode.index = attributes.concat(plain);
			
			// now put the watches in place
			this.debug('@engine.indexAttributes','attributes pre',ccnode.index);
			for (var pc=0; pc < ccnode.index.length; pc++) {
				if (ccnode.index[pc].watches) {
					for (var wc=0; wc<ccnode.index[pc].watches.length;wc++) {
						this.debug('@engine.indexAttributes','moving watch',ccnode.index[pc].watches[wc]);
						for (var pc2=0; pc2 < ccnode.index.length; pc2++) {
							if (ccnode.index[pc2].name==ccnode.index[pc].watches[wc]) {
								this.debug('@engine.indexAttributes','found watch',ccnode.index[pc].watches[wc]);
								// move ccnode.index[pc2] before ccnode.index[pc]
								ccnode.index.splice(pc,0,ccnode.index.splice(pc2,1)[0]);
								if (pc2>pc) pc++;
								break;
							}
						}
					}
				}
			}
			this.debug('@engine.indexAttributes','attributes post',ccnode.index);
			
			// map them by name - youll need it
			for (var idx in ccnode.index) {
				ccnode.attributes[ccnode.index[idx].properties.name] = ccnode.index[idx];
			}
		},
		
	
		indexModuleAttribute			: function(node,ccattr,modname) {
			this.debug('@engine.indexModuleAttribute',modname);
			
			
			if (this.indexAttribute(node,ccattr)) {
				// returns true if it is an expression
				
				ccattr.properties.module=modname;
				return true;
				
			} else {
			
				// even if its not an expression, a module
				// is always registered for just being one. 
				
				if (!ccattr.flags.registered) {
					//ccattr.properties.name		= Circular.modules.prefix(ccattr.properties.name);
					ccattr.properties.module 	= modname;
				}
				var original 	= node.getAttribute(ccattr.properties.name);
				ccattr.content.original = original;
				ccattr.content.value		= original;
				//ccattr.content.result		= original;
					
				return true;
				
			}
			
		},
		
		indexAttribute			: function(node,ccattr) {
			this.debug('@engine.indexAttribute',ccattr.properties.name);
			
			// check if the attribute is an expression
			// update the properties of ccattr, but
			// dont evaluate it yet - this will happen in
			// processAttributesIn, in the right order
			
			// return true if it should be registered
			// false if it shouldnt
			
			if (ccattr.flags.attrdomchanged) {
	
				this.debug('@engine.indexAttribute','attrdomchanged',node,ccattr);
				
				var expression = '', original = '';
				
				//if (ccattr.properties.name.indexOf('-debug')==-1) { // hm
				
					// the dom changed, so ignore what was registered:
					ccattr.content.original = node.getAttribute(ccattr.properties.name);
					expression	= ccattr.content.expression;
					
					// parse returns an expression without {{}},
					// or an empty string if there is no expression	
					
					if (Circular.parser.parseAttribute(ccattr,Circular.context.get())) {
	
						//if (Circular.debug.enabled && ccattr.properties.name!='cc-debug') {
						//	if (ccattr.properties.name.indexOf('cc-')==0) node.setAttribute('cc-'+ccattr.properties.name.substring(3)+'-debug',ccattr.content.original);
						//	else node.setAttribute('cc-'+ccattr.properties.name+'-debug',ccattr.content.original);
						//}
				
						return true;
						
					} else {
					
						// so its not an expression (anymore)
						// ignore it or forget it
						//alert('forget '+node.nodeName+'.'+ccattr.properties.name);
						
						
						//if (Circular.debug.enabled) {
						//	if (ccattr.properties.name.indexOf('cc-')==0) node.removeAttribute('cc-'+ccattr.properties.name.substring(3)+'-debug');
						//	else node.removeAttribute('cc-'+ccattr.properties.name+'-debug');
						//}
						return false;
	
					}
				//} else {
					// dont register debug attributes
				//	return false;
				//}
			} else {
			
				
				
				// nothing changed, so do nothing,
				// but if it was registered, remember it
				return ccattr.flags.registered;
				
			}
			
		},
		
	*/
	
	
	processAttributesIn	: function(node,ccnode) {
		this.debug('@engine.processAttributesIn',node);
		// loop all attributes forward
		// evaluate optional expressions
		// if its a module, execute mod.in. 
		// if it returns false, break
		
		//console.log('processAttributesIn',node,attributes);
		
		// optimist
		ccnode.flags.recurse = true;
		
		for (var dc=0; dc<ccnode.index.length; dc++) {
		
			var ccattr = ccnode.index[dc];
			
			if (ccattr.flags.attrdomchanged) {
				this.debug('@engine.processAttributesIn','changed, parsing original',ccattr.content.original);
				this.parseAttribute(ccattr,Circular.context.get());
			}
		
			if (ccattr.flags.attrdomchanged || ccattr.flags.attrdatachanged) {
				//alert('adc '+ccattr.properties.name);
				this.debug('@engine.processAttributesIn','processing',ccattr.properties.name);
				this.evalAttribute(node,ccnode,ccattr);
				
			}
			
			/*
				if (ccattr.flags.attrdomchanged || ccattr.flags.attrdatachanged) {
					
					
					// (re-)eval this attribute, be it a full match
					// or  a string containing matches 
					
					if (ccattr.content.expression) {
						var result = Circular.parser.eval.call(node,ccattr.content.expression);
	
						
						if (result!=ccattr.content.result) {
						
							ccattr.content.result = result;
							this.debug('@engine.processAttributesIn','changed',ccattr.properties.name,ccattr.content.expression,ccattr.content.result);
							try {
								if (result===undefined) ccattr.content.value = ''; 
								else if (typeof ccattr.content.result == 'object') ccattr.content.value = ccattr.content.original;
								else ccattr.content.value = ccattr.content.result.toString();
							} catch (x) {
								ccattr.content.value = '';
								Circular.log.warn(x);
							}
							if (Circular.watchdog  && ccnode.flags.watched ) { // watched was commented ?
								Circular.watchdog.pass(node,'attrdomchanged',ccattr.properties.name);
							}
							node.setAttribute(ccattr.properties.name,ccattr.content.value);
							//alert(ccattr.content.value);
							
						} 
					} else {
						ccattr.content.result = undefined;
						ccattr.content.value = ccattr.content.original;
					}
					
						
				
				}
			*/
			
			// even if it didnt change, you need to execute it
			// because it could change things for other attributes
			if (ccattr.properties.module) {
				this.debug('@engine.processAttributesIn','executing',ccattr.properties.module);
				var mod = Circular[ccattr.properties.module];
				var uname = Circular.modules.unprefix(ccattr.properties.name);
				var func = mod.attributes[uname].in;
				if (func) {
					var ok = func.call(mod,ccattr,ccnode,node);
					if (ok===false) {
						ccattr.flags.breaking=true;
						ccnode.flags.recurse = false;
						break;
					} else {
						ccattr.flags.breaking=false;
						ccnode.flags.recurse = true;
					}
				}
			} 
			
			
			
				
		}
		
		// see if the context changed
		var context = Circular.context.get();
		if (context!=ccnode.properties.innercontext) {
			ccnode.properties.innercontext=context;
			ccnode.flags.icontextchanged=true;
		}
		
		// return true if none (or only the last one)
		// is breaking. returning false will stop
		// recursion down the node.
		return ccnode.flags.recurse;
			
		
	},
	
	processAttributesOut	: function(node,ccnode) {
		this.debug('@engine.processAttributesOut');
		// loop all modules backwards
		// starting with the last break, if any
		for (var dc=0; dc<ccnode.index.length; dc++) {
			if (ccnode.index[dc].flags.breaking) {
				dc++;
				break;
			}
		}
		for (var dc=dc-1; dc>=0; dc--) {
			var ccattr = ccnode.index[dc];
			if (ccattr.properties.module) {
				this.debug('@engine.processAttributesOut','executing',ccattr.properties.module);
				var mod = Circular[ccattr.properties.module];
				var uname = Circular.modules.unprefix(ccattr.properties.name);
				var func = mod.attributes[uname].out;
				if (func) {
					func.call(mod,ccattr,ccnode,node);
				}
			}
		}
		
	},
	
	parseAttribute	: function(ccattr,ctx) {
		this.debug('@engine.parseAttribute',ccattr.content.original);
		
		// assumes only the original is correct
		
		// checks if the original is an {{expression}}
		// set flags parse, evaluate, watch
		// if parse, parses original into expression
		// else puts original (minus brackets and flags) in expression
		// if watch, gets the paths to watch
		// does NOT yet evaluate
		
		var exprmatches = Circular.parser.match(ccattr.content.original);
		if (exprmatches) {
			if (exprmatches[0]===ccattr.content.original) {
			
			
				// this is a single full expression "{{#foo|we}}"

				var inner 		= ccattr.content.original.substring(2,ccattr.content.original.length-2);
				var flagged 	= Circular.parser.getFlags(inner);
				ccattr.flags.parse		= flagged.parse;
				ccattr.flags.evaluate	= flagged.evaluate;
				ccattr.flags.watch		= flagged.watch;
				
				if (ccattr.flags.parse) {
					ccattr.content.expression = Circular.parser.parse(flagged.expression,ctx);
				} else {
					ccattr.content.expression = flagged.expression;
				}
				if (ccattr.flags.watch) {
					if (ccattr.content.paths) ccattr.content.oldpaths = ccattr.content.paths.slice(0);
					ccattr.content.paths 	= Circular.parser.getPaths(ccattr.content.expression);
				}	
				
				
			} else {
			
				// this is a stringlike thing, "foo {{#bar|pew}} quz"
				// all expressions must always be evaluated
				// any watched paths in any expression will watch that path
				// for the whole attribute.
				
				ccattr.flags.parse		= false; 	// parsing happens here
				ccattr.flags.evaluate	= true;		// must evaluate
				ccattr.flags.watch		= true;		// watch any paths
				
				var watches = [];
				ccattr.content.expression = Circular.parser.replace(ccattr.content.original,function(match,inner) {
					var flagged = Circular.parser.getFlags(inner);					
					var parsed = '';
					if (flagged.parse) {
						parsed = Circular.parser.parse(flagged.expression,ctx);
					} else {
						parsed = inner;
					}
					if (flagged.watch) {
						watches.push(parsed);
					}	
					return '"+('+parsed+')+"';
				});
				// tell eval that this is a stringthing
				ccattr.content.expression = '"'+ccattr.content.expression+'"';
				
				if (ccattr.content.paths) ccattr.content.oldpaths = ccattr.content.paths.slice(0); // copy
				ccattr.content.paths = [];
				for (var wc=0; wc<watches.length;wc++) {
					ccattr.content.paths = ccattr.content.paths.concat(Circular.parser.getPaths(watches[wc]));
				}
				
			}			
			
			this.debug("@engine.parseAttribute",ccattr.content.original,ccattr.content.expression);
			return true;
			
		} else {
			this.debug('@engine.parseAttribute','no match');
			ccattr.content.expression = '';
			ccattr.flags.parse		= false; 	// parsing happens here
			ccattr.flags.evaluate	= false;		// must evaluate
			ccattr.flags.watch		= false;		// watch any paths
			if (ccattr.content.paths) ccattr.content.oldpaths = ccattr.content.paths.slice(0);
			ccattr.content.paths 	= [];
			
		}
		return false;
	},
	
	evalAttribute	: function(node,ccnode,ccattr) {
		
		//alert('eval '+ccattr.properties.name);
		
		// turns the expression into a result, and the
		// result into a value.
		
		this.debug('@engine.evalAttribute',ccattr.properties.name);
	
		//for (var flag in ccattr.flags) {
		//	console.log(flag,ccattr.flags[flag]);
		//}

		
		if (ccattr.content.expression) {
		
			var result = null;	
			if (ccattr.flags.evaluate) {
				result = Circular.parser.eval.call(node,ccattr.content.expression);
			} else {
				result = ccattr.content.expression;
			}
			if (result!=ccattr.content.result) {
			
				ccattr.content.result = result;
				this.debug('@engine.evalAttribute','result changed',ccattr.properties.name);
				
				// try to set a value
				try {
					if (result===undefined) ccattr.content.value = ''; 
					else if (typeof ccattr.content.result == 'object') ccattr.content.value = ccattr.content.original;
					else ccattr.content.value = ccattr.content.result.toString();
				} catch (x) {
					ccattr.content.value = '';
					Circular.log.warn(x);
				}
				
				
			} 
		} else {
			ccattr.content.result = undefined;
			ccattr.content.value = ccattr.content.original;
		}
		
		var setter = null;
		if (ccattr.properties.module) {
			var uname = Circular.modules.unprefix(ccattr.properties.name);
			var setter = Circular[ccattr.properties.module]['attributes'][uname]['set'];
		}
		if (!setter) setter = this.setAttribute;
		setter(ccattr,ccnode,node);

	},
	
	setAttribute		: function(ccattr,ccnode,node)  {
		Circular.engine.debug('@engine.setAttribute');
		var value = ccattr.content.value;		
		if (node.getAttribute(ccattr.properties.name)!=value) {
			if (Circular.watchdog  && ccnode.flags.watched ) { // watched was commented ?
				Circular.watchdog.pass(node,'attrdomchanged',ccattr.properties.name);
			}
			node.setAttribute(ccattr.properties.name,value);
		}
	},
	
	processChildren	: function(node,context) {
		this.debug('@engine.processChildren');
		
		// traverse node depth first looking
		// for modules or expressions,
		// using the new context
		var contents = $(node).contents();
		$(contents).each(function() {
			Circular.engine.process(this,context);
		});
		
	},
	
	
	processTextNode	: function(node,ccnode) {
		this.debug('@engine.processTextNode');
		
		if (ccnode.flags.contentchanged) {
		
			var val = node.textContent;
			var match, exec, nodes = [];
			
			if (this.config.greedy) val=val.trim();
			
			if (matches = Circular.parser.match(val)) {
													
				if (matches.length==1 && matches[0]==val) {
					// this is a full match
					var parent = node.parentNode;
					if (!parent.hasAttribute('cc-content')) {
						this.debug('@engine.processTextNode','setting cc-content on the parent');
						
						// ugly

						//var parccnode = Circular.registry.get(parent,true);
						//if (parccnode.flags.watched) {
							//if (Circular.watchdog) {
							//	Circular.watchdog.pass(parent,'contentchanged');
							//	Circular.watchdog.pass(parent,'attrsetchanged');
							//}
							//parccnode.flags.attrsetchanged=true;
						//}
						
						// ugly too
						//Circular.queue.add(function() {
						//	parent.setAttribute('cc-content',val);
						//	Circular.engine.recycle(parent);
						//});
						
						Circular.queue.add(function() {
							Circular.watchdog.watch(parent);
							parent.setAttribute('cc-content',val);
						});
						
						// parent.removeChild(node);
						// ah well lets already put the content in.
						// cc-content will come again in 2 rounds
						$(parent).html(Circular.parser.result.call(parent,val,ccnode.properties.outercontext));
					
					} else {					
				
						this.debug('@engine.processTextNode','replacing content with single span');
						var span = document.createElement('span');
						var spanid = this.nodeid(span);
						
						span.setAttribute('cc-content',val);
						if (Circular.watchdog) {
							Circular.watchdog.pass(parent,'contentchanged');
						}
						
						parent.insertBefore(span, node);
						parent.removeChild(node);
						this.process(span,ccnode.properties.outercontext);
					}

				} else {
				
					// start splitting up nodes
					this.debug('replacing content with text and spans');
					
					var vals = Circular.parser.split(val);
					for (var vc=0; vc<vals.length;vc++) {
							if (vals[vc].expression) {
								this.debug('@engine.processTextNode','inserting span '+vals[vc].expression);
								var span = document.createElement('span');
								var spanid = this.nodeid(span);
								span.setAttribute('cc-content',vals[vc].expression);
								nodes.push(span);
							} else {
								this.debug('@engine.processTextNode','inserting text '+vals[vc].text);
								nodes.push(document.createTextNode(vals[vc].text));
							}
					}
					
					for (var nc=0; nc < nodes.length; nc++) {
						if (Circular.watchdog) {
							Circular.watchdog.pass(node.parentNode,'contentchanged');
						}
						node.parentNode.insertBefore(nodes[nc], node);
						if (nodes[nc].nodeType==Node.ELEMENT_NODE) {
							this.process(nodes[nc],ccnode.properties.outercontext);
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
	
	processCommentNode	: function(node,ccnode) {
		this.debug('@engine.processCommentNode');
		var matches = node.nodeValue.match(this.settings.rxcomment);
		if (!matches) return false;
		var comm = matches[1], sarg=matches[3];
		if (!comm) return false;
		var mod = Circular.modules.comm2mod[comm];
		if (mod) {
			var arg = undefined;
			if (sarg) arg = Circular.parser.parseval(sarg,Circular.context.get());
			Circular[mod].comments[comm](node,arg);
			return true;
		} else {
			Circular.log.debug('@engine.processCommentNode','command module not found',comm);
		}
		return false;
	},
	
	
	
	
	
	
	debug	: function() {
		if (this.config.debug) {
			Circular.log.debug.apply(Circular.log,arguments);
		}
	}	
	
});