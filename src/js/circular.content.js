
/* ----------------------
	content
----------------------- */

new CircularModule({

	name				: 'content',
	requires		: ['debug'],
	
	css		: '.cc-content-generated {  }',
	in	: function(attr,node,props) {
		Circular.debug.write('mod.content.in','setting content',node,attr.result);
		node.textContent=attr.result;
		$(node).addClass('cc-content-generated');
	}

		
});
