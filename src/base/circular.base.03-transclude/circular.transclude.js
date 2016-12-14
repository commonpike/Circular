
/* ----------------------
	@transclude
----------------------- */

new CircularModule('transclude',{

	attributes	: {
	
		
		
		'cc-transclude-base': { 
			in	: function(ccattr,ccnode,node) {
				//alert('cc-transclude-base');
				if (ccattr.flags.attrdomchanged || ccattr.flags.attrdatachanged) {	
					var $node = $(node);
					var transattr = Circular.modules.prefix('cc-transclude');
					var baseattr = Circular.modules.prefix('cc-transclude-base');
					var selattr = Circular.modules.prefix('cc-transclude-sel');
					var $transnodes = $node.find('['+transattr+']');
					$transnodes.each(function() {
						var $transnode = $(this);
						$transnode.attr(selattr,$node.attr(baseattr)+' '+$transnode.attr(transattr));
					});
				}
			}
		},
		
		'cc-transclude-if' : { 
			
			in	: function(ccattr,ccnode,node) {
				//alert('cc-transclude');
				var $node = $(node);
				var baseattr = Circular.modules.prefix('cc-transclude-base');
				var $basenode = $node.parents('['+baseattr+']').eq(0);
				if ($basenode.length) {
					var selval = $basenode.attr(baseattr)+' '+ccattr.content.value;
					if (!$(selval).length) {
						Circular.log.debug('@transclude','cc-transclude-if','false',selval);
						Circular.eject.flag(node,ccnode,'cc-transclude-if');
						return false;
					} else {
						Circular.eject.unflag(node,ccnode,'cc-transclude-if');
						Circular.log.debug('@transclude','cc-transclude-if','true',selval);
					}
				}	else {
					Circular.log.warn('@transclude','cc-transclude','no basenode');
				}
			}
		
		},
		
		'cc-transclude-sel' : {
			in	: function(ccattr,ccnode,node) {
				//alert('cc-transclude-sel');
				var $node = $(node);
				var $transnode = $(ccattr.content.value);
				var padattr = Circular.modules.prefix('cc-transclude-pad');
				var pad = '';
				if (ccnode.attributes[padattr]) {
					pad = ccnode.attributes[padattr].content.value;
					if (!pad) pad=" ";
				}
				if ($transnode.length) {
					Circular.log.debug('@transclude','cc-transclude-sel','inserting',ccattr.content.value);
					$node.empty().append(pad).append($transnode.contents().clone()).append(pad);
				}	else {
					Circular.log.debug('@transclude','cc-transclude-sel','no source',ccattr.content.value);
				}
			}
		},
		
		'cc-transclude' : { 
			
			in	: function(ccattr,ccnode,node) {
				//alert('cc-transclude');
				var $node = $(node);
				var baseattr = Circular.modules.prefix('cc-transclude-base');
				var selattr = Circular.modules.prefix('cc-transclude-sel');
				var $basenode = $node.parents('['+baseattr+']').eq(0);
				if ($basenode.length) {
					var selval = $basenode.attr(baseattr)+' '+ccattr.content.value;
					Circular.log.debug('@transclude','cc-transclude','setting',selattr,selval);
					
					var orgval = $node.attr(selattr);
					if (!orgval) {
						// this node may not be watched, causing .. confusion
						Circular.queue.add(function() {$node.attr(selattr,selval)});
					} else if (orgval!=selval) {
						$node.attr(selattr,selval);
					}
				}	else {
					Circular.log.warn('@transclude','cc-transclude','no basenode');
				}
			}
		
		},
		
		'cc-transclude-pad' : {
			// ignore
		}
		
	}
	
	
	
	
		
});



