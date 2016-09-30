
/* ----------------------
	monitor
----------------------- */

new CircularModule({

	name			: 'monitor',
	counter		: 0,
	timer			: null,
	interval	: 3000,
	gougeon		: false,
	
	data			: {
		'queue' 		: Circular.queue,
		'engine' 		: Circular.engine,
		'registry' 	: Circular.registry,
		'watchdog' 	: Circular.watchdog
	},
	snapshot	: { },
	
	gaugeone		: {
		engine	: {
			counter	: 180
		},
		registry	: {
			counter 	: 16
		},
		watchdog	: {
			countdobs	: 15,
			countpobs	: 9
		}
	},
	
	gaugerun		: {
		queue	: {
			added		: 2,
			handled	: 2
		},
		engine	: {
			counter	: 9 // confusing
		}
	},
	
	in	: function(attr,node,props) {
		//alert('in: '+attr.result||attr.value)
		//return false;
		this.step();
		this.start();
	},

	out	: function(attr,node,props) {
		//alert('out: '+attr.result||attr.value)
		
	},

	step	: function() {
		
		this.snapshot = JSON.parse(JSON.stringify(this.data,function(key, value) {
  		if (value instanceof PathObserver) return undefined;
  		return value;
		}));
		
		if (this.counter && this.gaugeon) {
			this.gauge(this.gaugeone,this.snapshot,true);
			this.gauge(this.gaugerun,this.snapshot,false);
		}
		
		this.counter++;

	},
	
	gauge	: function(gauge,snap,once) {
		for (key in gauge) {
			if (typeof gauge[key] == 'object') {
				if (!snap[key]) {
					Circular.log.error('@monitor.gauge','no snapshot entry for '+ key);
				} else {
					this.gauge(gauge[key],snap[key],once);
				}
			} else {
				if (!snap[key]) {
					Circular.log.error('@monitor.gauge','no snapshot entry for '+ key);
				} else {
					if (once) snap[key] -= gauge[key];
					else snap[key] -= gauge[key]*this.counter;
				}
			}
		}
	},
	
	start	: function() {
		clearInterval(this.timer);
		this.timer = setInterval(function() { 
			Circular.monitor.step();
		},this.interval);
	},
	stop	: function() {
		clearInterval(this.timer);
	}
		
});



