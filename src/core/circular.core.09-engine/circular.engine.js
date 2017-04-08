	
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
	
/*

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

	
*/	

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

		nodes.forEach(function(node) {
			// lock nodes
			Circular.registry.lock(node);
		});
		
		var forest = this.makeSparseTrees(nodes);
		
		forest.forEach(function(tree) {
			this.recycleTree(tree);
		},this);

		
		return true;
	},
	
	recycleTree	: function(tree) {
		this.debug('recycleTree',tree);
		if ((document.contains && document.contains(tree.node)) || 
			(document.body.contains(tree.node) || document.head.contains(tree.node))) {
		//	console.log('get',node);
			var ccnode = Circular.registry.get(tree.node,true);
			if (ccnode.flags.locked) {
				this.debug('@engine.recycle ','Recycling',tree.node);
				this.process(tree.node);
			} else {
				this.debug('@engine.recycle ','Node was already recycled',tree.node,ccnode);
			}
		} else {
			// is this leaking ?
			this.debug('@engine.recycle ','Node was removed',tree.node,ccnode);
			Circular.registry.unlock(tree.node);
		}
		tree.children.forEach(function(tree) {
			this.recycleTree(tree);
		},this);
	},
	
	makeSparseTrees	: function(nodes) {
			
		//console.log(nodes);
		
		var trees = [];
		nodes.forEach(function(node,index) {
		
			var newtree = {
				index		: index,
				node		: node,
				children: [],
				parent 	: -1
			}
			trees[index] = newtree;
			
			trees.forEach(function(looptree) {
				
				if (looptree.index!=index) {
					var parent,child;
					if (newtree.node.contains(looptree.node)) {
						parent = newtree; 
						child = looptree;
					} else if (looptree.node.contains(newtree.node)) {
						parent = looptree; 
						child = newtree;
					}
					if (parent) {
						if (child.parent==-1) {
							// ill be your first parent
							child.parent=parent.index;
						} else if (!parent.node.contains(trees[child.parent].node)) {
							// I am a closer parent 
							child.parent=parent.index;
						} else {
							// I'm your grandparent, ok
						}
					}
				}
			});			
		});				
		
		// lets assemble the tree
		
		trees.forEach(function(tree) {
			if(tree.parent !== -1) {
				trees[tree.parent].children.push(tree);
			}
		});
						
		// and cut off dupe branches
		
		var roots = trees.filter(function(tree) { 
			return (tree.parent == -1); 
		});
						
		return roots;
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
		
		if (node.hasAttribute('cc-engine-skip')) {
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
				} else this.debug('@engine.processElementNode','pristine','flags.recurse=false');
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
				}  else this.debug('@engine.processElementNode','attrsetchanged','flags.recurse=false');
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
				}  else this.debug('@engine.processElementNode','attrdomchanged','flags.recurse=false');
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
				}  else this.debug('@engine.processElementNode','attrdatachanged','flags.recurse=false');
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
					} else this.debug('@engine.processElementNode','ocontextchanged','no need to recurse');
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
				}  else this.debug('@engine.processElementNode','contentchanged','flags.recurse=false');
			} else {
				this.processChildren(node,ccnode.properties.innercontext);
			}
		}
		
	},

	
	
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
				} else if (Circular.parser.hasExpression(node.attributes[ac].value)) {
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
					} else if (Circular.parser.hasExpression(node.attributes[ac].value)) {
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
					var ccattr 									= Circular.registry.newCCattribute(attrname);
					ccattr.properties.module		= Circular.modules.attr2mod[attrname];
					ccattr.content.original 		= node.getAttribute(attrname);
					ccnode.attributes[attrname] = ccattr;
					ccnode.index[attridx] 			= ccattr;
				}
			}
			
		} else {
			Circular.log.error('@engine.indexAttributes','no need to index?')
		}
			
		
	}, 
	

	
	
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
				this.execParse(ccattr,Circular.context.get());
			}
		
			if (ccattr.flags.attrdomchanged || ccattr.flags.attrdatachanged) {
				//alert('adc '+ccattr.properties.name);
				this.debug('@engine.processAttributesIn','processing',ccattr.properties.name);
				this.execEvaluate(node,ccnode,ccattr);
				this.execInsert(node,ccnode,ccattr);
				
			}

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
		
		if (ccnode.flags.recurse) {
			// set the inner context
			var context = Circular.context.get();
			if (context!=ccnode.properties.innercontext) {
				ccnode.properties.innercontext=context;
				ccnode.flags.icontextchanged=true;
			}
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
	
	execParse	: function(ccattr,ctx) {
		this.debug('@engine.execParse',ccattr.content.original);
		
		// assumes only the original is correct
		
		// checks if the original is an {{expression}}
		// set flags parse, evaluate, watch
		// if parse, parses original into expression
		// else puts original (minus brackets and flags) in expression
		// if watch, gets the paths to watch
		// does NOT yet evaluate
		
		var matches = Circular.parser.match(ccattr.content.original);
		if (matches) {
			if (matches[0]===ccattr.content.original) {
			
			
				// this is a single full expression "{{#foo|we}}"

				var parsed 	= Circular.parser.parse(ccattr.content.original,ctx,true,true);
				ccattr.flags.parse		= parsed.flags.parse; 	
				ccattr.flags.evaluate	= parsed.flags.evaluate;		
				ccattr.flags.watch		= parsed.flags.watch;		
				ccattr.flags.insert		= parsed.flags.insert;		
				ccattr.content.expression = parsed.processed;
				
				if (ccattr.flags.watch) {
					if (ccattr.content.paths) ccattr.content.oldpaths = ccattr.content.paths.slice(0); // copy
					ccattr.content.paths 	= Circular.parser.getPaths(ccattr.content.expression);
				}	
				
				
			} else {
			
				
				// this is a stringlike thing, "foo {{#bar|pew}} quz"
				// all expressions must always be evaluated
				// any watched paths in any expression will watch that path
				// for the whole attribute.
				
				ccattr.flags.parse		= false; 	// parsing happens on inner
				ccattr.flags.evaluate	= true;		// must evaluate all
				ccattr.flags.watch		= true;		// watch any paths marked |w
				ccattr.flags.insert		= true;		// insert everything
				
				var watches = [];
				ccattr.content.expression = Circular.parser.replace(ccattr.content.original,function(match,inner) {
					var parsed = Circular.parser.parse(inner,ctx,true);
					if (parsed.flags.watch) watches.push(parsed.processed);
					return '"+('+parsed.processed+')+"';
				});
				// tell eval that this is a stringthing
				ccattr.content.expression = '"'+ccattr.content.expression+'"';
				
				
				if (ccattr.content.paths) ccattr.content.oldpaths = ccattr.content.paths.slice(0); // copy
				ccattr.content.paths = [];
				//console.info(watches);
				for (var wc=0; wc<watches.length;wc++) {
					ccattr.content.paths = ccattr.content.paths.concat(Circular.parser.getPaths(watches[wc]));
				}
				//console.info(ccattr.content.paths);
				
				
			}			
			
			this.debug("@engine.execParse",ccattr.content.original,ccattr.content.expression);
			return true;
			
		} else {
			this.debug('@engine.execParse','no match');
			ccattr.content.expression = '';
			ccattr.flags.parse		= false; 	
			ccattr.flags.evaluate	= false;		
			ccattr.flags.watch		= false;	
			ccattr.flags.insert		= false;	
			if (ccattr.content.paths) ccattr.content.oldpaths = ccattr.content.paths.slice(0);
			ccattr.content.paths 	= [];
			
		}
		return false;
	},
	
	execEvaluate	: function(node,ccnode,ccattr) {
		
		//alert('eval '+ccattr.properties.name);
		
		// turns the expression into a result, and the
		// result into a value.
		
		this.debug('@engine.execEvaluate',ccattr.properties.name);
	
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
			if (result!==ccattr.content.result) {
			
				ccattr.content.result = result;
				this.debug('@engine.execEvaluate','result changed',ccattr.properties.name);
				
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
		
		this.execInsert(node,ccnode,ccattr);
		

	},
	
	execInsert			: function(node,ccnode,ccattr) {
		Circular.engine.debug('@engine.execInsert');
		if (ccattr.flags.insert) {
			var setter = null;
			if (ccattr.properties.module) {
				var uname = Circular.modules.unprefix(ccattr.properties.name);
				var setter = Circular[ccattr.properties.module]['attributes'][uname]['insert'];
			}
			if (!setter) setter = this.insertAttribute;
			setter(ccattr,ccnode,node);
		} else {
			Circular.engine.debug('@engine.execInsert','ignored');
		}
	},
	
	insertAttribute		: function(ccattr,ccnode,node)  {
		Circular.engine.debug('@engine.insertAttributeValue');
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
		
		if (node.nodeName=='XMP' || node.nodeName=='CODE') {
			Circular.log.debug('@engine','processChildren','not recursing',node.nodeName);
			return false;
		} 
		
		// traverse node depth first looking
		// for modules or expressions,
		// using the new context
		var contents = $(node).contents();
		$(contents).each(function() {
			Circular.engine.process(this,context);
		});
		
		return true;
		
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
					if (parent.childNodes.length==1 && !parent.hasAttribute('cc-content')) {
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
						$(parent).html(Circular.parser.result.call(parent,val,ccnode.properties.outercontext,true,true));
					
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