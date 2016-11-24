
/* ----------------------
	@transclude
----------------------- */

new CircularModule('transclude',{

	attributes	: {
	
		'cc-transclude-base': { 
			in	: function(ccattr,ccnode,node) {
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
		'cc-transclude' : { },
		'cc-transclude-sel' : {
			in	: function(ccattr,ccnode,node) {
				var $node = $(node);
				var $transnode = $(ccattr.content.value);
				if ($transnode.size()) {
					Circular.log.debug('@transclude','cc-transclude-sel','inserting',ccattr.content.value);
					$node.empty().append($transnode.contents().clone());
				}			
			}
		}
		
		
		
	}
	
	
		
});



