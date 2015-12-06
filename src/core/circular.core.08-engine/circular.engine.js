	
/* ----------------------
	engine
----------------------- */

new CircularModule({

	name				: 'engine',	
	requires		: ['root','context','content','log','debug','registry'],
	config			: { 
		rootselector 	: '',
	},
	counter			: 0,
	genid				: 0,
	
	ejected			: {
		// #id : $placeholder
	},
	
	start				: function() {
		Circular.debug.write('@engine.start ');
		var rootsel = Circular.config.rootselector;
		if (!rootsel) {
			rootsel = '['+Circular.config.attrprefix+'root],';
			rootsel += '['+Circular.config.attrprefix+Circular.config.attrprefix+'root]';
		}
		var $root = $(rootsel);
		if (!$root.size()) $root = $('html');
		this.recycle($root,true);
	},
	
	recycle	: function(nodes,now) {
		Circular.debug.write('@engine.recycle ');
		if (nodes instanceof jQuery) {
			nodes = nodes.toArray();
		}
		
		if (!nodes) return this.cycle();
		
		if (!now) {
			Circular.queue(function() {
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
			var props = Circular.registry.get(node,true);
			if (props.flags.locked) {
				Circular.debug.write('@engine.recycle ','Recycling',node);
				this.process(node);
			} else {
				Circular.debug.write('@engine.recycle ','Node was already recycled',node,props);
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
		Circular.debug.write('@engine.getContext',node.nodeName);
		// you rarely need this. while cycling the document,
		// the context is passed to the process() method or
		// taken from @context.current. only when out of a 
		// cycle, if you address a node that has not been
		// indexed, you may need to find the context it would
		// have had if it were indexed within a cycle.
		var props = Circular.registry.get(node);
		if (props.outercontext) return props.outercontext;
		else {
			var $parents = $(node).parents();
			for (var pc=0; pc < $parents.size(); pc++) {
				var props = Circular.registry.get(node);
				if (props.outercontext) return props.outercontext;
			}
		}
		return Circular.config.rootcontext;
	
	},
	
	process			: function (node,context) {
		Circular.debug.write('@engine.process',node.nodeName,context);
		if (!node) {
			Circular.log.fatal('@engine.process','no node given');
		}
		if (Circular.dead) {
			Circular.log.fatal('@engine.process','Circular died :-|');
			return false;
		}
		
		this.counter++;
		
		var props = Circular.registry.get(node,true);
		props.flags.locked=true; // for new nodes
		
		if (context) {
			if (context != props.outercontext) {
				Circular.debug.write('@engine.process','context changed',props.outercontext,context,node);
				props.outercontext = context;
				props.flags.contextchanged=true;
			} else {
				Circular.debug.write('@engine.process','context not changed');
			}
		} else {
			if (!props.outercontext) {
				Circular.debug.write('@engine.process','no context: using current',node);
				props.outercontext = Circular.context.get();
			} else {
				Circular.debug.write('@engine.process','no context: using stored',props.outercontext,node);
			}
		}
		Circular.context.set(props.outercontext);
		
		switch(node.nodeType) {
		
			case Node.ELEMENT_NODE:
			
				if (this.processElementNode(node,props)) {
					Circular.debug.write('@engine.process','registered',node);
				} else {
					Circular.debug.write('@engine.process','ignored',node);
				}

				break;
				
			case Node.TEXT_NODE:
			
				if (this.processTextNode(node,props)) {
					Circular.debug.write('@engine.process','processed',node);
				} else {
					Circular.debug.write('@engine.process','ignored',node);
				}
				
				break;
				
			case Node.COMMENT_NODE:
			
				Circular.debug.write('@engine.process ','ignoring comments '+node.nodeType);
				break;
				
			default:
			
				Circular.debug.write('@engine.process ','ignoring node type '+node.nodeType);
		}
		
		// if it was registered along the way,
		// now is the time to let go
		if (props.flags.registered) {
			Circular.registry.unlock(node);
		}
		
	},

	processElementNode				: function(node,props) {
		Circular.debug.write('@engine.processElementNode');

		var newcontext = false;

		if (props.flags.contextchanged || props.flags.attrsetchanged || props.flags.attrdomchanged || props.flags.attrdatachanged) {
		
			//if (props.flags.attrdomchanged || props.flags.attrsetchanged ) {
				this.indexAttributes(node,props);
			//}
			
			if (props.attributes.length) {
			
				Circular.debug.write('@engine.processElementNode','processing attrs in ..',node);
				
				// evaluate and fill out attrs, execute modules
				// this will return false if one of the modules
				// return false to interrupt the cycle
				
				var recurse = this.processAttributesIn(node,props);
				
				Circular.debug.write('@engine.processElementNode','processed attrs in',node);


				var innercontext = Circular.context.get();
				if (props.innercontext!=innercontext) {
					newcontext = props.innercontext = innercontext;
				}
				
				// register changes now, so the watchdog can
				// observe changes made by children
				Circular.registry.set(node,props,true);
				
				if ( recurse &&  ( newcontext || props.flags.contentchanged ) ) {
					this.processChildren(node,newcontext);
				} 
				
				Circular.debug.write('@engine.processElementNode','processing attrs out ..',node);
				this.processAttributesOut(node,props);
				Circular.debug.write('@engine.processElementNode','processed attrs out',node);
				
				// register the final version
				Circular.registry.set(node,props,true);
				
				return true;
				
			} else {
				
				// after looking at the attributes,
				// there was nothing particular, but
				
				var innercontext = Circular.context.get();
				if (props.innercontext!=innercontext) {
					newcontext = props.innercontext = innercontext;
				}
				
				if (newcontext || props.flags.contentchanged) {
					
					
					
					// if this was already registered and it changed here,
					// remember that. otherwise, nothing much to remember
					
					if (props.flags.registered) {
						Circular.registry.set(node,props,true);
					} 
					
					Circular.debug.write('@engine.processElementNode','processing content',node);
					
					this.processChildren(node,newcontext);
					
					
					Circular.debug.write('@engine.processElementNode','processed content',node);
					
					// and the final version
					
					if (props.flags.registered) {
						
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
		

			// we can ignore the attributes. but
			
			var innercontext = Circular.context.get();
			if (props.innercontext!=innercontext) {
				newcontext = props.innercontext = innercontext;
			}
			
			if (newcontext || props.flags.contentchanged) {
			
				// if this was already registered and it changed here,
				// remember that. otherwise, nothing much to remember
				
				if (props.flags.registered) {
					Circular.registry.set(node,props,true);
				} 
				
				Circular.debug.write('@engine.processElementNode','processing content',node);
				
				this.processChildren(node,newcontext);
				
				Circular.debug.write('@engine.processElementNode','processed content',node);
				
				// and the final version
				if (props.flags.registered) {
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
		Circular.debug.write('@engine.indexAttributes');
		
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
			
			//attr = props.name2attr[attrname];
			
			// see if it was registered
			for (var ri=0;ri<regattrs.length;ri++) {
				if (regattrs[ri].name==attrname) {
					attr=regattrs[ri];
					break;
				}
			}
			
			// else, create a new property from this attribute
			if (!attr) attr = Circular.registry.newAttribute(attrname);
			
			var attrcname = Circular.modules.attr2cname[attrname];
			var modidx = Circular.modules.attr2idx[attrcname];
			if (modidx!==undefined) {
				var modname = Circular.modules.stack[modidx].name;
				if (this.indexModuleAttribute(node,attr,modname)) {
					mods[modidx]=attr;
					mods[modidx].watches = Circular.modules.stack[modidx].watches;
				}
			} else {
				if (this.indexAttribute(node,attr)) {
					plain.push(attr);
				}
			}
		}
		
		// stack these up in the right order:
		for (var idx in mods) {
			attrs.push(mods[idx]);
		}
		props.attributes = attrs.concat(plain);
		
		// now put the watches in place
		Circular.debug.write('@engine.indexAttributes','attributes pre',props.attributes);
		for (var pc=0; pc < props.attributes.length; pc++) {
			if (props.attributes[pc].watches) {
				for (var wc=0; wc<props.attributes[pc].watches.length;wc++) {
					Circular.debug.write('@engine.indexAttributes','moving watch',props.attributes[pc].watches[wc]);
					for (var pc2=0; pc2 < props.attributes.length; pc2++) {
						if (props.attributes[pc2].name==props.attributes[pc].watches[wc]) {
							Circular.debug.write('@engine.indexAttributes','found watch',props.attributes[pc].watches[wc]);
							// move props.attributes[pc2] before props.attributes[pc]
							props.attributes.splice(pc,0,props.attributes.splice(pc2,1)[0]);
							if (pc2>pc) pc++;
							break;
						}
					}
				}
			}
		}
		Circular.debug.write('@engine.indexAttributes','attributes post',props.attributes);
		
		// map them by name - youll need it
		for (var idx in props.attributes) {
			props.name2attr[props.attributes[idx].name] = props.attributes[idx];
		}
	},
	

	indexModuleAttribute			: function(node,attr,modname) {
		Circular.debug.write('@engine.indexModule',modname);
		
		
		if (this.indexAttribute(node,attr)) {
			// returns true if it is an expression
			
			attr.module=modname;
			return true;
			
		} else {
		
			// even if its not an expression, a module
			// is always registered for just being one. 
			
			if (!attr.flags.registered) {
				attr.cname		= Circular.modules.attr2cname[attr.name];
				attr.module 	= modname;
			}
			var original 	= node.getAttribute(attr.name);
			attr.original = original;
			attr.value		= original;
			attr.result		= original;
				
			return true;
			
		}
		
	},
	
	indexAttribute			: function(node,attr) {
		Circular.debug.write('@engine.indexAttribute',attr.name);
		
		// check if the attribute is an expression
		// update the properties of attr, but
		// dont evaluate it yet - this will happen in
		// processAttributesIn, in the right order
		
		// return true if it should be registered
		// false if it shouldnt
		
		if (attr.flags.attrdomchanged) {
			Circular.debug.write('@engine.indexAttribute','attrdomchanged',attr.original);
			
			var expression = '', original = '';
			
			if (attr.name.indexOf('-debug')==-1) { // hm
			
				// the dom changed, so ignore what was registered:
				attr.original = node.getAttribute(attr.name);
				expression	= attr.expression;
				
				// parse returns an expression without {{}},
				// or an empty string if there is no expression	
				
				if (Circular.parser.parseAttribute(attr,Circular.context.get())) {

					if (Circular.debug.enabled && attr.name!='cc-debug') {
						if (attr.name.indexOf('cc-')==0) node.setAttribute('cc-'+attr.name.substring(3)+'-debug',attr.original);
						else node.setAttribute('cc-'+attr.name+'-debug',attr.original);
					}
			
					return true;
					
				} else {
				
					// so its not an expression (anymore)
					// ignore it or forget it
					
					if (Circular.debug.enabled) {
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
		Circular.debug.write('@engine.processAttributesIn',node);
		// loop all attributes forward
		// evaluate optional expressions
		// if its a module, execute mod.in. 
		// if it returns false, break
		
		//console.log('processAttributesIn',node,attrs);
		
		for (var dc=0; dc<props.attributes.length; dc++) {
		
			var attr = props.attributes[dc];
			
			if (attr.flags.attrdomchanged || attr.flags.attrdatachanged) {
				
				// (re-)eval this attribute, be it a full match
				// or  a string containing matches 
				
				var result = Circular.parser.eval(attr.expression);
				
				if (result!=attr.result) {
				
					attr.result = result;
					Circular.debug.write('@engine.processAttributesIn','changed',attr.name,attr.expression,attr.result);
					try {
						if (result===undefined) attr.value = ''; 
						else if (typeof attr.result == 'object') attr.value = attr.original;
						else attr.value = attr.result.toString();
					} catch (x) {
						attr.value = '';
						Circular.log.warn(x);
					}
					if (Circular.watchdog && props.flags.watched) {
						Circular.watchdog.pass(node,'attrdomchanged',attr.name);
					}
					node.setAttribute(attr.name,attr.value);
					//alert(attr.value);
				}
			}

			// even if it didnt change, you need to execute it
			// because it could change things for other attributes
			if (attr.module) {
				Circular.debug.write('@engine.processAttributesIn','executing',attr.module);
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
		Circular.debug.write('@engine.processAttributesOut');
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
				Circular.debug.write('@engine.processAttributesOut','executing',attr.module);
				var mod = Circular.modules.stack[Circular.modules.name2idx[attr.module]];
				var func = mod.out;
				if (func) {
					func.call(mod,attr,node,props);
				}
			}
		}
		
	},
	
	processChildren	: function(node,context) {
		Circular.debug.write('@engine.processChildren');
		
		// traverse node depth first looking
		// for modules or expressions,
		// using the new context
		var contents = $(node).contents();
		$(contents).each(function() {
			Circular.engine.process(this,context);
		});
		
	},
	
	
	processTextNode	: function(node,props) {
		Circular.debug.write('@engine.processTextNode');
		
		if (props.flags.contentchanged) {
		
			var val = node.textContent;
			var match, exec, nodes = [];
			if (matches = Circular.parser.match(val)) {
													
				if (matches.length==1 && matches[0]==val) {
					// this is a full match
					var parent = node.parentNode;
					if (!parent.hasAttribute('cc-content')) {
						Circular.debug.write('@engine.processTextNode','setting cc-content on the parent');
						
						// ugly
						/*var parprops = Circular.registry.get(parent,true);
						if (parprops.flags.watched) {
							if (Circular.watchdog) {
								Circular.watchdog.pass(parent,'contentchanged');
								Circular.watchdog.pass(parent,'attrsetchanged');
							}
							parprops.flags.attrsetchanged=true;
						}
						parent.setAttribute('cc-content',val);
						*/
						Circular.registry.setAttribute(parent,'cc-content',val);
						parent.removeChild(node);
						//this.process(parent);
					} else {					
						Circular.debug.write('@engine.processTextNode','replacing content with single span');
						var span = document.createElement('span');
						span.setAttribute('id','cc-engine-'+this.genid++);
						/*
							span.setAttribute('cc-content',val);
							if (Circular.watchdog) {
								Circular.watchdog.pass(parent,'contentchanged');
							}
						*/
						Circular.registry.setAttribute(span,'cc-content',val);
						parent.insertBefore(span, node);
						parent.removeChild(node);
						//this.process(span,props.outercontext);
					}

				} else {
				
					// start splitting up nodes
					Circular.debug.write('replacing content with text and spans');
					
					var vals = Circular.parser.split(val);
					for (var vc=0; vc<vals.length;vc++) {
							if (vals[vc].expression) {
								Circular.debug.write('@engine.processTextNode','inserting span '+vals[vc].expression);
								var span = document.createElement('span');
								span.setAttribute('id','cc-engine-'+this.genid++);
								//span.setAttribute('cc-content',vals[vc].expression);
								Circular.registry.setAttribute(span,'cc-content',vals[vc].expression);
								nodes.push(span);
							} else {
								Circular.debug.write('@engine.processTextNode','inserting text '+vals[vc].text);
								nodes.push(document.createTextNode(vals[vc].text));
							}
					}
					
					for (var nc=0; nc < nodes.length; nc++) {
						if (Circular.watchdog) {
							Circular.watchdog.pass(node.parentNode,'contentchanged');
						}
						node.parentNode.insertBefore(nodes[nc], node);
						//if (nodes[nc].nodeType==Node.ELEMENT_NODE) {
						//	this.process(nodes[nc],props.outercontext);
						//}
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
	
	/* node management - unused  */
	
	hide	: function(node,method) {
		if (!method) method = Circular.config.hide;
		if (method=='css') $(node).addClass('cc-engine-hidden');
		else if (method=='dom') this.eject(node,'engine','hide');
	},
	
	show	: function(node,method) {
		if (!method) method = Circular.config.hide;
		if (method=='css') $(node).removeClass('cc-engine-hidden');
		else if (method=='dom') this.inject(node);
	},
	
	eject	: function(node,modname,params) {
	
		if (!modname) modname 	= this.name;
		if (!params) params			= 'eject';
		
		var $ejected = $('#cc-ejected');
		if (!$ejected.size()) {
			$('body').append('<div id="cc-ejected"></div>');
			$ejected = $('#cc-ejected');
		}
		var id = node.getAttribute('id');
		if (id==undefined) {
			id = 'cc-engine-'+this.genid++;
			node.setAttribute('id',id);
		}
		$placeholder = $('<!--@'+modname+'['+JSON.stringify(params)+'][#'+id+']-->');
		$(node).after($placeholder).appendTo($ejected);
		
		this.ejected[id] = $placeholder;
		return id;

	},
	
	inject	: function(node) {
		var id 		= node.getAttribute('id');
		var $placeholder 	= this.ejected[id];
		if ($placeholder) {
			$placeholder.before(node);
			$placeholder.remove();
			delete this.ejected[id];
		} else {
			Circular.log.error('@engine.inject','no placeholder found',id);
		}
	},
	
	detach	: function(node) {
	
	},
	
	attach	: function(node) {
	
	}
	
});