var Circular = {
	
	/* ----------------------
		vars
	----------------------- */
	
	config		: {},
	autoinit	:	true,
	version		: '0.1.8',
	inited		: false,
	dead			: false,



	/* ----------------------
		init 
	----------------------- */

	init 		: function(config) {
		if (!this.inited) {
			if (!config) config={};
			this.config	= config;
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
		} else {
			if (Circular.log) {
				Circular.log.error('Circular already inited');
			} else {
				alert('Circular already inited, but @log not found');
			}
		}
		this.inited = true;
	},
	
	/* ----------------------
		die 
	----------------------- */
	
	die		: function() {
		if (Circular.log) Circular.log.warn('Circular.die()');
		this.dead = true;
	}


}

$(document).ready(function() {
	if (Circular.autoinit && !Circular.inited) {
		Circular.init();
	}
});

	
	


