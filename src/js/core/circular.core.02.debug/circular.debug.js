/* ----------------------
	debug
----------------------- */

new CircularModule({

	name			: 'debug',
	enabled		: false,
	requires	: ['log'],
	config		: {
		debugging	: false
	},
	
	init	: function() {
		if (Circular.config.debugging) {
			this.on();
		}
	},
	
	in	: function(attr,node,props) {
		this.write('mod.debug',node);
		attr.outer = this.enabled;
		if (Circular.parser) this.toggle(Circular.parser.boolish(attr.value));
		else this.toggle(!attr.original || attr.result); // simpleparse
	},
	
	out	: function(attr,node,props) {
		this.toggle(attr.outer);
		delete attr.outer;
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