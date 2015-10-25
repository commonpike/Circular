var Circular = {
	
	/* ----------------------
		config
	----------------------- */
	
	config	: {
		version					: '0.0.9'		
	},
	
	// status
	inited	: false,
	dead		: false,
	

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
					if (Circular.log) Circular.log.error('Circular.modules.add','mod.'+mod.name+' namespace already taken');
					valid = false;
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
					
					if (mod.name=="debug" && Circular.config.debug) {
						Circular.debug.on();
					}
					
				} else {
					//crucial
					if (Circular.log) Circular.log.fatal('Circular.modules.add','fatal error');
					Circular.die();
				}
			}

		},
		
		init	: function(config) {
			
			if (Circular.debug) Circular.debug.write('Circular.modules.init');
			
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
		if (!this.inited) {
			$(document).ready(function() {
				Circular.modules.init(config);
				if (Circular.engine) {
					Circular.engine.cycle();	
				} else if (Circular.log) {
					Circular.log.fatal('Circular mod.engine not found');
				} else {
					alert('Circular mod.engine and mod.log not found');
					Circular.die();
				}
			});
			this.inited = true;
		} 
	},
	
	die		: function() {
		this.dead = true;
	}


}


$(document).ready(function() {
	Circular.init();
});

function CircularModule(def) {
	if (def.name) {
		if (!def.in)		def.in 	= function(attr,node,props) { return true; }
		if (!def.out) 	def.out = function(attr,node,props) { return true; }	
		Circular.modules.add(def);
	} else if (Circular.log) {
		Circular.log.fatal('CircularModule.name is required');
	} else {
		alert('CircularModule.name is required');
		Circular.die();
	}
}
