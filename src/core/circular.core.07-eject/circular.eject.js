
/* ----------------------
	eject
----------------------- */

new CircularModule('eject',{

	config				: {
	
	},
	
	settings 			: {
		insertcss		: ['#cc-ejected { display:none }']
	},

	attributes		: {
		'cc-eject' : {
			in		: function(ccattr,ccnode,node) {
				//alert(ccattr.content.value);
				if (Circular.parser.boolish(ccattr.content.value)) {
					this.flag(node,ccnode,ccattr.properties.name);
				} else {
					this.unflag(node,ccnode,ccattr.properties.name);
				}
			}
		}
	},
	
	comments			: {
		'eject'	: function(arg) {
			var nodeid=arg[1];
			Circular.engine.processNodeElement($(nodeid),Circular.context.get());
		}
	},
	
	// ----------------
	// this module has preprocess and postprocess
	// calls hardcoded into the engine. 
	// arent you jealous now.
	
	
	preprocess		: function(node,ccnode) {
		ccnode.flags.ejectors = {};
	},
	
	postprocess	: function(node,ccnode) {
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
	

	// ---------------
	// i would use 'Set' for this if it was
	// supported better by IE. now i use object.keys.
	
	// this is where we store comment references
	ejected	: { },
	
	flag		: function(node,ccnode,flag) {
		ccnode.flags.ejectors[flag]=true;
	},
	
	unflag	: function(node,ccnode,flag) {
		delete ccnode.flags.ejectors[flag];
	},
	
	
	apply		: function(node,ccnode,flag) {
		if (!ccnode.flags.ejected) {
			$ejected = $('#cc-ejected');
			if (!$ejected.size()) $ejected = $('<div id="cc-ejected">').appendTo('body');
			var nodeid=Circular.engine.nodeid(node);
			
			// create a comment just before the node
			var comment = document.createComment('@eject[["'+flag+'","#'+nodeid+'"]]');
			node.parentNode.insertBefore(comment,node);
			this.ejected[nodeid]=comment;
			
			// move the node to #cc-ejected
			$(node).appendTo($ejected);
			ccnode.flags.ejected=true;
			Circular.log.debug('@eject.apply','ejected #'+nodeid,flag);
			
		} else {
			Circular.log.error('@eject.apply','#'+nodeid,'flags.ejected=true; not ejecting');
		}
	},
	
	restore	: function(node,ccnode) {
		// find the comment belonging to the node
		// move the node after the comment
		// remove the comment
		if (ccnode.flags.ejected) {
			var nodeid=Circular.engine.nodeid(node);
			var comment = this.ejected[nodeid];
			if (comment) {
				comment.parentNode.insertBefore(node,comment);
				comment.parentNode.removeChild(comment);
				ccnode.flags.ejected=false;
				delete this.ejected[nodeid];
				Circular.log.debug('@eject.restore','restored #'+$(node).attr('id'));
				
			} else {
				Circular.log.error('@eject.restore','#'+nodeid,'no comment found in @eject.ejected');
			}
		} else {
			Circular.log.error('@eject.restore','#'+nodeid,'flags.ejected=false; not restoring');
		}
	}

	
		
});
