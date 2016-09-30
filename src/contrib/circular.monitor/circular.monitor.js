
/* ----------------------
	monitor
----------------------- */

new CircularModule({

	name			: 'monitor',
	counter		: 0,
	timer			: null,
	interval	: 2500,
	biason		: true,
	paused		: false,
	
	config			: {
		monitor : { 
			observe	: {
				queue 		: [
					'added',
					'handled',
					'todo'
				],
				engine 		: [
					'counter'
				],
				registry 	: [
					'counter'
				],
				watchdog 	: [
					'pathobservers',
					'countdobs',
					'countpobs',
					'eventsin'
				]
			},
			biasone		: {
				queue	: {
					added		: 12,
					handled	: 12
				},
				engine	: {
					counter	: 228
				},
				registry	: {
					counter 	: 21
				},
				watchdog	: {
					countdobs	: 21,
					countpobs	: 0
				}
			},
			
			biaseach		: {
				queue	: {
					added		: 2,
					handled	: 2
				},
				engine	: {
					counter	: 10 // confusing
				}
			}
		}
	},
	
	data 			: { },
	
	snapshot	: { },
	
	
	
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
		if (Circular.dead) this.stop();
		
		this.harvest();
		
		this.snapshot = JSON.parse(JSON.stringify(this.data,function(key, value) {
  		if (value instanceof PathObserver) return undefined;
  		return value;
		}));
		
		// clean up 
		this.snapshot.watchdog.paths = [];
		for (path in this.snapshot.watchdog.pathobservers) {
			if (path.indexOf('Circular.monitor')!=0) {
				this.snapshot.watchdog.paths.push(path);
			}
		}
		if (this.counter && this.biason) {
			this.bias(this.config.monitor.biasone,this.snapshot,true);
			this.bias(this.config.monitor.biaseach,this.snapshot,false);
		}
		
		this.counter++;

	},
	
	harvest	: function(keys,src,dst) {
		//Circular.log.write('@monitor.harvest ',keys,src,dst);
		if (!keys) keys = this.config.monitor.observe;
		if (!src) src		= Circular;
		if (!dst) dst 	= this.data;
		for (key in keys) {
			if (typeof keys[key] == 'string') {
				dst[keys[key]]=src[keys[key]];
			} else {
				dst[key] = {};
				Circular.monitor.harvest(keys[key],src[key],dst[key]);
			}
		}
	},
	
	bias	: function(bias,snap,once) {
		for (key in bias) {
			if (typeof bias[key] == 'object') {
				if (!snap[key]) {
					Circular.log.error('@monitor.bias','no snapshot entry for '+ key);
				} else {
					this.bias(bias[key],snap[key],once);
				}
			} else {
				if (!snap[key]) {
					Circular.log.error('@monitor.bias','no snapshot entry for '+ key);
				} else {
					if (once) snap[key] -= bias[key];
					else snap[key] -= bias[key]*this.counter;
				}
			}
		}
	},
	
	start	: function() {
		this.paused = false;
		clearInterval(this.timer);
		this.timer = setInterval(function() { 
			Circular.monitor.step();
		},this.interval);
	},
	stop	: function() {
		this.paused = true;
		clearInterval(this.timer);
	}
		
});



