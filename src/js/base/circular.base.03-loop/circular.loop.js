
/* ----------------------
	template
----------------------- */

new CircularModule({

	name				: 'loop',
	requires		: ['debug','template'],
	attributes	: ['cc-loop'],
	watches			: ['cc-loop-offset', 'cc-loop-limit' ],
	css					: '.cc-loop-template { display:none; } .cc-loop-expired, .cc-loop-item {} ',


	genid		: 0,
	offset	: 0,
	limit		: 0,
	index		: 0,
	key			: undefined,
	first		: false,
	last		: false,
	
	in	: function(attr,node,props) {

		Circular.debug.write('@loop.in',node);
		
		var $node = $(node);
		
		// make sure it has an id
		var nodeid = $node.attr('id');
		if (!nodeid) {
			nodeid = 'cc-loop-'+this.genid++;
			$node.attr('id',nodeid);
		}
		
		
		
		// find a template or make one
		var $template = $node.children('.cc-loop-template');
		if (!$template.size()) {
			Circular.debug.write('@loop.in','creating template');
			Circular.watchdog.pass(node,'contentchanged');
			if ($node.children().size()==1 && $node.contents().size()==1) {
				$template = $node.children().addClass('cc-loop-template').attr('cc-template','');
			} else {
				Circular.debug.write('@loop.in','adding template wrapper');
				$node.contents().wrapAll('<div cc-template class="cc-loop-template"></div>');
				$template = $node.children('.cc-loop-template');
			}
		}
		
		// mark all other children expired
		$node.children(':not(.cc-loop-template)').addClass('cc-loop-expired');

		// check for offset and limit
		this.offset = $node.attr('cc-loop-offset')*1;
		if (!this.offset) this.offset =0;
		this.limit = $node.attr('cc-loop-limit')*1;
		if (!this.limit) this.limit=0;
		
		
		
		// see what we have to loop
		var keys = [];
		if (!this.limit) {
			keys = Object.keys(attr.result).slice(this.offset);
		} else {
			keys = Object.keys(attr.result).slice(this.offset,this.offset+this.limit);
		}
		
		Circular.debug.write('@loop.in',attr.result,keys,'offset '+this.offset+', limit '+this.limit);
		
		this.index 	= 0;
		this.first 	= true;		
		for (var kc=0; kc<keys.length; kc++) {
			Circular.debug.write('@loop.in','index '+this.index,keys[kc]);
			this.key = keys[kc];
			this.last = (kc==keys.length-1);
			var context = '('+attr.expression+')["'+keys[kc]+'"]';
			var itemid = nodeid+'-item-'+keys[kc];
			$item = $node.children('#'+itemid+'.cc-loop-item');
			
			
			if ($item.size()) {
				// we already have it. just move it in place 
				Circular.debug.write('@loop.in','moving old item');
				Circular.watchdog.pass(node,'contentchanged');
				$item.appendTo($node).removeClass('cc-loop-expired');
				//console.log('moving in place',$item);
				Circular.engine.process($item.get(0),context);
			} else {
				// aint there. clone the template 
				Circular.debug.write('@loop.in','creating new item');
				Circular.watchdog.pass(node,'contentchanged');
				$item = $template.clone().appendTo($node)
					.removeClass('cc-loop-template cc-template')
					.removeAttr('cc-template')
					.addClass('cc-loop-item')
					.attr('id',itemid);
				Circular.engine.process($item.get(0),context);
				
			}
			this.first = false;
			this.index++;
		}
		
		// remove all the expired kids
		Circular.watchdog.pass(node,'contentchanged');
		$node.children('.cc-loop-expired').remove();
		Circular.debug.write('@loop.in done');
		return false;
	}
	
	
		
});



