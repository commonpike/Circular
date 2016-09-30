
/* ----------------------
	hide
----------------------- */

new CircularModule({

	name				: 'hide',
	attributes	: ['cc-hide','cc-show'],
	requires		: ['debug','engine'],
	css					: '.cc-hide { display:none!important; }',

	in	: function(ccattr,node,ccnode) {
		Circular.debug.write('@hide.in',node);
		if (Circular.parser.boolish(ccattr.value)) {
			if (Circular.modules.attr2cname[ccattr.name]=='cc-show') {
				this.show(node);
				return true;
			} else {
				this.hide(node);
				return false;
			}
		} else {
			if (Circular.modules.attr2cname[ccattr.name]=='cc-show') {
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



