
/* ----------------------
	hide
----------------------- */

new CircularModule({

	name				: 'hide',
	attributes	: ['cc-hide','cc-show'],
	requires		: ['debug','engine'],
	css					: '.cc-hide { display:none; }',

	in	: function(attr,node,props) {
		Circular.debug.write('@hide.in',node);
		if (Circular.parser.boolish(attr.value)) {
			if (Circular.modules.attr2cname[attr.name]=='cc-show') {
				this.show(node);
				return true;
			} else {
				this.hide(node);
				return false;
			}
		} else {
			if (Circular.modules.attr2cname[attr.name]=='cc-show') {
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



