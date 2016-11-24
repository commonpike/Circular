
/* ----------------------
	hide
----------------------- */

new CircularModule('hide',{

	settings		: {
		insertcss : ['.cc-hide { display:none!important; }']
	},
	
	attributes	: {
	
		'cc-hide' : {
			in	: function(ccattr,ccnode,node) {
				if (Circular.parser.boolish(ccattr.content.value)) {
					Circular.log.debug('@hide','cc-hide','hide',node);
					this.hide(node);
					return false;
				} else {
					Circular.log.debug('@hide','cc-hide','show',node);
					this.show(node);
					return true;
				}
			}
		},
		
		'cc-show': {
			out	: function(ccattr,ccnode,node) {
				if (Circular.parser.boolish(ccattr.content.value)) {
					Circular.log.debug('@hide','cc-show','show',node);
					this.show(node);
					return true;
				} else {
					Circular.log.debug('@hide','cc-show','hide',node);
					this.hide(node);
					return false;
				}
			}
		}
	},

	// -----
	
	hide	: function(node) {
		$(node).addClass('cc-hide');
	},
	show	: function(node) {
		$(node).removeClass('cc-hide');
	}
	
		
});



