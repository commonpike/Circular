var Flower = {

	timer				: null,
	preset			: {},
	current			: '',
	
	start	: function() {
		this.step();
	},
	
	step	: function() {
		clearTimeout(this.timer);
		Flower.preset.petals.forEach(function(petal) {
			petal.rotate += petal.speed; 
		});
		this.timer = setTimeout(function() {
			Flower.step();
		},this.preset.speed);
	},
	
	stop	: function() {
		clearTimeout(this.timer);
		this.cleanup();
	},
	
	cleanup	: function() {
		Flower.preset.petals.forEach(function(petal) {
			petal.rotate = petal.rotate%360;
		});
	},
	
	align		: function() {
		Flower.preset.petals.forEach(function(petal,index) {
			petal.rotate = index*360/Flower.preset.petals.length;
		});
	},
	
	save	: function() {
		var name = prompt('Give it a name');
		if (name) {
			this.presets[name]=$.extend({},this.preset);
			this.current = name;
			// bad: doesnt listen to object changes
			$('#controls select').toggleClass('update');
			// and, doesnt apply selected. we need to think
			setTimeout(function() {
				$('#controls select').val(name);
			},1000);
		}
	},
	
	export	: function() {
		this.cleanup();
		var $temp = $("<input>");
		$("body").append($temp);
		$temp.val(JSON.stringify(Flower.preset)).select();
		document.execCommand("copy");
		$temp.remove();
		alert('Preset copied to clipboard.');
	},
	
	select	: function(preset) {
		this.current = preset;
		this.preset = this.presets[preset];
	},
	
	presets : {
		"RotatingRed"	: {"bgcolor":"#333","bordercolor":"rgba(0,0,0,.2)",borderwidth:10,"blendmode":"screen","speed":1000,"petals":[{"show":true,"speed":15,"rotate":240,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":325,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":330,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":55,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":60,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":145,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":150,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":235,"color":"red","opacity":0.5}]},
		"HippyYippie"	: {"bgcolor":"#333","bordercolor":"rgba(0,0,0,.2)",borderwidth:10,"blendmode":"screen","speed":1000,"petals":[{"show":true,"speed":-15,"rotate":180,"color":"green","opacity":0.5},{"show":true,"speed":10,"rotate":285,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":270,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":15,"color":"red","opacity":0.5},{"show":true,"speed":-15,"rotate":0,"color":"green","opacity":0.5},{"show":true,"speed":10,"rotate":105,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":90,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":195,"color":"red","opacity":0.5}]},
		"Morphology"	: {"bgcolor":"#333","bordercolor":"rgba(0,0,0,.2)",borderwidth:10,"blendmode":"screen","speed":1000,"petals":[{"show":true,"speed":-15,"rotate":-120,"color":"green","opacity":0.5},{"show":true,"speed":5,"rotate":125,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":210,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":215,"color":"red","opacity":0.5},{"show":true,"speed":-15,"rotate":-300,"color":"green","opacity":0.5},{"show":true,"speed":5,"rotate":315,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":30,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":35,"color":"red","opacity":0.5}]},
		"AppleNewton"	: {"bgcolor":"#000","bordercolor":"rgba(0,0,0,.2)",borderwidth:10,"blendmode":"exclusion","speed":1000,"petals":[{"show":true,"speed":15,"rotate":1320,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":685,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":1050,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":775,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":1140,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":865,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":1230,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":955,"color":"red","opacity":0.5}]},
		"Marguerite" 	: {"bgcolor":"#333","bordercolor":"rgba(255,255,255,1)","borderwidth":100,"blendmode":"screen","speed":300,"petals":[{"show":true,"speed":15,"rotate":195,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":55,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":285,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":145,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":15,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":235,"color":"red","opacity":0.5},{"show":true,"speed":15,"rotate":105,"color":"yellow","opacity":0.25},{"show":true,"speed":10,"rotate":325,"color":"red","opacity":0.5}]},		
		"Diorama" 		: {"bgcolor":"#111","bordercolor":"rgba(0,0,0,.2)","borderwidth":100,"blendmode":"color-dodge","speed":1000,"petals":[{"show":true,"speed":-15,"rotate":0,"color":"blue","opacity":0.25},{"show":true,"speed":5,"rotate":45,"color":"white","opacity":0.25},{"show":true,"speed":15,"rotate":90,"color":"purple","opacity":0.5},{"show":true,"speed":-10,"rotate":135,"color":"red","opacity":0.25},{"show":true,"speed":-15,"rotate":180,"color":"blue","opacity":0.25},{"show":true,"speed":5,"rotate":225,"color":"white","opacity":0.25},{"show":true,"speed":15,"rotate":270,"color":"purple","opacity":0.5},{"show":true,"speed":-10,"rotate":315,"color":"red","opacity":0.25}]},
		"Primus"			: {"bgcolor":"#000","bordercolor":"rgba(0,0,0,.2)","borderwidth":"10","blendmode":"exclusion","speed":1000,"petals":[{"show":true,"speed":15,"rotate":0,"color":"white","opacity":0.25},{"show":true,"speed":10,"rotate":45,"color":"red","opacity":0.25},{"show":true,"speed":15,"rotate":90,"color":"white","opacity":0.25},{"show":true,"speed":10,"rotate":135,"color":"red","opacity":0.25},{"show":true,"speed":15,"rotate":180,"color":"white","opacity":0.25},{"show":true,"speed":10,"rotate":225,"color":"red","opacity":0.25},{"show":true,"speed":15,"rotate":270,"color":"white","opacity":0.25},{"show":true,"speed":10,"rotate":315,"color":"red","opacity":0.25}]}
	}
	
}