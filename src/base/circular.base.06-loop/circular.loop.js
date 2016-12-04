
/* ----------------------
	loop
----------------------- */

new CircularModule('loop',{

	config			: {
		greedy			: true, // eat whitespace when creating template
		maxnesting	: 500		// avoid eternal loops
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
		'cc-loop-template' 	: {},
		'cc-loop-tplsrc' 	: {},
		'cc-loop-item' 			: {},
		'cc-loop-itemsrc' 		: {},
		'cc-loop-first' 		: {},
		'cc-loop-last' 			: {},
		'cc-loop-odd' 			: {},
		'cc-loop-even' 			: {}
	},
		
	// ---------------------------
	
	$stack			: null,
	processCCLoop	: function(ccattr,ccnode,node) {
		
		var $node				= $(node);		
		if ($node.parents('[cc-loop]').length<this.config.maxnesting) {
			var $templates 	= this.getTemplates($node);
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
				var items 	= this.getNewItems($olditems,$templates,itemctx,keys,idx);
				console.log(itemctx,items);
				newitems = newitems.concat(items);
			}
			this.appendNewItems($node,newitems);
			this.removeOldItems($olditems);
		} else {
			Circular.log.error('@loop','processCCLoop','max nesting '+this.config.maxnesting+' reached - something wrong ?');
		}
	},
	
	getTemplates		: function($node) {
		var tplsel = $node.attr('cc-loop-tplsrc');
		if (!tplsel) return this.createTemplates($node);
		else return $(tplsel);
	},
	
	createTemplates	: function($node) {

		Circular.log.debug('@loop','createTemplates',$node);
		
		if (!this.$stack) {
			this.$stack = Circular.engine.stack($('<div id="cc-loop-stack">'));
		}
		
		// check all loops beneath this loop, not nested,
		// and create templates for them first
		this.getSubloops($node).each(function() {
			Circular.loop.createTemplates($(this));
		});
		
		var $templates = [];
		if (this.config.greedy) {
			// we only process child *nodes*
			$templates = $node.children();
			$templates.attr('cc-loop-template','');
		} else {
			var $contents = $(node).contents();
			if ($contents.length==1 && $contents.get(0).nodeType==Node.ELEMENT_NODE) {
				$templates = $contents.eq(0);
				$templates.attr('cc-loop-template','');
			} else {
				$node.wrapInner('<div cc-loop-template>');
				$templates = $node.children('[cc-loop-template]');
			}
		}
		
		var selectors = [];
		$templates.each(function() {
			var tid = Circular.engine.nodeid(this);
			// todo: check if such template exists?
			Circular.engine.stack($(this),Circular.loop.$stack);
			selectors.push('#'+tid);
		});
		$node.attr('cc-loop-tplsrc',selectors.join(','));
		
		return $templates;
		
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
	
	getNewItems			: function($olditems,$templates,itemctx,keys,idx) {
		var newitems = [];
		$templates.each(function() {
			
			var tplsel = '#'+$(this).attr('id');
			var $newitem = $('[cc-loop-item][cc-context="'+itemctx+'"][cc-loop-itemsrc="'+tplsel+'"]',$olditems);
			if (!$newitem.length || $newitem.data('cc-loop-modified')) {
				$newitem = $(this).clone();
				$newitem.removeAttr('cc-loop-template').removeAttr('id')
					.attr('cc-loop-item','').attr('cc-loop-itemsrc',tplsel)
					.attr('cc-context',itemctx);
			} else {
				$newitem.data('cc-loop-old',false);
			}
			
			// .. first,last..
			if (idx==0) {
				$newitem.addClass('cc-loop-first');
			} else {
				$newitem.removeClass('cc-loop-first');
				var search = '[cc-loop-first]';
				var $remove = $(search,$newitem).addBack(search);
				if ($remove.length) {
					$newitem.data('cc-loop-modified',true);
					$remove.remove();
				}
			}
			if (idx==keys.length-1) {
				$newitem.addClass('cc-loop-last');
			} else {
				$newitem.removeClass('cc-loop-last');
				var search = '[cc-loop-last]';
				var $remove = $(search,$newitem).addBack(search);
				if ($remove.length) {
					$newitem.data('cc-loop-modified',true);
					$remove.remove();
				}
			}
			
			// index ..
			var search = '[cc-loop-index][cc-loop-index!='+idx+']'
			var $remove = $(search,$newitem).addBack(search);
			if ($remove.length) {
				$newitem.data('cc-loop-modified',true);
				$remove.remove();
			}
			
			// odd,even ..
			if (idx%2) {
				$newitem.removeClass('cc-loop-odd').addClass('cc-loop-even');
				var search = '[cc-loop-odd]';
				var $remove = $(search,$newitem).addBack(search);
				if ($remove.length) {
					$newitem.data('cc-loop-modified',true);
					$remove.remove();
				}
			} else {
				$newitem.addClass('cc-loop-odd').removeClass('cc-loop-even');
				var search = '[cc-loop-even]';
				var $remove = $(search,$newitem).addBack(search);
				if ($remove.length) {
					$newitem.data('cc-loop-modified',true);
					$remove.remove();
				}
			}
			newitems.push($newitem);
		});
		return newitems;
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



