/* ----------------------
	debug
----------------------- */

new CircularModule({

	name				: 'debug',
	requires	: ['log'],
	config		: {
		debug	: false
	},
	
	enabled		: false,

	init	: function() {
		if (Circular.config.debug) {
			this.toggle(true);
		}
	},
	
	in	: function(ccattr,node,ccnode) {
		this.write('mod.debug',node);
		ccattr.outer = this.enabled;
		if (Circular.parser) this.toggle(Circular.parser.boolish(ccattr.content.value));
		else this.toggle(!ccattr.content.original || ccattr.content.result); // simpleparse
	},
	
	out	: function(ccattr,node,ccnode) {
		this.toggle(ccattr.outer);
		delete ccattr.outer;
	},
	
	toggle: function(state) 	{ 
		if (state===undefined) state = !this.enabled;
		if (!state) this.write('mod.debug - off');
		this.enabled=state; 
		if (state) this.write('mod.debug - on');
	},
	on	: function() {
		this.toggle(true);
	}, 
	off : function() {
		this.toggle(false);
	},
	write	: function() {
		if (this.enabled) {
			if (Circular.engine) {
				arguments = Array.prototype.concat.apply([Circular.engine.counter], arguments);
			}
			Circular.log.write(arguments);
		}
	}
	
	
});