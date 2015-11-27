/* ----------------------
	log
----------------------- */

new CircularModule({

	name	: 'log',
	
	in		: function(attr,node,props) {
		this.info(attr.value);
	},
	
	write		: function() {
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
		console.error.apply(console,arguments);
		Circular.die();
	}
});