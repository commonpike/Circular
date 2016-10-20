
/* ----------------------
	queue
	
	todo: add pause 
	
----------------------- */

new CircularModule({

	name				: 'queue',
	requires		: ['log'],
	added				: 0,
	handled			: 0,
	todo				: [],
	paused			: false,
	
	add		: function(func) {
		Circular.log.debug("@queue.add",this.added++);
		this.todo.push(func);
		if (this.todo.length==1) this.next();
	}, 
	
	next	: function() {
		if (!Circular.dead) {
			if (this.todo.length) {
				Circular.log.debug("@queue.next","executing",this.handled++,"pending",this.todo.length-1);
				this.todo[0].call();
				this.todo.shift();
				this.next();
			} else {
				Circular.log.debug("@queue.next","all done.");
			}
		} else {
			Circular.log.warn("@queue.next","Circular died X-|");
		}
	},
	
	pause	: function(p) {
		this.paused = !!p;
	}
			
		
});
