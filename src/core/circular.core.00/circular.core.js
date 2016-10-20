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
		if (!config) config={};
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

	
	


