
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
		'cc-loop-as'				: {},
		'cc-loop-offset' 		: {},
		'cc-loop-limit' 		: {},
		'cc-loop-template' 	: {},
		'cc-loop-item' 			: {},
		'cc-loop-tplsource' : {},	// the actual template
		'cc-loop-tplorigin' : {},	// a ref to the source
		'cc-loop-first' 		: {},
		'cc-loop-last' 			: {},
		'cc-loop-index' 		: {},
		'cc-loop-odd' 			: {},
		'cc-loop-even' 			: {},
		'cc-loop-sort' 			: {},
		'cc-loop-sortas' 		: {},
		'cc-loop-sortby' 		: {}
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
			var loopas		= '';
			var ctx				= ccattr.content.expression;
			
			if (ccnode.attributes['cc-loop-each']) {
				each = ccnode.attributes['cc-loop-each'].content.value;
			}
			if (ccnode.attributes['cc-loop-as']) {
				loopas = ccnode.attributes['cc-loop-as'].content.value;
			}
			
			//console.log(keys);
			for (var idx=0; idx<keys.length; idx++) {
				var itemctx = this.getItemContext(each,ctx,keys[idx],idx,loopas);
				var items 	= this.getNewItems($olditems,$templates,itemctx,keys,idx);
				//console.log(itemctx,items);
				newitems = newitems.concat(items);
			}
			this.appendNewItems($node,newitems);
			this.removeOldItems($olditems);
		} else {
			Circular.log.error('@loop','processCCLoop','max nesting '+this.config.maxnesting+' reached - something wrong ?');
		}
	},
	
	getTemplates		: function($node) {
		var tplsel = $node.attr('cc-loop-template');
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
		
		var $templates = $node.children();
		if ($templates.length && this.config.greedy) {
			$templates.attr('cc-loop-tplsource','');
		} else {
			var $contents = $node.contents();
			if ($contents.length==1 && $contents.get(0).nodeType==Node.ELEMENT_NODE) {
				$templates = $contents.eq(0);
				$templates.attr('cc-loop-tplsource','');
			} else {
				$node.wrapInner('<div cc-loop-tplsource>');
				$templates = $node.children('[cc-loop-tplsource]');
			}
		}
		
		var selectors = [];
		$templates.each(function() {
			var tid = Circular.engine.nodeid(this);
			// todo: check if such template exists?
			Circular.engine.stack($(this),Circular.loop.$stack);
			selectors.push('#'+tid);
		});
		$node.attr('cc-loop-template',selectors.join(','));
		
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
			
			// sort, sortas, sortby
			var sort 		= '';		// ascending, descending
			var sortas 	= 'string';	// number,string,stringnc
			var sortby 	= false;
			
			// sort, sortby, sortas			
			if (ccnode.attributes['cc-loop-sort']) {
				sort = ccnode.attributes['cc-loop-sort'].content.value;
				if (!Circular.parser.boolish(sort)) sort = false;
				if (sort==='') sort = 'ascending';
			}
			if (ccnode.attributes['cc-loop-sortas']) {
				sortas = ccnode.attributes['cc-loop-sortas'].content.value;
				if (!sortas) sortas = 'string';
			}
			if (ccnode.attributes['cc-loop-sortby']) {
				sortby = ccnode.attributes['cc-loop-sortby'].content.value;
				if (!sortby) sortby = false;
			}
			if (sort) {
				allkeys = allkeys.sort(this.compareFunction(sort,sortas,sortby,arr)); 
			}
							
					
			// offset, limit
			var offset 	= 0;
			var limit 	= false;
			if (ccnode.attributes['cc-loop-offset']) {
				offset = parseInt(ccnode.attributes['cc-loop-offset'].content.value);
			}
			if (ccnode.attributes['cc-loop-limit']) {
				limit = parseInt(ccnode.attributes['cc-loop-limit'].content.value);
			}
			if (!offset) offset=0;
			if (offset<0) offset=allkeys.length+offset;
			if (!limit && limit!==0) limit=allkeys.length-offset;
			if (limit<0) limit=allkeys.length-offset+limit;

			var keys = allkeys.slice(offset,offset+limit);
			
		} else {
			Circular.log.error('@loop','getKeys','no result',ccnode);
		}
		return keys;
	},
	
	getItemContext	: function(each,ctx,key,index,loopas) {
		var itemctx = '';
		switch(each) {
			
			case 'key': 
				var ekey = key.replace(/'/g, '\\\'');
				itemctx = '\''+ekey+'\'';
				break;
			case 'index': 
				itemctx = index;
				break;
			case 'item' :
				var ekey = key.replace(/'/g, '\\\'');
				itemctx = '({\'index\':'+index+',\'key\':\''+ekey+'\',\'value\':'+ctx+'[\''+ekey+'\']'+'})';
				break;
			default: 
				var ekey = key.replace(/'/g, '\\\'');
				itemctx = ctx+'[\''+ekey+'\']';
				break;
		}
		if (loopas) itemctx = '({\''+loopas+'\':'+itemctx+'})';
		//console.log(itemctx);
		return itemctx;
	},
	
	getNewItems			: function($olditems,$templates,itemctx,keys,idx) {
		// gets the new parsed templates for 1 element of the loop
		var newitems = [];
		$templates.each(function() {
			
			var tplsel = '#'+$(this).attr('id');
			var $newitem = $('[cc-loop-item][cc-context="'+itemctx+'"][cc-loop-tplorigin="'+tplsel+'"]',$olditems);
			if (!$newitem.length || $newitem.data('cc-loop-modified')) {
				$newitem = $(this).clone();
				$newitem.removeAttr('cc-loop-tplsource').removeAttr('id')
					.attr('cc-loop-item','').attr('cc-loop-tplorigin',tplsel)
					.attr('cc-context',itemctx);
			} else {
				$newitem.data('cc-loop-old',false);
			}
			
			// .. first,last..
			if (idx==0) {
				$newitem.addClass('cc-loop-first');
				var search = '[cc-loop-first="false"]';
				if ($newitem.is(search)) {
					$newitem.remove();
					return true;
				} else {
					var $remove = $(search,$newitem);
					if ($remove.length) {
						$newitem.data('cc-loop-modified',true);
						$newitem = $newitem.not($remove);
					}
				}
			} else {
				$newitem.removeClass('cc-loop-first');
				var search = '[cc-loop-first][cc-loop-first!="false"]';
				if ($newitem.is(search)) {
					$newitem.remove();
					return true;
				} else {
					var $remove = $(search,$newitem);
					if ($remove.length) {
						$newitem.data('cc-loop-modified',true);
						$newitem = $newitem.not($remove);
					}
				}
			}
			if (idx==keys.length-1) {
				$newitem.addClass('cc-loop-last');
				var search = '[cc-loop-last="false"]';
				if ($newitem.is(search)) {
					$newitem.remove();
					return true;
				} else {
					var $remove = $(search,$newitem);
					if ($remove.length) {
						$newitem.data('cc-loop-modified',true);
						$newitem = $newitem.not($remove);
					}
				}
			} else {
				$newitem.removeClass('cc-loop-last');
				var search = '[cc-loop-last][cc-loop-last!="false"]';
				if ($newitem.is(search)) {
					$newitem.remove();
					return true;
				} else {
					var $remove = $(search,$newitem);
					if ($remove.length) {
						$newitem.data('cc-loop-modified',true);
						$newitem = $newitem.not($remove);
					}
				}
			}
			
			
			// index ..
			var search = '[cc-loop-index][cc-loop-index!='+idx+']'
			if ($newitem.is(search)) {
				$newitem.remove();
				return true;
			}else {
				var $remove = $(search,$newitem);
				if ($remove.length) {
					$newitem.data('cc-loop-modified',true);
					$newitem = $newitem.not($remove);
				}
			}
			
			// odd,even ..
			if (idx%2) {
				$newitem.removeClass('cc-loop-odd').addClass('cc-loop-even');
				var search = '[cc-loop-odd]';
				if ($newitem.is(search)) {
					$newitem.remove();
					return true;
				} else {
					var $remove = $(search,$newitem);
					if ($remove.length) {
						$newitem.data('cc-loop-modified',true);
						$newitem = $newitem.not($remove);
					}
				}
			} else {
				$newitem.addClass('cc-loop-odd').removeClass('cc-loop-even');
				var search = '[cc-loop-even]';
				if ($newitem.is(search)) {
					$newitem.remove();
					return true;
				} else {
					var $remove = $(search,$newitem).addBack(search);
					if ($remove.length) {
						$newitem.data('cc-loop-modified',true);
						$newitem = $newitem.not($remove);
					}
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
	},

	compareFunction(sort,sortas,sortby,arr) {
		switch(sortas) {
			case 'number' :
				if (sort=='descending') {
					if (sortby) return function(a, b) { return parseFloat(arr[b][sortby])-parseFloat(arr[a][sortby]); }
					else return function(a, b) { return parseFloat(b)-parseFloat(a); }
				} else {
					if (sortby) return function(a, b) { return parseFloat(arr[a][sortby])-parseFloat(arr[b][sortby]); }
					else return function(a, b) { return parseFloat(a)-parseFloat(b); }
				}
				break;
			case 'string' :
				if (sort=='descending') {
					if (sortby) return function(a, b) { return arr[b][sortby].toString().localeCompare(arr[a][sortby].toString()); }
					else return function(a, b) { return b.toString().localeCompare(a.toString()); }
				} else {
					if (sortby) return function(a, b) { return arr[a][sortby].toString().localeCompare(arr[b][sortby].toString()); }
					else return function(a, b) { return a.toString().localeCompare(b.toString()); }
				}
				break;
			case 'stringnc' :
				if (sort=='descending') {
					if (sortby) return function(a, b) { 
						return arr[b][sortby].toString().toUpperCase().localeCompare(arr[a][sortby].toString().toUpperCase()); 
					}
					return function(a, b) { 
						return b.toString().toUpperCase().localeCompare(a.toString().toUpperCase()); 
					}
				} else {
					if (sortby) return function(a, b) { 
						return arr[b][sortby].toString().toUpperCase().localeCompare(arr[a][sortby].toString().toUpperCase()); 
					}
					return function(a, b) { 
						return a.toString().toUpperCase().localeCompare(b.toString().toUpperCase()); 
					}
				}
				break;
			default :
				return function(a, b) { return 0; }
		}
	}
	
		
});



