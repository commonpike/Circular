
/* ----------------------
	loop
----------------------- */

new CircularModule('loop',{

	config			: {
		greedy	: true // eat whitespace when creating template
	},
	
	attributes	: {
		'cc-loop' : {
			in	: function(ccattr,ccnode,node) {
				this.processCCLoop(ccattr,ccnode,node);
			}
		
		},
		'cc-loop-each'			: {},
		'cc-loop-offset' 		: {},
		'cc-loop-limit' 		: {},
		'cc-loop-source' 		: {},
		'cc-loop-template' 	: {},
		'cc-loop-item' 			: {},
		'cc-loop-first' 		: {},
		'cc-loop-last' 			: {}
	},
		
	// ---------------------------
	
	$templates			: null,
	processCCLoop	: function(ccattr,ccnode,node) {
		
		var $node				= $(node);
		var $template 	= this.getTemplate($node);
		var $olditems		= this.getOldItems($node);
		var newitems		= [];
		
		var keys 			= this.getKeys(ccnode);
		var each			= 'value';
		var ctx				= ccattr.content.expression;
		
		if (ccnode.attributes['cc-loop-each']) {
			each = ccnode.attributes['cc-loop-each'].content.value;
		}
		
		//console.log(keys);
		for (var idx=0; idx<keys.length; idx++) {
			var itemctx = this.getItemContext(each,ctx,keys[idx],idx);
			var $item 	= this.getNewItem($olditems,$template,itemctx,keys,idx);
			//console.log(itemctx,$item);
			newitems.push($item);
		}
		this.appendNewItems($node,newitems);
		this.removeOldItems($olditems);
	},
	
	getTemplate		: function($node) {
		var tplsel = $node.attr('cc-loop-source');
		if (!tplsel) return this.createTemplate($node);
		else return $(tplsel);
	},
	
	createTemplate	: function($node) {
	
		Circular.log.debug('@loop','createTemplate',$node);
		
		if (!this.$templates) {
			this.$templates = Circular.engine.stack($('<div id="cc-loop-templates">'));
		}
		
		var $template = $node.children('[cc-loop-template]');
		if (!$template.size()) {
			if ($node.children().length==1) {
				$template = $node.children();
				$template.attr('cc-loop-template','');
			} else {
				$node.wrapInner('<div cc-loop-template>');
				$template = $node.children('[cc-loop-template]');
			}
		}
		var tid = Circular.engine.nodeid($template);
		
		// todo: check if such template exists?
		
		// check all loop beneath this loop, not nested,
		// and create template for them first
		this.getSubloops($node).each(function() {
			Circular.loop.createTemplate($(this));
		});
		
		Circular.engine.stack($template,this.$templates);
		$node.attr('cc-loop-source','#'+tid);
		return $template;
	},
	
	getSubloops		: function($node) {
		// return the closest child loops only
		// http://stackoverflow.com/questions/13448113/match-first-matching-hierarchical-descendant-with-jquery-selectors
		return $node.children(':not([cc-loop])').andSelf().find('[cc-loop]:eq(0)');
	},
	
	getOldItems		: function($node) {
		var $olditems = $node.children('[cc-loop-item]');
		$olditems.data('cc-loop-old',true);
		Circular.log.debug('@loop','getOldItems',$olditems);
		return $olditems;
	},
	
	getKeys				: function(ccnode) {
		var keys = [];
		var arr = ccnode.attributes['cc-loop'].content.result;
		//console.log(ccnode,arr);
		if (arr) {
			var allkeys = Object.keys(arr);
			var offset = 0;
			if (ccnode.attributes['cc-offset']) {
				offset = ccnode.attributes['cc-offset'].content.value;
			}
			var limit = allkeys.length;
			if (ccnode.attributes['cc-limit']) {
				limit = ccnode.attributes['cc-limit'].content.value;
			}
			var keys = allkeys.slice(offset,offset+limit);
			// sort, filter
		} else {
			Circular.log.error('@loop','getKeys','no result',ccnode);
		}
		return keys;
	},
	
	getItemContext	: function(each,ctx,key,index) {
		var itemctx = '';
		switch(each) {
			
			case 'key': 
				itemctx = key;
				break;
			case 'index': 
				itemctx = index;
				break;
			case 'item' :
				var ekey = key.replace(/'/g, '\\\'');
				itemctx = '{index:'+index+',key:\''+ekey+'\',value:'+ctx+'[\''+ekey+'\']'+'}';
				break;
			default: 
				var ekey = key.replace(/'/g, '\\\'');
				itemctx = ctx+'[\''+ekey+'\']';
				break;
		}
		return itemctx;
	},
	
	getNewItem			: function($olditems,$template,itemctx,keys,idx) {
		var $newitem = $('[cc-loop-item][cc-context="{{'+itemctx+'}}"]',$olditems);
		if (!$newitem.length || $newitem.data('cc-loop-modified')) {
			$newitem = $template.clone();
			$newitem.removeAttr('cc-loop-template').removeAttr('id').attr('cc-loop-item','');
		} else {
			$newitem.data('cc-loop-old',false);
		}
		$newitem.attr('cc-context',itemctx);
		
		// .. first,last..
		if (idx==0) {
			$newitem.addClass('cc-loop-first');
		} else {
			$newitem.removeClass('cc-loop-first');
			var $remove = $('[cc-loop-first]',$newitem);
			if ($remove.length) {
				$newitem.data('cc-loop-modified',true);
				$remove.remove();
			}
		}
		if (idx==keys.length-1) {
			$newitem.addClass('cc-loop-last');
		} else {
			$newitem.removeClass('cc-loop-last');
			var $remove = $('[cc-loop-last]',$newitem);
			if ($remove.length) {
				$newitem.data('cc-loop-modified',true);
				$remove.remove();
			}
		}
		
		// index ..
		var $remove = $('[cc-loop-index][cc-loop-index!='+idx+']',$newitem);
		if ($remove.length) {
			$newitem.data('cc-loop-modified',true);
			$remove.remove();
		}
		
		// odd,even ..
		if (idx%2) {
			$newitem.removeClass('cc-loop-odd').addClass('cc-loop-even');
			var $remove = $('[cc-loop-odd]',$newitem);
			if ($remove.length) {
				$newitem.data('cc-loop-modified',true);
				$remove.remove();
			}
		} else {
			$newitem.addClass('cc-loop-odd').removeClass('cc-loop-even');
			var $remove = $('[cc-loop-even]',$newitem);
			if ($remove.length) {
				$newitem.data('cc-loop-modified',true);
				$remove.remove();
			}
		}
		return $newitem;
	},
	
	appendNewItems	: function($node,newitems) {
		Circular.log.debug('@loop','appendNewItems',newitems);
		$node.append(newitems);
	},
	
	removeOldItems($olditems) {
		Circular.log.debug('@loop','removeOldItems',$olditems);
		$olditems.each(function() {
			var $this = $(this);
			if ($this.data('cc-loop-old')) {
				$this.remove();
			}
		});
	}

	
	
		
});



