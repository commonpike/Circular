
/* ----------------------
	hide
----------------------- */

new CircularModule({

	name			: 'hide',
	requires	: ['debug'],
	css				: '.cc-hide { display:none; }',
	
	in	: function(attr,node,props) {
		Circular.debug.write('mod.hide.in',node);
		$(node).toggleClass('cc-hide',attr.result);
	}
	
		
});



