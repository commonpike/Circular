var Circular = {
	
	/* ----------------------
		config
	----------------------- */
	
	config	: {
		version					: '0.1.6',
		autoinit				:	true
	},
	
	// status
	inited		: false,
	dead			: false,



	/* ----------------------
		init 
	----------------------- */

	init 		: function(config) {
		$(document).ready(function() {
			Circular.modules.init(config);
			if (Circular.log) {
				if (Circular.queue) {
					if (Circular.engine) {
						Circular.queue.add(function() {
							Circular.engine.start();	
						});
					} else {
						Circular.log.fatal('@engine not found');
					} 
				} else {
					Circular.log.fatal('@queue not found');
				}
			} else {
				alert('@log not found');
				Circular.die();
			}
					
		});
		this.inited = true;
	},
	
	die		: function() {
		if (Circular.log) Circular.log.warn('Circular.die()');
		this.dead = true;
	}


}

$(document).ready(function() {
	if (Circular.config.autoinit && !Circular.inited) {
		Circular.init();
	}
});

	/* ----------------------
		modules 
	----------------------- */
	
function CircularModule(def) {

	if (def.name) {
	
		if (!def.in)					def.in 	= function(ccattr,node,ccnode) { return true; }
		if (!def.out) 				def.out = function(ccattr,node,ccnode) { return true; }	
		if (!def.requires)		def.requires = [];
		if (!def.attributes)	def.attributes = ['cc-'+def.name];
		if (!def.override)		def.override = false;
		if (!def.priority)		def.priority = 0;
		if (!def.config)			def.config = {};
		
		if (def.name=='modules') {
			def.add(def);
		} else {
			Circular.modules.add(def);
		}
		
	} else if (Circular.log) {
		Circular.log.fatal('CircularModule.name is required');
	} else {
		alert('CircularModule.name is required');
		Circular.die();
	}
}


	
new CircularModule({
	
	name					: 'modules',
	attrprefix		: 'cc-',
	rxattrprefix	: /^cc-/,
	
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
	
	
	prefix	: function(attrname) {
		if (this.attrprefix!='cc-') {
			return attrname.replace(/^cc-/,this.attrprefix);
		}
		return attrname;
	},
	
	unprefix	: function(attrname) {
		if (this.attrprefix!='cc-') {
			return attrname.replace(this.rxattrprefix,'cc-');
		}
		return attrname;
	},
	
	add	: function(mod) {
	
		if (Circular.debug) {
			Circular.log.debug('Circular.modules.add',mod.name);
		}
		
		if (!Circular.dead) {

			valid = true;
			
			if (this.name2idx[mod.name]) {
				if (!mod.override) {
					if (Circular.log) Circular.log.error('Circular.modules.add','mod.'+mod.name+' namespace already taken');
					valid = false;
				} 
			}
			
			if (mod.requires) {
				mod.requires.forEach(function(name) {
					if (this.name2idx[name]===undefined) {
						if (Circular.log) Circular.log.error('Circular.modules.add','mod.'+mod.name+' requires mod.'+name);
						valid=false;
					}
				},this);
			}
			
			if (valid) {
			
				var idx 			= 0;
				var replace	= false;
				
				if (this.name2idx[mod.name]) {
				
					// we are overriding an old module
					// remove all the stuff pointing to it
					
					var oldidx = this.name2idx[mod.name];
					for (var attr in this.attr2idx) {
						if (this.attr2idx[attr]==oldidx) {
							delete this.attr2idx[attr];
						}
					}
					
					// by default, use the old index
					if (!mod.priority) 	{
						replace	= true;
						mod.priority = oldidx;
					}
				} 
				
				if (mod.priority && mod.priority<this.stack.length) {
					idx = mod.priority;
					if (replace) {
						
						this.stack[idx]=mod;
					} else {
						
						this.stack.splice(idx,0,mod);
						// rewrite all the higher indexes.
						for (var attr in this.attr2idx) {
							if (this.attr2idx[attr]>=idx) {
								this.attr2idx[attr]++;
							}
						}
						
						for (var name in this.name2idx) {
							if (this.name2idx[name]>=idx) {
								this.name2idx[name]++;
							}
						}
						
					}
				} else {
					idx = this.stack.length;
					this.stack.push(mod);
				} 
			
				
				this.name2idx[mod.name]=idx;
				
				for (var ac=0; ac<mod.attributes.length;ac++) {
					var attrname = mod.attributes[ac];
					this.attr2idx[attrname]=idx;
				}
				
				Circular[mod.name]=this.stack[idx];
				
				if (mod.name=="debug" && Circular.config.debug) {
					
					Circular.debug.on();
				}
				
			} else {
				// crucial. i think i want you.
				if (Circular.log) Circular.log.fatal('Circular.modules.add','fatal error');
				Circular.die();
			}
		}

	},
	
	init	: function(config) {
		
		if (Circular.debug) Circular.log.debug('Circular.modules.init');
					
		// optionally rewrite cc- attributes
		if (!config.attrprefix) config.attrprefix='cc-';
		if (config.attrprefix!='cc-') {
			this.attrprefix 	= config.attrprefix;
			this.rxattrprefix = new RegExp('^'+config.attrprefix);
			for (var attrname in this.attr2idx) {
				console.log(attrname,this.prefix(attrname));
				this.attr2idx[this.prefix(attrname)] = this.attr2idx[attrname];
				delete this.attr2idx[attrname];
			}
		}
		
		// create a stylesheet, add all css and config
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
		
		// override config before you init
		$.extend(Circular.config,config);
		
		for (var dc=0; dc < this.stack.length; dc++) {
			if (this.stack[dc]!=this && this.stack[dc].init) {
				this.stack[dc].init();
			}
		}
			
		
	}
	
	
	
});
	


