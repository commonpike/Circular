
/* ----------------------
	eject
----------------------- */

new CircularModule('eject',{

	config				: {
	
	},
	
	settings 			: {
		insertcss		: ['#cc-ejected { display:none }']
	},

	attributes		: [{
		name 	: 'cc-eject',
		in		: function(ccattr,node,ccnode) {
			//alert(ccattr.content.value);
			if (Circular.parser.boolish(ccattr.content.value)) {
				this.flag(node,ccnode,ccattr.properties.name);
			} else {
				this.unflag(node,ccnode,ccattr.properties.name);
			}
		}
	}],
	
	
	// ---------------
	// i would use 'Set' for this if it was
	// supported better by IE
	
	genid		: 0,
	
	clear		: function(node,ccnode) {
		ccnode.flags.ejectors = {};
	},
	
	flag		: function(node,ccnode,flag) {
		ccnode.flags.ejectors[flag]=true;
	},
	
	unflag	: function(node,ccnode,flag) {
		delete ccnode.flags.ejectors[flag];
	},
	
	process	: function(node,ccnode) {
		var flags = Object.keys(ccnode.flags.ejectors);
		if (flags.length) {
			if (!ccnode.flags.ejected) {
				this.apply(node,ccnode,flags[0]);
			}
		} else {
			if (ccnode.flags.ejected) {
				this.restore(node,ccnode);
			}
		}
	},
	
	apply		: function(node,ccnode,flag) {
		$ejected = $('#cc-ejected');
		if (!$ejected.size()) $ejected = $('<div id="cc-ejected">').appendTo('body');
		if (!$(node).attr('id')) $(node).attr('id','cc-eject-'+this.genid++);
		// create a comment just before the node
		// move the node to #cc-ejected
		Circular.log.debug('@eject','ejected #'+$(node).attr('id'),flag);
		ccnode.flags.ejected=true;
	},
	
	restore	: function(node,ccnode) {
		// find the comment belonging to the node
		// move the node after the comment
		// remove the comment
		Circular.log.debug('@eject','restored #'+$(node).attr('id'));
		ccnode.flags.ejected=false;
	}

	
		
});
