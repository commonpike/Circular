
/* ----------------------
	queue	
----------------------- */

new CircularModule('queue', {

	config				: {
		debug	: false
	},
	
	settings 			: {
		requiremods		: ['log']
	},

	attributes		: [
	
	],
	
	// ----------
	
	added				: 0,
	handled			: 0,
	todo				: [],
	paused			: false,
	
	add		: function(func) {
		this.debug("@queue.add",this.added++);
		this.todo.push(func);
		if (this.todo.length==1) this.next();
	}, 
	
	next	: function() {
		if (!Circular.dead) {
			if (this.todo.length) {
				this.debug("@queue.next","executing",this.handled++,"pending",this.todo.length-1);
				this.todo[0].call();
				this.todo.shift();
				this.next();
			} else {
				this.debug("@queue.next","all done.");
			}
		} else {
			Circular.log.warn("@queue.next","Circular died X-|");
		}
	},
	
	pause	: function(p) {
		this.paused = !!p;
	},
			
	debug	: function() {
		if (this.config.debug) {
			Circular.log.debug.apply(Circular.log,arguments);
		}
	}	
	
});
