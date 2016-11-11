
/* ----------------------
	template
----------------------- */

new CircularModule({

	name				: 'loop',
	requires		: ['debug','context'],
	attributes	: ['cc-loop'],
	watches			: ['cc-loop-offset', 'cc-loop-limit' ],
	css					: '' +
		'.cc-loop-template, .cc-loop-hide, .cc-loop-cached { display:none; } ' +
		'.cc-loop-item, .cc-loop-first, .cc-loop-last {} ',

	genid		: 0,
	offset	: 0,
	limit		: 0,
	index		: 1,	// start at one !
	key			: undefined,
	first		: false,
	last		: false,
	greedy	: true, // eat whitespace when creating template
	
	in	: function(ccattr,ccnode,node) {

		Circular.log.debug('@loop.in',node);
		
		var $node = $(node);
		
		// make sure it has an id
		var nodeid = $node.attr('id');
		if (!nodeid) {
			nodeid = 'cc-loop-'+this.genid++;
			$node.attr('id',nodeid);
		}
		
		// set the parent context for all children
		Circular.context.set(attr.expression);
		if ($node.attr('cc-context') != attr.expression) {
			$node.attr('cc-context',attr.expression);
		}
		
		// find a template or make one
		var $template = $node.children('.cc-loop-template');
		if (!$template.size()) {
			Circular.log.debug('@loop.in','creating template');
			Circular.watchdog.pass(node,'contentchanged');
			if ($node.children().size()==1 && ($node.contents().size()==1 || this.greedy)) {
				$template = $node.children().addClass('cc-loop-template');
			} else {
				Circular.log.debug('@loop.in','adding template wrapper');
				$node.contents().wrapAll('<div  class="cc-loop-template"></div>');
				$template = $node.children('.cc-loop-template');
			}
		}
		
		// mark all other children cached
		$node.children(':not(.cc-loop-template)').addClass('cc-loop-cached');

		// check for offset and limit
		this.offset = $node.attr('cc-loop-offset')*1;
		if (!this.offset) this.offset =0;
		this.limit = $node.attr('cc-loop-limit')*1;
		if (!this.limit) this.limit=0;
		
		// see what we have to loop
		var keys = [];
		if (!this.limit) {
			keys = Object.keys(ccattr.content.result).slice(this.offset);
		} else {
			keys = Object.keys(ccattr.content.result).slice(this.offset,this.offset+this.limit);
		}
		
		Circular.log.debug('@loop.in',ccattr.content.result,keys,'offset '+this.offset+', limit '+this.limit);
		
		this.index 	= 1;
		this.first 	= true;		
		var $curr = null;
		for (var kc=0; kc<keys.length; kc++) {
			Circular.log.debug('@loop.in','index '+this.index,keys[kc]);
			this.key = keys[kc];
			this.last = (kc==keys.length-1);

			//var context = '{{#'+keys[kc]+'}}';
			var context = "{{#this['"+keys[kc]+"']}}";
			
			var itemid = nodeid+'-item-'+(kc+this.offset);
			
			$item = $node.children('#'+itemid+'.cc-loop-item');
			if (!$item.size()) {
				// clone the template 
				Circular.log.debug('@loop.in','creating new item '+itemid);
				$item = $template.clone()
					.removeClass('cc-loop-template')
					.addClass('cc-loop-item')
					.addClass('cc-loop-index-'+this.index)
					.attr('id',itemid)
					.attr('cc-context',context);
				if (!$curr) $item.prependTo($node);
				else $item.insertAfter($curr);
				
			} else {
			
				//	we already have it. just move it in place 
				Circular.log.debug('@loop.in','moving old item '+itemid);
				$item.removeClass('cc-loop-cached');
				if (!$curr) $item.appendTo($node);
				else $item.insertAfter($curr)
				
			}
			if (this.first) $item.addClass('cc-loop-first');
			else $item.removeClass('cc-loop-first');
			if (this.last) $item.addClass('cc-loop-last');
			else $item.removeClass('cc-loop-last');
			this.process($item);	
			$curr = $item;
				
			this.first = false;
			this.index++;
		}
		
		// clean up cached items
		$node.children('.cc-loop-cached').each(function() {
			this.className = this.className.replace(/cc-loop-index-\d+/,'');
			$(this).removeClass('cc-loop-first cc-loop-last cc-loop-hide').
				attr('cc-loop-index','').
				attr('cc-loop-key','').
				attr('cc-loop-first','').
				attr('cc-loop-last','');
		});
		
		Circular.log.debug('@loop.in done');
	},
	
	process	: function($item) {
		Circular.log.debug('@loop.process',$item);
		var loop = this;
		
		$item.filter('[cc-loop-first]').add($('[cc-loop-first]',$item)).each(function() {
			if (loop.first) {
				$(this).attr('cc-loop-first','true').addClass('cc-loop-first');
			} else {
				$(this).attr('cc-loop-first','false').removeClass('cc-loop-first');
			}
		});
		
		$item.filter('[cc-loop-last]').add($('[cc-loop-last]',$item)).each(function() {
			if (loop.last) {
				$(this).attr('cc-loop-last','true').addClass('cc-loop-last');
			} else {
				$(this).attr('cc-loop-last','false').removeClass('cc-loop-last');
			}
		});
		
		$item.filter('[cc-loop-index]').add($('[cc-loop-index]',$item)).each(function() {
			this.className = this.className.replace(/cc-loop-index-\d+/,'');
			$(this).attr('cc-loop-index',loop.index).addClass('cc-loop-index-'+loop.index);
		});
		
		$item.filter('[cc-loop-key]').add($('[cc-loop-key]',$item)).each(function() {
			$(this).attr('cc-loop-key',loop.key);
			// cant trust the key to be a valid classname
		});
		
		$item.filter('[cc-loop-show],[cc-loop-hide]').add($('[cc-loop-show],[cc-loop-hide]',$item)).each(function() {
			var res = false, action="show";
			var cond = $(this).attr('cc-loop-show');
			if (!cond) {
				cond = $(this).attr('cc-loop-hide');
				action="hide";
			}
			if (cond.substring(0,1)==':') {
				res = (loop.key == cond.substring(1));
			} else if (cond=='first') {
				res = loop.first;
			} else if (cond=='last') {
				res = loop.last;
			} else {
				res = (loop.index == cond);
			}
			if (action=="show") {
				if (res) $(this).removeClass('cc-loop-hide');
				else $(this).addClass('cc-loop-hide');			
			} else {
				if (res) $(this).addClass('cc-loop-hide');
				else $(this).removeClass('cc-loop-hide');			
			}
		});	
		
	}
	
	
		
});



