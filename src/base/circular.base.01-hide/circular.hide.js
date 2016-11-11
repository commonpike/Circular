
/* ----------------------
	hide
----------------------- */

new CircularModule({

	name				: 'hide',
	attributes	: ['cc-hide','cc-show'],
	requires		: ['debug','engine'],
	css					: '.cc-hide { display:none!important; }',

	in	: function(ccattr,ccnode,node) {
		Circular.log.debug('@hide.in',node);
		if (Circular.parser.boolish(ccattr.content.value)) {
			if (Circular.modules.unprefix(ccattr.properties.name)=='cc-show') {
				this.show(node);
				return true;
			} else {
				this.hide(node);
				return false;
			}
		} else {
			if (Circular.modules.unprefix(ccattr.properties.name)=='cc-show') {
				this.hide(node);
				return false;
			} else {
				this.show(node);
				return true;
			}
		}
	},
	hide	: function(node) {
		$(node).addClass('cc-hide');
	},
	show	: function(node) {
		$(node).removeClass('cc-hide');
	}
	
		
});



